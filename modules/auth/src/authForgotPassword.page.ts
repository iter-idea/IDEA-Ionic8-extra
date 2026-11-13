import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { NavController, IonButton, IonInput, IonContent } from '@ionic/angular/standalone';
import { isEmpty } from 'idea-toolbox';
import { IDEAEnvironment, IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';
import { ExternalProvider, getExternalProviderOfEmail, getExternalProviderSignInRoute } from './sso.helpers';

/**
 * The request of a password reset: Cognito sends a code to the email. An email of an external provider's domain gets
 * no code (its account has no password of the app, or one it can't use): the page says so and offers the provider's
 * sign-in instead.
 */
@Component({
  selector: 'idea-auth-forgot-password',
  imports: [IDEATranslatePipe, IDEAAuthShellComponent, IDEAAuthNoticeComponent, IonButton, IonInput, IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content class="idea-auth">
      <idea-auth-shell>
        <div class="idea-auth-heading">
          <h1 class="idea-auth-title">{{ 'IDEA_AUTH.PASSWORD_RESET' | translate }}</h1>
          <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.PASSWORD_RESET_HINT' | translate }}</p>
        </div>
        <idea-auth-notice [notice]="notice()" />
        <div class="idea-auth-form">
          <div class="idea-auth-field">
            <div class="idea-auth-label-row">
              <label id="idea-auth-forgot-password-email" class="idea-auth-label" (click)="emailInput()?.setFocus()">
                {{ 'IDEA_AUTH.EMAIL' | translate }}
              </label>
              <button
                testId="insertResetCodeButton"
                type="button"
                class="idea-auth-link"
                (click)="goToConfirmPassword()"
              >
                {{ 'IDEA_AUTH.ALREADY_HAVE_A_RESET_CODE' | translate }}
              </button>
            </div>
            <ion-input
              testId="forgotpassword.email"
              class="idea-auth-input"
              type="email"
              inputmode="email"
              autocomplete="username"
              spellcheck="false"
              autocapitalize="off"
              aria-labelledby="idea-auth-forgot-password-email"
              [enterkeyhint]="provider() ? 'go' : 'send'"
              [value]="email()"
              (ionInput)="onEmailInput($event.detail.value)"
              (keyup.enter)="submit()"
            />
          </div>
        </div>
        <div class="idea-auth-actions">
          <!-- one button that changes, so that the keyboard's focus stays on it -->
          <ion-button
            class="idea-auth-button"
            expand="block"
            [attr.testId]="provider() ? 'signInWithCompanyAccountButton' : 'resetPasswordButton'"
            (click)="submit()"
          >
            {{ (provider() ? 'IDEA_AUTH.SIGN_IN_WITH_COMPANY_ACCOUNT' : 'IDEA_AUTH.RESET_MY_PASSWORD') | translate }}
          </ion-button>
          <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
            {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
          </button>
        </div>
      </idea-auth-shell>
    </ion-content>
  `
})
export class IDEAAuthForgotPasswordPage {
  private _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  externalProviders: ExternalProvider[] = this._env.aws.cognito?.externalProviders || [];

  email = signal<string>('');
  notice = signal<IDEAAuthNotice>(null);
  /**
   * The external provider of the email requested, whose sign-in the page offers instead of a reset.
   */
  provider = signal<ExternalProvider>(null);

  emailInput = viewChild(IonInput);

  ionViewWillEnter(): void {
    this.notice.set(this._flow.takeNotice());
    this.email.set(this._flow.email() ?? '');
    this.provider.set(null);
  }
  ionViewDidEnter(): void {
    if (!this.email()) this.emailInput()?.setFocus();
  }

  onEmailInput(email: string): void {
    this.email.set(email);
    // another email may have a password to reset: the explanation was about the previous one
    if (!this.provider()) return;
    this.provider.set(null);
    this.notice.set(null);
  }
  submit(): void {
    if (this.provider()) this.signInWithCompanyAccount();
    else void this.requestReset();
  }

  async requestReset(): Promise<void> {
    this.notice.set(null);
    const email = (this.email() ?? '').trim();
    if (isEmpty(email, 'email')) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.VALID_EMAIL_OBLIGATORY' });
      return;
    }
    const provider = getExternalProviderOfEmail(this.externalProviders, email);
    if (provider) {
      this.provider.set(provider);
      this.notice.set({ kind: 'info', message: 'IDEA_AUTH.PASSWORD_OF_COMPANY_ACCOUNT' });
      return;
    }
    try {
      await this._loading.show();
      await this._auth.forgotPassword(email);
      this._flow.email.set(email);
      this._flow.setNotice({ kind: 'success', message: 'IDEA_AUTH.PASSWORD_RESET_CODE_SENT' });
      this.goToConfirmPassword();
    } catch (err) {
      const userNotFound = (err as Error)?.name === 'UserNotFoundException';
      this.notice.set({
        kind: 'error',
        message: userNotFound ? 'IDEA_AUTH.USER_NOT_FOUND' : 'IDEA_AUTH.SENDING_FAILED'
      });
    } finally {
      this._loading.hide();
    }
  }

  signInWithCompanyAccount(): void {
    this._flow.email.set(this.email().trim());
    const { path, queryParams } = getExternalProviderSignInRoute(this.provider());
    this._nav.navigateForward(path, { queryParams });
  }

  goToConfirmPassword(): void {
    const email = (this.email() ?? '').trim();
    if (email) this._flow.email.set(email);
    this._nav.navigateForward(['auth', 'confirm-password']);
  }
  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
