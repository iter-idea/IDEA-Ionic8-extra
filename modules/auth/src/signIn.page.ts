import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { IDEAMessageService, IDEALoadingService, IDEATinCanService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

import { environment as env } from '@env';

@Component({
  selector: 'idea-sign-in',
  templateUrl: 'signIn.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASignInPage {
  /**
   * The title of the project.
   */
  public title: string;
  /**
   * Whether the public registration is allowed for the project.
   */
  public registrationPossible: boolean;
  /**
   * Whether the project has an intro (explanatory) page.
   */
  public hasIntroPage: boolean;
  /**
   * The URL to IDEA's website.
   */
  public website: string;
  /**
   * The email address to identify a user.
   */
  public email: string;
  /**
   * The password to login for the email selected.
   */
  public password: string;
  /**
   * Whether the agreements have been accepted.
   */
  public agreementsCheck: boolean;
  /**
   * Whether a new account was just created through the SignUp page.
   */
  public newAccountRegistered: boolean;
  /**
   * The error message to display in the UI, if any.
   */
  public errorMsg: string;

  constructor(
    public navCtrl: NavController,
    public tc: IDEATinCanService,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public auth: IDEAAuthService,
    public t: IDEATranslationsService
  ) {
    this.title = env.idea.app.title;
    this.registrationPossible = env.idea.auth.registrationIsPossible;
    this.hasIntroPage = env.idea.app.hasIntroPage;
    this.website = env.idea.website;
    this.agreementsCheck = true;
  }
  public ionViewDidEnter() {
    // manage the scenario in which we just created a new account (show a explanatory message: email must be confirmed)
    if (this.tc.get('newAccountRegistered')) {
      this.newAccountRegistered = true;
      this.email = this.tc.get('newAccountRegistered', true);
    }
  }

  /**
   * Sign-in with the auth details provided.
   */
  public async login() {
    if (!this.agreementsCheck) return;
    this.errorMsg = null;
    await this.loading.show();
    this.auth
      .login(this.email, this.password)
      .then(needNewPassword => {
        if (needNewPassword) {
          this.tc.set('email', this.email);
          this.tc.set('password', this.password);
          this.navCtrl.navigateForward(['auth/new-password']);
        } else window.location.assign(''); // hard reload
      })
      .catch(err => {
        if (err.name === 'UserNotConfirmedException') this.errorMsg = this.t._('IDEA_AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN');
        this.message.error('IDEA_AUTH.AUTHENTICATION_FAILED');
      })
      .finally(() => this.loading.hide());
  }

  /**
   * Go to the homepage.
   */
  public goToIntro() {
    this.navCtrl.navigateBack(['intro']);
  }
  /**
   * Go to the forgot password page.
   */
  public goToForgotPassword() {
    this.navCtrl.navigateForward(['auth/forgot-password']);
  }
  /**
   * Go to registration page.
   */
  public goToRegistration() {
    this.tc.set('email', this.email);
    this.tc.set('password', this.password);
    this.navCtrl.navigateForward(['auth', 'sign-up']);
  }

  /**
   * Open a URL in the browser.
   */
  public openLink(url: string) {
    Browser.open({ url });
  }
}
