import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { NavController, IonButton, IonInput } from '@ionic/angular/standalone';
import { isEmpty } from 'idea-toolbox';
import { IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from '../auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';

/**
 * A new link to confirm the account just registered.
 */
@Component({
  selector: 'idea-auth-resend-link',
  imports: [IDEATranslatePipe, IDEAAuthShellComponent, IDEAAuthNoticeComponent, IonButton, IonInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <idea-auth-shell>
      <div class="idea-auth-heading">
        <h1 class="idea-auth-title">{{ 'IDEA_AUTH.CONFIRM_ACCOUNT' | translate }}</h1>
        <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.RESEND_CONFIRMATION_LINK_HINT' | translate }}</p>
      </div>
      <idea-auth-notice [notice]="notice()" />
      <div class="idea-auth-form">
        <div class="idea-auth-field">
          <label id="idea-auth-resend-link-email" class="idea-auth-label" (click)="emailField.setFocus()">
            {{ 'IDEA_AUTH.EMAIL' | translate }}
          </label>
          <ion-input
            #emailField
            testId="resendlink.email"
            class="idea-auth-input"
            type="email"
            inputmode="email"
            autocomplete="email"
            spellcheck="false"
            autocapitalize="off"
            enterkeyhint="send"
            aria-labelledby="idea-auth-resend-link-email"
            [value]="email()"
            (ionInput)="email.set($event.detail.value)"
            (keyup.enter)="resend()"
          />
        </div>
      </div>
      <div class="idea-auth-actions">
        <ion-button testId="resendLinkButton" class="idea-auth-button" expand="block" (click)="resend()">
          {{ 'IDEA_AUTH.RESEND_LINK' | translate }}
        </ion-button>
        <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
          {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
        </button>
      </div>
    </idea-auth-shell>
  `
})
export class IDEAAuthResendLinkPage {
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  email = signal<string>('');
  notice = signal<IDEAAuthNotice>(null);

  emailInput = viewChild<IonInput>('emailField');

  ionViewWillEnter(): void {
    this.notice.set(null);
    this.email.set(this._flow.email() ?? '');
  }
  ionViewDidEnter(): void {
    if (!this.email()) this.emailInput()?.setFocus();
  }

  async resend(): Promise<void> {
    this.notice.set(null);
    const email = (this.email() ?? '').trim();
    if (isEmpty(email, 'email')) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.VALID_EMAIL_OBLIGATORY' });
      return;
    }
    try {
      await this._loading.show();
      await this._auth.resendConfirmationCode(email);
      this._flow.email.set(email);
      this._flow.setNotice({ kind: 'success', message: 'IDEA_AUTH.CONFIRMATION_LINK_SENT' });
      this.backToSignIn();
    } catch (err) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.IS_THE_EMAIL_CORRECT' });
    } finally {
      this._loading.hide();
    }
  }

  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
