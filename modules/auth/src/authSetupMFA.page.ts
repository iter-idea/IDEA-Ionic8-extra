import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { NavController, IonButton, IonInput, IonContent } from '@ionic/angular/standalone';
import { toCanvas } from 'qrcode';
import { IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';
import { IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';

/**
 * The setup of MFA, when the project requires it: the QR code for the authenticator app, then its first code.
 */
@Component({
  selector: 'idea-auth-setup-mfa',
  imports: [IDEATranslatePipe, IDEAAuthShellComponent, IDEAAuthNoticeComponent, IonButton, IonInput, IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content class="idea-auth">
      <idea-auth-shell>
        <div class="idea-auth-heading">
          <h1 class="idea-auth-title">{{ 'IDEA_AUTH.SETUP_MFA' | translate }}</h1>
          <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.MFA_REQUIRED_SETUP_HINT' | translate }}</p>
        </div>
        <idea-auth-notice [notice]="notice()" />
        @if (status() === 'setup') {
          <div class="idea-auth-form">
            <p class="idea-auth-hint">{{ 'IDEA_AUTH.SETUP_MFA_I' | translate }}</p>
            <div #qrCode class="idea-auth-qr" role="img" [attr.aria-label]="'IDEA_AUTH.SETUP_MFA_I' | translate"></div>
            <p class="idea-auth-hint">
              {{ 'IDEA_AUTH.MFA_SECRET_HINT' | translate }}
              <span class="idea-auth-secret">{{ secret() }}</span>
            </p>
            <div class="idea-auth-field">
              <label id="idea-auth-setup-mfa-code" class="idea-auth-label" (click)="codeInput()?.setFocus()">
                {{ 'IDEA_AUTH.OTP_CODE' | translate }}
              </label>
              <ion-input
                testId="setupmfa.otpcode"
                class="idea-auth-input idea-auth-code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                enterkeyhint="done"
                aria-labelledby="idea-auth-setup-mfa-code"
                [class.ion-touched]="codeInvalid()"
                [class.ion-invalid]="codeInvalid()"
                [value]="code()"
                (ionInput)="onCode($event.detail.value)"
                (keyup.enter)="enable()"
              />
            </div>
          </div>
        }
        <div class="idea-auth-actions">
          @if (status() === 'setup') {
            <ion-button
              testId="enableMFAButton"
              class="idea-auth-button"
              expand="block"
              [disabled]="code().length !== 6"
              (click)="enable()"
            >
              {{ 'IDEA_AUTH.ENABLE_MFA' | translate }}
            </ion-button>
          } @else if (status() === 'enabled') {
            <ion-button class="idea-auth-button" expand="block" (click)="reloadApp()">
              {{ 'IDEA_AUTH.CONTINUE' | translate }}
            </ion-button>
          }
          <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
            {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
          </button>
        </div>
      </idea-auth-shell>
    </ion-content>
  `
})
export class IDEAAuthSetupMFAPage {
  private _injector = inject(Injector);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);

  status = signal<'loading' | 'setup' | 'enabled' | 'error'>('loading');
  secret = signal<string>(null);
  code = signal<string>('');
  codeInvalid = signal(false);
  notice = signal<IDEAAuthNotice>(null);

  qrCode = viewChild<ElementRef<HTMLDivElement>>('qrCode');
  codeInput = viewChild(IonInput);

  async ionViewWillEnter(): Promise<void> {
    this.code.set('');
    this.codeInvalid.set(false);
    this.notice.set(null);
    this.status.set('loading');
    try {
      await this._loading.show();
      if (await this._auth.checkIfUserHasMFAEnabled()) {
        this.notice.set({ kind: 'info', message: 'IDEA_AUTH.MFA_ALREADY_ENABLED' });
        this.status.set('enabled');
        return;
      }
      const url = await this._auth.getURLForEnablingMFA();
      this.secret.set(url.match(/[?&]secret=([^&]+)/)?.[1]);
      this.status.set('setup');
      // the key is on the page anyway: a QR code that can't be drawn doesn't stop the setup
      afterNextRender((): void => void this.drawQRCode(url).catch((): void => undefined), { injector: this._injector });
    } catch (err) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.AUTHENTICATION_FAILED' });
      this.status.set('error');
    } finally {
      this._loading.hide();
    }
  }
  private drawQRCode(url: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      const container = this.qrCode()?.nativeElement;
      if (!container) return resolve();
      container.innerHTML = '';
      toCanvas(url, { errorCorrectionLevel: 'L', margin: 0 }, (err: Error, canvas: HTMLCanvasElement): void => {
        if (err) return reject(err);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        resolve();
      });
    });
  }

  onCode(value: string): void {
    const code = (value ?? '').replace(/\D/g, '').slice(0, 6);
    // back to the field too, which would keep a letter or a space when the code doesn't change
    const input = this.codeInput();
    if (input) input.value = code;
    this.code.set(code);
    this.codeInvalid.set(false);
  }

  async enable(): Promise<void> {
    if (this.code().length !== 6) return;
    this.notice.set(null);
    try {
      await this._loading.show();
      await this._auth.enableMFA(this.code());
      this.reloadApp();
    } catch (err) {
      this.notice.set({ kind: 'error', message: 'IDEA_AUTH.INVALID_OTP_CODE' });
      this.codeInvalid.set(true);
      this.code.set('');
      this.codeInput()?.setFocus();
    } finally {
      this._loading.hide();
    }
  }

  reloadApp(): void {
    window.location.assign('');
  }
  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
