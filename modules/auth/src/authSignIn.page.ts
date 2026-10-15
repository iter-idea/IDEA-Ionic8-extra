import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { NavController, IonButton, IonInput } from '@ionic/angular/standalone';
import { isEmpty } from 'idea-toolbox';
import { IDEAEnvironment, IDEALoadingService, IDEATranslationsService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService, LoginOutcomeActions } from './auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';
import { IDEAAuthPasswordFieldComponent } from './authPasswordField.component';

/**
 * The sign-in: the email first, then the password (or the page of the email's external provider).
 */
@Component({
  selector: 'idea-auth-sign-in',
  imports: [
    IDEATranslatePipe,
    IDEAAuthShellComponent,
    IDEAAuthNoticeComponent,
    IDEAAuthPasswordFieldComponent,
    IonButton,
    IonInput
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <idea-auth-shell>
      @if (step() === 'email') {
        <div class="idea-auth-heading">
          <h1 class="idea-auth-title">{{ 'IDEA_AUTH.SIGN_IN' | translate }}</h1>
          <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.SIGN_IN_TO_CONTINUE' | translate }}</p>
        </div>
        <idea-auth-notice [notice]="notice()" />
        <div class="idea-auth-form">
          <div class="idea-auth-field">
            <label id="idea-auth-sign-in-email" class="idea-auth-label" (click)="emailInput()?.setFocus()">
              {{ 'IDEA_AUTH.EMAIL' | translate }}
            </label>
            <ion-input
              testId="signin.email"
              class="idea-auth-input"
              type="email"
              inputmode="email"
              autocomplete="username"
              spellcheck="false"
              autocapitalize="off"
              enterkeyhint="next"
              aria-labelledby="idea-auth-sign-in-email"
              [value]="email()"
              (ionInput)="email.set($event.detail.value)"
              (keyup.enter)="continue()"
            />
          </div>
        </div>
        <div class="idea-auth-actions">
          <ion-button testId="continueButton" class="idea-auth-button" expand="block" (click)="continue()">
            {{ 'IDEA_AUTH.CONTINUE' | translate }}
          </ion-button>
          @if (registrationIsPossible) {
            <button testId="createAnAccountButton" type="button" class="idea-auth-link" (click)="goTo('sign-up')">
              {{ 'IDEA_AUTH.CREATE_AN_ACCOUNT' | translate }}
            </button>
          }
        </div>
      } @else {
        <div class="idea-auth-heading">
          <h1 class="idea-auth-title">{{ 'IDEA_AUTH.ENTER_YOUR_PASSWORD' | translate }}</h1>
        </div>
        <div class="idea-auth-chip">
          <span class="idea-auth-chip-email">{{ email() }}</span>
          <button
            type="button"
            class="idea-auth-link"
            [title]="'IDEA_AUTH.EDIT_EMAIL' | translate"
            (click)="editEmail()"
          >
            {{ 'IDEA_AUTH.CHANGE_EMAIL' | translate }}
          </button>
        </div>
        <idea-auth-notice [notice]="notice()" />
        <div class="idea-auth-form">
          <!-- the email, for the password managers: the pair they save is this one -->
          <input
            class="idea-auth-visually-hidden"
            type="email"
            autocomplete="username"
            tabindex="-1"
            aria-hidden="true"
            readonly
            [value]="email()"
          />
          <div class="idea-auth-field">
            <label id="idea-auth-sign-in-password" class="idea-auth-label" (click)="passwordField()?.focus()">
              {{ 'IDEA_AUTH.PASSWORD' | translate }}
            </label>
            <idea-auth-password-field
              testId="signin.password"
              labelledBy="idea-auth-sign-in-password"
              [(value)]="password"
              (enter)="signIn()"
            />
            <button
              testId="forgotPasswordButton"
              type="button"
              class="idea-auth-link"
              (click)="goTo('forgot-password')"
            >
              {{ 'IDEA_AUTH.I_FORGOT_MY_PASSWORD' | translate }}
            </button>
          </div>
        </div>
        <div class="idea-auth-actions">
          @if (showAgreements) {
            <p class="idea-auth-agreements">
              {{ 'IDEA_AUTH.BY_SIGNING_IN_YOU_ACCEPT' | translate }}
              @if (translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL')) {
                <a target="_blank" rel="noopener" [href]="'IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL' | translate">{{
                  'IDEA_AUTH.TERMS_AND_CONDITIONS' | translate
                }}</a>
              }
              @if (
                translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') &&
                translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL')
              ) {
                {{ 'IDEA_AUTH.AND' | translate }}
              }
              @if (translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL')) {
                <a target="_blank" rel="noopener" [href]="'IDEA_VARIABLES.PRIVACY_POLICY_URL' | translate">{{
                  'IDEA_AUTH.PRIVACY_POLICY' | translate
                }}</a>
              }
            </p>
          }
          <ion-button testId="signInButton" class="idea-auth-button" expand="block" (click)="signIn()">
            {{ 'IDEA_AUTH.SIGN_IN' | translate }}
          </ion-button>
        </div>
      }
    </idea-auth-shell>
  `
})
export class IDEAAuthSignInPage {
  private _env = inject(IDEAEnvironment);
  private _injector = inject(Injector);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  registrationIsPossible: boolean = this._env.idea.auth.registrationIsPossible;
  externalProviders: { type: string; name: string; emailDomains: string[] }[] =
    this._env.aws.cognito?.externalProviders || [];
  // who can register accepted the agreements when registering
  showAgreements =
    !this.registrationIsPossible &&
    (this.translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') ||
      this.translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL'));

  step = signal<'email' | 'password'>('email');
  email = signal<string>('');
  password = signal<string>('');
  notice = signal<IDEAAuthNotice>(null);

  emailInput = viewChild(IonInput);
  passwordField = viewChild(IDEAAuthPasswordFieldComponent);

  ionViewWillEnter(): void {
    this.notice.set(this._flow.takeNotice());
    this.password.set('');
    // coming from another page of the flow, the email is known: the sign-in goes on from the password
    const email = this._flow.email();
    if (email) this.email.set(email);
    this.step.set(email ? 'password' : 'email');
  }
  ionViewDidEnter(): void {
    // at the first visit, no keyboard that covers the page: only the password, when it's what's left
    if (this.step() === 'password') this.passwordField()?.focus();
  }

  continue(): void {
    this.notice.set(null);
    const email = (this.email() ?? '').trim();
    if (isEmpty(email, 'email')) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.VALID_EMAIL_OBLIGATORY' });
      return;
    }
    this.email.set(email);
    this._flow.email.set(email);
    const provider = this.externalProviders.find(p => p.emailDomains.includes(email.split('@')[1]));
    if (provider) {
      this._nav.navigateForward(['auth', provider.type], { queryParams: { provider: provider.name, go: true } });
      return;
    }
    this.step.set('password');
    afterNextRender((): void => void this.passwordField()?.focus(), { injector: this._injector });
  }
  editEmail(): void {
    this.notice.set(null);
    this.password.set('');
    this.step.set('email');
    afterNextRender((): void => void this.focusEmail(), { injector: this._injector });
  }

  private async focusEmail(): Promise<void> {
    const input = this.emailInput();
    if (!input) return;
    await input.getInputElement();
    await input.setFocus();
  }

  async signIn(): Promise<void> {
    this.notice.set(null);
    try {
      await this._loading.show();
      const outcome = await this._auth.login(this.email(), this.password());
      if (outcome === LoginOutcomeActions.NEW_PASSWORD) this._nav.navigateForward(['auth', 'new-password']);
      else if (outcome === LoginOutcomeActions.MFA_CHALLENGE) this._nav.navigateForward(['auth', 'mfa-challenge']);
      else if (outcome === LoginOutcomeActions.MFA_SETUP) this._nav.navigateForward(['auth', 'setup-mfa']);
      else window.location.assign('');
    } catch (err) {
      this.notice.set({ kind: 'error', message: this.signInErrorMessage(err as Error) });
    } finally {
      this._loading.hide();
    }
  }
  private signInErrorMessage(err: Error): string {
    if (err?.name === 'UserNotConfirmedException') return 'IDEA_AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN';
    if (err?.name === 'UserLambdaValidationException' && err.message?.includes('@IDEA_COGNITO_TRANSITION'))
      return 'IDEA_AUTH.CHANGE_YOUR_PASSWORD_TO_LOGIN';
    return 'IDEA_AUTH.AUTHENTICATION_FAILED';
  }

  goTo(page: string): void {
    this._nav.navigateForward(['auth', page]);
  }
  translationExists(key: string): boolean {
    return !!this._translate._(key);
  }
}
