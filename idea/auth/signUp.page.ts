import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAExtBrowserService } from '../extBrowser.service';
import { IDEATinCan } from '../tinCan.service';

// from idea-config.js
declare const IDEA_AUTH_REGISTRATION_POSSIBLE: boolean;

@Component({
  selector: 'idea-sign-up',
  templateUrl: 'signUp.page.html',
  styleUrls: ['auth.scss'],
})
export class IDEASignUpPage {
  // working attributes
  protected email: string;
  protected password: string;
  protected privacyPolicyCheck: boolean;
  protected errorMsg: string;

  constructor(
    protected navCtrl: NavController,
    protected tc: IDEATinCan,
    protected message: IDEAMessageService,
    protected loading: IDEALoadingService,
    protected extBrowser: IDEAExtBrowserService,
    protected auth: IDEAAuthService,
    protected t: TranslateService
  ) {
    if (IDEA_AUTH_REGISTRATION_POSSIBLE === false) {
      this.goToAuth();
      return;
    }
    this.email = this.tc.get('email', true);
    this.password = this.tc.get('password', true);
    this.privacyPolicyCheck = false;
  }

  /**
   * Register the new user in cognito (note DynamoDB still need to be managed).
   */
  protected register(): void {
    this.errorMsg = null;
    // check the fields
    if (!this.email) this.errorMsg = this.t.instant('IDEA.AUTH.EMAIL_OBLIGATORY');
    else if (!this.password || this.password.length < 8)
      this.errorMsg = this.t.instant('IDEA.AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 });
    // output the error, if there was one
    if (this.errorMsg) {
      this.message.error(this.t.instant('IDEA.AUTH.REGISTRATION_FAILED'));
      return;
    }
    // start the registration
    this.loading.show();
    this.auth.register(this.email, this.password)
    .then(() => {
      this.loading.hide();
      this.message.success(this.t.instant('IDEA.AUTH.REGISTRATION_COMPLETED'));
      this.goToAuth();
    })
    .catch(err => {
      this.loading.hide();
      // show the unexpected error on screen (english)
      this.errorMsg = err.message;
      this.message.error(this.t.instant('IDEA.AUTH.REGISTRATION_FAILED'));
    });
  }

  /**
   * Go to the resend link page.
   */
  protected goToResendLink(): void {
    this.navCtrl.navigateForward(['auth/resend-link']);
  }
  /**
   * Go to auth page.
   */
  protected goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
