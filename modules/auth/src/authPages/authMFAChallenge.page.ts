import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { NavController, IonButton, IonInput } from '@ionic/angular/standalone';
import { IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from '../auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';

/**
 * The MFA challenge of the sign-in: the code of the authenticator app.
 */
@Component({
  selector: 'idea-auth-mfa-challenge',
  imports: [IDEATranslatePipe, IDEAAuthShellComponent, IDEAAuthNoticeComponent, IonButton, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <idea-auth-shell>
      <div class="idea-auth-heading">
        <h1 class="idea-auth-title">{{ 'IDEA_AUTH.ENTER_OTP_CODE' | translate }}</h1>
        <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.ENTER_OTP_CODE_I' | translate }}</p>
      </div>
      <idea-auth-notice [notice]="notice()" />
      <div class="idea-auth-form">
        <div class="idea-auth-field">
          <label id="idea-auth-mfa-challenge-code" class="idea-auth-label" (click)="codeInput()?.setFocus()">
            {{ 'IDEA_AUTH.OTP_CODE' | translate }}
          </label>
          <ion-input
            testId="mfachallenge.otpcode"
            class="idea-auth-input idea-auth-code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            enterkeyhint="done"
            [maxlength]="6"
            aria-labelledby="idea-auth-mfa-challenge-code"
            aria-describedby="idea-auth-mfa-challenge-hint"
            [attr.aria-invalid]="codeInvalid() || null"
            [value]="code()"
            (ionInput)="onCode($event.detail.value)"
            (keyup.enter)="confirm()"
          />
          <p id="idea-auth-mfa-challenge-hint" class="idea-auth-hint">{{ 'IDEA_AUTH.OTP_CODE_HINT' | translate }}</p>
        </div>
      </div>
      <div class="idea-auth-actions">
        <ion-button
          testId="confirmOTPCodeButton"
          class="idea-auth-button"
          expand="block"
          [disabled]="code().length !== 6"
          (click)="confirm()"
        >
          {{ 'IDEA_AUTH.CONFIRM_OTP_CODE' | translate }}
        </ion-button>
        <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
          {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
        </button>
      </div>
    </idea-auth-shell>
  `
})
export class IDEAAuthMFAChallengePage {
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  code = signal<string>('');
  codeInvalid = signal(false);
  notice = signal<IDEAAuthNotice>(null);
  private confirming = false;

  codeInput = viewChild(IonInput);

  ionViewWillEnter(): void {
    this.code.set('');
    this.codeInvalid.set(false);
    this.notice.set(null);
    if (!this._auth.challengeUsername) this.backToSignIn();
  }
  ionViewDidEnter(): void {
    // the user comes from the password, ready to type the code
    if (this._auth.challengeUsername) this.codeInput()?.setFocus();
  }

  onCode(value: string): void {
    this.code.set((value ?? '').replace(/\D/g, '').slice(0, 6));
    this.codeInvalid.set(false);
    // the code is complete (typed or filled in by the device): no need to press the button
    if (this.code().length === 6) this.confirm();
  }

  async confirm(): Promise<void> {
    if (this.code().length !== 6 || this.confirming) return;
    this.confirming = true;
    this.notice.set(null);
    try {
      await this._loading.show();
      await this._auth.completeMFAChallenge(this.code());
      window.location.assign('');
    } catch (err) {
      // the time to answer the sign-in's challenge is over: only a new sign-in can go on
      if (!this._auth.challengeUsername) {
        this._flow.setNotice({ kind: 'error', message: 'IDEA_AUTH.SIGN_IN_SESSION_EXPIRED' });
        this.backToSignIn();
      } else {
        this.notice.set({ kind: 'error', message: 'IDEA_AUTH.INVALID_OTP_CODE' });
        this.codeInvalid.set(true);
        this.code.set('');
        this.codeInput()?.setFocus();
      }
    } finally {
      this.confirming = false;
      this._loading.hide();
    }
  }

  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
