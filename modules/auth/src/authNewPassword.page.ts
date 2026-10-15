import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { NavController, IonButton, IonContent } from '@ionic/angular/standalone';
import { IDEAEnvironment, IDEALoadingService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';
import { IDEAAuthFlowService, IDEAAuthNotice } from './authFlow.service';
import { IDEAAuthShellComponent } from './authShell.component';
import { IDEAAuthNoticeComponent } from './authNotice.component';
import { IDEAAuthPasswordFieldComponent } from './authPasswordField.component';
import { IDEAAuthPasswordRequirementsComponent } from './authPasswordRequirements.component';

/**
 * The first access: the user chooses the password to replace the temporary one.
 */
@Component({
  selector: 'idea-auth-new-password',
  imports: [
    IDEATranslatePipe,
    IDEAAuthShellComponent,
    IDEAAuthNoticeComponent,
    IDEAAuthPasswordFieldComponent,
    IDEAAuthPasswordRequirementsComponent,
    IonButton,
    IonContent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-content class="idea-auth">
      <idea-auth-shell>
        <div class="idea-auth-heading">
          <h1 class="idea-auth-title">{{ 'IDEA_AUTH.CHOOSE_A_PASSWORD' | translate }}</h1>
          <p class="idea-auth-subtitle">{{ 'IDEA_AUTH.FIRST_ACCESS_HINT' | translate }}</p>
        </div>
        <idea-auth-notice [notice]="notice()" />
        <div class="idea-auth-form">
          <div class="idea-auth-field">
            <label id="idea-auth-new-password" class="idea-auth-label" (click)="passwordField()?.focus()">
              {{ 'IDEA_AUTH.NEW_PASSWORD' | translate }}
            </label>
            <idea-auth-password-field
              testId="newpassword.password"
              labelledBy="idea-auth-new-password"
              describedBy="idea-auth-new-password-requirements"
              autocomplete="new-password"
              [(value)]="password"
              (enter)="confirm()"
            />
          </div>
          <idea-auth-password-requirements listId="idea-auth-new-password-requirements" [password]="password()" />
          @if (advancedPasswordCheck) {
            <p class="idea-auth-hint">{{ 'IDEA_AUTH.COMMON_PASSWORDS_CHECK_HINT' | translate }}</p>
          }
        </div>
        <div class="idea-auth-actions">
          <ion-button
            testId="confirmNewPaswordButton"
            class="idea-auth-button"
            expand="block"
            [disabled]="!policyMet()"
            (click)="confirm()"
          >
            {{ 'IDEA_AUTH.CONFIRM_NEW_PASSWORD' | translate }}
          </ion-button>
          <button testId="backToSignInButton" type="button" class="idea-auth-link" data-muted (click)="backToSignIn()">
            {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
          </button>
        </div>
      </idea-auth-shell>
    </ion-content>
  `
})
export class IDEAAuthNewPasswordPage {
  private _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _flow = inject(IDEAAuthFlowService);

  advancedPasswordCheck: boolean = this._env.idea.auth.passwordPolicy?.advancedPasswordCheck;

  password = signal<string>('');
  notice = signal<IDEAAuthNotice>(null);
  policyMet = computed((): boolean => this._auth.validatePasswordAgainstPolicy(this.password()).length === 0);

  passwordField = viewChild(IDEAAuthPasswordFieldComponent);

  ionViewWillEnter(): void {
    this.password.set('');
    this.notice.set(null);
    if (!this._auth.challengeUsername) this.backToSignIn();
  }
  ionViewDidEnter(): void {
    if (this._auth.challengeUsername) this.passwordField()?.focus();
  }

  async confirm(): Promise<void> {
    if (!this.policyMet()) return;
    this.notice.set(null);
    try {
      await this._loading.show();
      if (this.advancedPasswordCheck) {
        const errors = await this._auth.validatePasswordAgainstDatabases(this.password());
        if (errors.length) {
          this.notice.set({ kind: 'error', message: 'IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(errors[0]) });
          return;
        }
      }
      await this._auth.confirmNewPassword(this.password());
      window.location.assign('');
    } catch (err) {
      // the time to answer the sign-in's challenge is over: only a new sign-in can go on
      if (!this._auth.challengeUsername) {
        this._flow.setNotice({ kind: 'error', message: 'IDEA_AUTH.SIGN_IN_SESSION_EXPIRED' });
        this.backToSignIn();
      } else
        this.notice.set({
          kind: 'error',
          message: 'IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW',
          detail: (err as Error)?.message
        });
    } finally {
      this._loading.hide();
    }
  }

  backToSignIn(): void {
    this._nav.navigateBack(['auth', 'sign-in']);
  }
}
