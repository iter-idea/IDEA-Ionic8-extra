import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, IonButton, IonInput, IonContent } from '@ionic/angular/standalone';
import { isEmpty } from 'idea-toolbox';
import { IDEAEnvironment, IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';
import { IDEAAuthPasswordFieldComponent } from './authPasswordField.component';
import { IDEAAuthPasswordRequirementsComponent } from './authPasswordRequirements.component';

/**
 * The new password after a reset request, with the code received by email.
 */
@Component({
  selector: 'idea-auth-confirm-password',
  imports: [
    IDEATranslatePipe,
    IDEAAuthShellComponent,
    IDEAAuthNoticeComponent,
    IDEAAuthPasswordFieldComponent,
    IDEAAuthPasswordRequirementsComponent,
    IonButton,
    IonInput,
    IonContent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content class="idea-auth">
      <idea-auth-shell>
        <div class="idea-auth-heading">
          <h1 class="idea-auth-title">{{ 'IDEA_AUTH.CHANGE_THE_PASSWORD' | translate }}</h1>
        </div>
        <idea-auth-notice [notice]="notice()" />
        <div class="idea-auth-form">
          <div class="idea-auth-field">
            <label id="idea-auth-confirm-password-email" class="idea-auth-label" (click)="emailField.setFocus()">
              {{ 'IDEA_AUTH.EMAIL' | translate }}
            </label>
            <ion-input
              #emailField
              testId="confirmpassword.email"
              class="idea-auth-input"
              type="email"
              inputmode="email"
              autocomplete="username"
              spellcheck="false"
              autocapitalize="off"
              aria-labelledby="idea-auth-confirm-password-email"
              [value]="email()"
              (ionInput)="email.set($event.detail.value)"
            />
          </div>
          <div class="idea-auth-field">
            <label id="idea-auth-confirm-password-code" class="idea-auth-label" (click)="codeField.setFocus()">
              {{ 'IDEA_AUTH.RESET_CODE' | translate }}
            </label>
            <ion-input
              #codeField
              testId="confirmpassword.code"
              class="idea-auth-input"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              spellcheck="false"
              aria-labelledby="idea-auth-confirm-password-code"
              aria-describedby="idea-auth-confirm-password-code-hint"
              [value]="code()"
              (ionInput)="code.set($event.detail.value)"
            />
            <p id="idea-auth-confirm-password-code-hint" class="idea-auth-hint">
              {{ 'IDEA_AUTH.RESET_CODE_HINT' | translate }}
            </p>
          </div>
          <div class="idea-auth-field">
            <label id="idea-auth-confirm-password-password" class="idea-auth-label" (click)="passwordField()?.focus()">
              {{ 'IDEA_AUTH.NEW_PASSWORD' | translate }}
            </label>
            <idea-auth-password-field
              testId="confirmpassword.password"
              labelledBy="idea-auth-confirm-password-password"
              describedBy="idea-auth-confirm-password-requirements"
              autocomplete="new-password"
              [(value)]="password"
              (enter)="confirm()"
            />
          </div>
          <idea-auth-password-requirements listId="idea-auth-confirm-password-requirements" [password]="password()" />
          @if (advancedPasswordCheck) {
            <p class="idea-auth-hint">{{ 'IDEA_AUTH.COMMON_PASSWORDS_CHECK_HINT' | translate }}</p>
          }
        </div>
        <div class="idea-auth-actions">
          <ion-button
            testId="changePasswordButton"
            class="idea-auth-button"
            expand="block"
            [disabled]="!policyMet()"
            (click)="confirm()"
          >
            {{ 'IDEA_AUTH.CHANGE_MY_PASSWORD' | translate }}
          </ion-button>
          <button
            testId="haventReceivedResetCodeButton"
            type="button"
            class="idea-auth-link"
            (click)="goToForgotPassword()"
          >
            {{ 'IDEA_AUTH.HAVEN_T_RECEIVED_A_RESET_CODE' | translate }}
          </button>
          <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
            {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
          </button>
        </div>
      </idea-auth-shell>
    </ion-content>
  `
})
export class IDEAAuthConfirmPasswordPage {
  private _env = inject(IDEAEnvironment);
  private _route = inject(ActivatedRoute);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  advancedPasswordCheck: boolean = this._env.idea.auth.passwordPolicy?.advancedPasswordCheck;

  email = signal<string>('');
  code = signal<string>('');
  password = signal<string>('');
  notice = signal<IDEAAuthNotice>(null);
  policyMet = computed((): boolean => this._auth.validatePasswordAgainstPolicy(this.password()).length === 0);

  emailInput = viewChild<IonInput>('emailField');
  codeInput = viewChild<IonInput>('codeField');
  passwordField = viewChild(IDEAAuthPasswordFieldComponent);

  ionViewWillEnter(): void {
    this.notice.set(this._flow.takeNotice());
    this.password.set('');
    // the link in the reset email can carry the user and the code
    const params = this._route.snapshot.queryParamMap;
    const userFromLink = params.get('user') ? decodeURIComponent(params.get('user')) : null;
    this.email.set(params.get('email') || userFromLink || this._flow.email() || '');
    this.code.set(params.get('code') || '');
  }
  ionViewDidEnter(): void {
    if (!this.email()) this.emailInput()?.setFocus();
    else if (!this.code()) this.codeInput()?.setFocus();
    else this.passwordField()?.focus();
  }

  async confirm(): Promise<void> {
    if (!this.policyMet()) return;
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
      await this._auth.confirmPassword(email, (this.code() ?? '').trim(), this.password());
      this._flow.email.set(email);
      this._flow.setNotice({ kind: 'success', message: 'IDEA_AUTH.PASSWORD_CHANGED' });
      this.backToSignIn();
    } catch (err) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.CONFIRM_PASSWORD_ERROR', detail: (err as Error)?.message });
    } finally {
      this._loading.hide();
    }
  }

  goToForgotPassword(): void {
    const email = (this.email() ?? '').trim();
    if (email) this._flow.email.set(email);
    this._nav.navigateBack(['auth', 'forgot-password']);
  }
  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
