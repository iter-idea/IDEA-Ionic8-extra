import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAExtBrowserService } from '../extBrowser.service';
import { IDEATinCan } from '../tinCan.service';

// from idea-config.js
declare const IDEA_APP_TITLE: string;
declare const IDEA_AUTH_WEBSITE: string;
declare const IDEA_AUTH_REGISTRATION_POSSIBLE: boolean;

@Component({
  selector: 'idea-sign-in',
  templateUrl: 'signIn.page.html',
  styleUrls: ['auth.scss'],
})
export class IDEASignInPage {
  // vars from configuration
  public title: string;
  public registrationPossible: boolean;
  public website: string;

  // working attributes
  public email: string;
  public password: string;
  public privacyPolicyCheck: boolean;
  public errorMsg: string;

  constructor(
    public navCtrl: NavController,
    public tc: IDEATinCan,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public extBrowser: IDEAExtBrowserService,
    public auth: IDEAAuthService,
    public t: TranslateService
  ) {
    this.title = IDEA_APP_TITLE;
    this.registrationPossible = IDEA_AUTH_REGISTRATION_POSSIBLE;
    this.website = IDEA_AUTH_WEBSITE;
    this.privacyPolicyCheck = true;
  }

  /**
   * Sign-in with the auth details provided.
   */
  public login(): void {
    if (!this.privacyPolicyCheck) return;
    this.errorMsg = null;
    this.loading.show();
    this.auth.login(this.email, this.password)
    .then(needNewPassword => {
      if (needNewPassword) {
        this.loading.hide();
        this.tc.set('email', this.email);
        this.tc.set('password', this.password);
        this.navCtrl.navigateForward(['auth/new-password']);
      } else
        window.location.assign(''); // hard reload
    })
    .catch(err => {
      this.loading.hide();
      if (err.name === 'UserNotConfirmedException')
        this.errorMsg = this.t.instant('IDEA.AUTH.CONFIRM_YOUR_EMAIL_TO_LOGIN');
      this.message.error('IDEA.AUTH.AUTHENTICATION_FAILED');
    });
  }

  /**
   * Go to the forgot password page.
   */
  public goToForgotPassword(): void {
    this.navCtrl.navigateForward(['auth/forgot-password']);
  }
  /**
   * Go to registration page.
   */
  public goToRegistration(): void {
    this.tc.set('email', this.email);
    this.tc.set('password', this.password);
    this.navCtrl.navigateForward(['auth', 'sign-up']);
  }
}
