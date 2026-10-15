import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { NavController, IonButton, IonCheckbox, IonInput } from '@ionic/angular/standalone';
import { isEmpty } from 'idea-toolbox';
import { IDEAEnvironment, IDEALoadingService, IDEATranslationsService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from '../auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';
import { IDEAAuthPasswordFieldComponent } from './authPasswordField.component';
import { IDEAAuthPasswordRequirementsComponent } from './authPasswordRequirements.component';

/**
 * The registration of a new account, when the project allows it.
 */
@Component({
  selector: 'idea-auth-sign-up',
  imports: [
    IDEATranslatePipe,
    IDEAAuthShellComponent,
    IDEAAuthNoticeComponent,
    IDEAAuthPasswordFieldComponent,
    IDEAAuthPasswordRequirementsComponent,
    IonButton,
    IonCheckbox,
    IonInput
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <idea-auth-shell>
      <div class="idea-auth-heading">
        <h1 class="idea-auth-title">{{ 'IDEA_AUTH.NEW_ACCOUNT' | translate }}</h1>
        <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.REGISTER_A_NEW_ACCOUNT_TO_THE_SYSTEM' | translate }}</p>
      </div>
      <idea-auth-notice [notice]="notice()" />
      <div class="idea-auth-form">
        <div class="idea-auth-field">
          <label id="idea-auth-sign-up-email" class="idea-auth-label" (click)="emailField.setFocus()">
            {{ 'IDEA_AUTH.EMAIL' | translate }}
          </label>
          <ion-input
            #emailField
            testId="signup.email"
            class="idea-auth-input"
            type="email"
            inputmode="email"
            autocomplete="email"
            spellcheck="false"
            autocapitalize="off"
            aria-labelledby="idea-auth-sign-up-email"
            [value]="email()"
            (ionInput)="email.set($event.detail.value)"
          />
        </div>
        <div class="idea-auth-field">
          <label id="idea-auth-sign-up-password" class="idea-auth-label" (click)="passwordField.focus()">
            {{ 'IDEA_AUTH.PASSWORD' | translate }}
          </label>
          <idea-auth-password-field
            #passwordField
            testId="signup.password"
            labelledBy="idea-auth-sign-up-password"
            describedBy="idea-auth-sign-up-requirements"
            autocomplete="new-password"
            [(value)]="password"
            (enter)="register()"
          />
        </div>
        <idea-auth-password-requirements listId="idea-auth-sign-up-requirements" [password]="password()" />
        @if (hasAgreements) {
          <div class="idea-auth-agreements">
            <ion-checkbox
              class="idea-auth-checkbox"
              labelPlacement="end"
              justify="start"
              [checked]="agreementsAccepted()"
              (ionChange)="agreementsAccepted.set($event.detail.checked)"
            >
              {{ 'IDEA_AUTH.AGREEMENTS_CHECK_REGISTRATION' | translate }}:
            </ion-checkbox>
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
          </div>
        }
      </div>
      <div class="idea-auth-actions">
        <ion-button
          testId="signUpButton"
          class="idea-auth-button"
          expand="block"
          [disabled]="!canRegister()"
          (click)="register()"
        >
          {{ 'IDEA_AUTH.CREATE_AN_ACCOUNT' | translate }}
        </ion-button>
        <button testId="resendLinkButton" type="button" class="idea-auth-link" (click)="goToResendLink()">
          {{ 'IDEA_AUTH.HAVEN_T_RECEIVED_CONFIRMATION_LINK' | translate }}
        </button>
        <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
          {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
        </button>
      </div>
    </idea-auth-shell>
  `
})
export class IDEAAuthSignUpPage {
  private _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  advancedPasswordCheck: boolean = this._env.idea.auth.passwordPolicy?.advancedPasswordCheck;
  hasAgreements =
    this.translationExists('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') ||
    this.translationExists('IDEA_VARIABLES.PRIVACY_POLICY_URL');

  email = signal<string>('');
  password = signal<string>('');
  agreementsAccepted = signal(false);
  notice = signal<IDEAAuthNotice>(null);
  canRegister = computed(
    (): boolean =>
      this._auth.validatePasswordAgainstPolicy(this.password()).length === 0 &&
      (!this.hasAgreements || this.agreementsAccepted())
  );

  emailInput = viewChild<IonInput>('emailField');

  ionViewWillEnter(): void {
    if (!this._env.idea.auth.registrationIsPossible) return this.backToSignIn();
    this.notice.set(null);
    this.password.set('');
  }
  ionViewDidEnter(): void {
    if (this._env.idea.auth.registrationIsPossible) this.emailInput()?.setFocus();
  }

  async register(): Promise<void> {
    if (!this.canRegister()) return;
    this.notice.set(null);
    const email = (this.email() ?? '').trim();
    if (isEmpty(email, 'email')) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.VALID_EMAIL_OBLIGATORY' });
      return;
    }
    try {
      await this._loading.show();
      if (this.advancedPasswordCheck) {
        const emailParts = email.split('@')[0].split(/\W/g);
        const errors = await this._auth.validatePasswordAgainstDatabases(this.password(), emailParts);
        if (errors.length) {
          this.notice.set({ kind: 'error', message: 'IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(errors[0]) });
          return;
        }
      }
      await this._auth.register(email, this.password());
      this._flow.email.set(email);
      this._flow.setNotice({ kind: 'success', message: 'IDEA_AUTH.REGISTRATION_COMPLETED' });
      this.backToSignIn();
    } catch (err) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.REGISTRATION_FAILED', detail: (err as Error)?.message });
    } finally {
      this._loading.hide();
    }
  }

  translationExists(key: string): boolean {
    return !!this._translate._(key);
  }
  goToResendLink(): void {
    const email = (this.email() ?? '').trim();
    if (email) this._flow.email.set(email);
    this._nav.navigateForward(['auth', 'resend-link']);
  }
  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
