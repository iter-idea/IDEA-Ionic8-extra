import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { NavController, IonButton, IonInput } from '@ionic/angular/standalone';
import { isEmpty } from 'idea-toolbox';
import { IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';

/**
 * The request of a password reset: Cognito sends a code to the email.
 */
@Component({
  selector: 'idea-auth-forgot-password',
  imports: [IDEATranslatePipe, IDEAAuthShellComponent, IDEAAuthNoticeComponent, IonButton, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <idea-auth-shell>
      <div class="idea-auth-heading">
        <h1 class="idea-auth-title">{{ 'IDEA_AUTH.PASSWORD_RESET' | translate }}</h1>
        <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.PASSWORD_RESET_HINT' | translate }}</p>
      </div>
      <idea-auth-notice [notice]="notice()" />
      <div class="idea-auth-form">
        <div class="idea-auth-field">
          <label id="idea-auth-forgot-password-email" class="idea-auth-label" (click)="emailInput()?.setFocus()">
            {{ 'IDEA_AUTH.EMAIL' | translate }}
          </label>
          <ion-input
            testId="forgotpassword.email"
            class="idea-auth-input"
            type="email"
            inputmode="email"
            autocomplete="username"
            spellcheck="false"
            autocapitalize="off"
            enterkeyhint="send"
            aria-labelledby="idea-auth-forgot-password-email"
            [value]="email()"
            (ionInput)="email.set($event.detail.value)"
            (keyup.enter)="requestReset()"
          />
        </div>
      </div>
      <div class="idea-auth-actions">
        <ion-button testId="resetPasswordButton" class="idea-auth-button" expand="block" (click)="requestReset()">
          {{ 'IDEA_AUTH.RESET_MY_PASSWORD' | translate }}
        </ion-button>
        <button testId="insertResetCodeButton" type="button" class="idea-auth-link" (click)="goToConfirmPassword()">
          {{ 'IDEA_AUTH.ALREADY_HAVE_A_RESET_CODE' | translate }}
        </button>
        <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
          {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
        </button>
      </div>
    </idea-auth-shell>
  `
})
export class IDEAAuthForgotPasswordPage {
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  email = signal<string>('');
  notice = signal<IDEAAuthNotice>(null);

  emailInput = viewChild(IonInput);

  ionViewWillEnter(): void {
    this.notice.set(this._flow.takeNotice());
    this.email.set(this._flow.email() ?? '');
  }
  ionViewDidEnter(): void {
    if (!this.email()) this.emailInput()?.setFocus();
  }

  async requestReset(): Promise<void> {
    this.notice.set(null);
    const email = (this.email() ?? '').trim();
    if (isEmpty(email, 'email')) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.VALID_EMAIL_OBLIGATORY' });
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

  goToConfirmPassword(): void {
    const email = (this.email() ?? '').trim();
    if (email) this._flow.email.set(email);
    this._nav.navigateForward(['auth', 'confirm-password']);
  }
  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
