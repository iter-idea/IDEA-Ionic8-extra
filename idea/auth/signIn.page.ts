import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';

// from idea-config.js
declare const IDEA_APP_TITLE: string;
declare const IDEA_AUTH_WEBSITE: string;
declare const IDEA_AUTH_REGISTRATION_POSSIBLE: boolean;
declare const IDEA_HAS_INTRO_PAGE: boolean;

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
    this.title = IDEA_APP_TITLE;
    this.registrationPossible = IDEA_AUTH_REGISTRATION_POSSIBLE;
    this.hasIntroPage = IDEA_HAS_INTRO_PAGE;
    this.website = IDEA_AUTH_WEBSITE;
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
  public login() {
    if (!this.agreementsCheck) return;
    this.errorMsg = null;
    this.loading.show();
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
        if (err.name === 'UserNotConfirmedException') this.errorMsg = this.t._('IDEA.AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN');
        this.message.error('IDEA.AUTH.AUTHENTICATION_FAILED');
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
