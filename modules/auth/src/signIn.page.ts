import { Component, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { IDEAEnvironment, IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService, LoginOutcomeActions } from './auth.service';

@Component({
  selector: 'idea-sign-in',
  templateUrl: 'signIn.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASignInPage {
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  private _auth = inject(IDEAAuthService);

  title: string;
  registrationPossible: boolean;
  hasIntroPage: boolean;
  website: string;

  email: string;
  password: string;
  agreementsCheck = true;
  newAccountRegistered = false;
  errorMsg: string;
  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor() {
    this.title = this._env.idea.auth.title;
    this.registrationPossible = this._env.idea.auth.registrationIsPossible;
    this.hasIntroPage = this._env.idea.auth.hasIntroPage;
    this.website = this._env.idea.auth.website;
  }
  ionViewDidEnter(): void {
    // manage the scenario in which we just created a new account (show a explanatory message: email must be confirmed)
    this.newAccountRegistered = !!this._auth.getNewAccountJustRegistered();
    if (this.newAccountRegistered) this.email = this._auth.getNewAccountJustRegistered();
  }

  async login(): Promise<void> {
    if (!this.agreementsCheck) return;
    try {
      this.errorMsg = null;
      await this._loading.show();
      const loginAction = await this._auth.login(this.email, this.password);
      if (loginAction === LoginOutcomeActions.NEW_PASSWORD) this._nav.navigateForward(['auth', 'new-password']);
      else if (loginAction === LoginOutcomeActions.MFA_CHALLENGE) this._nav.navigateForward(['auth', 'mfa-challenge']);
      else if (loginAction === LoginOutcomeActions.MFA_SETUP) this._nav.navigateForward(['auth', 'setup-mfa']);
      else window.location.assign('');
    } catch (err) {
      if ((err as any).name === 'UserNotConfirmedException')
        this.errorMsg = this._translate._('IDEA_AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN');
      else if (
        (err as any).name === 'UserLambdaValidationException' &&
        (err as any).message?.includes('@IDEA_COGNITO_TRANSITION')
      )
        this.errorMsg = this._translate._('IDEA_AUTH.CHANGE_YOUR_PASSWORD_TO_LOGIN');
      this._message.error('IDEA_AUTH.AUTHENTICATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  goToIntro(): void {
    this._nav.navigateBack(['intro']);
  }
  goToForgotPassword(): void {
    this._nav.navigateForward(['auth', 'forgot-password']);
  }
  goToRegistration(): void {
    this._nav.navigateForward(['auth', 'sign-up']);
  }

  translationExists(key: string): boolean {
    return !!this._translate._(key);
  }

  async openLink(url: string): Promise<void> {
    await Browser.open({ url });
  }
}
