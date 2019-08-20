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
  styleUrls: ['auth.scss']
})
export class IDEASignUpPage {
  // working attributes
  public email: string;
  public password: string;
  public agreementsCheck: boolean;
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
    if (IDEA_AUTH_REGISTRATION_POSSIBLE === false) {
      this.goToAuth();
      return;
    }
    this.email = this.tc.get('email', true);
    this.password = this.tc.get('password', true);
    this.agreementsCheck = false;
  }
  public ngOnInit() {
    // if there isn't any agreement to agree to, set the check true
    this.agreementsCheck =
      this.t.instant('IDEA.AUTH.TERMS_AND_CONDITIONS_URL') || this.t.instant('IDEA.AUTH.PRIVACY_POLICY_URL')
        ? this.agreementsCheck
        : true;
  }

  /**
   * Register the new user in cognito (note DynamoDB still need to be managed).
   */
  public register(): void {
    this.errorMsg = null;
    // check the fields
    if (!this.email) this.errorMsg = this.t.instant('IDEA.AUTH.EMAIL_OBLIGATORY');
    else if (!this.password || this.password.length < 8)
      this.errorMsg = this.t.instant('IDEA.AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 });
    // output the error, if there was one
    if (this.errorMsg) {
      this.message.error('IDEA.AUTH.REGISTRATION_FAILED');
      return;
    }
    // start the registration
    this.loading.show();
    this.auth
      .register(this.email, this.password)
      .then(() => {
        this.loading.hide();
        this.message.success('IDEA.AUTH.REGISTRATION_COMPLETED');
        this.goToAuth();
      })
      .catch(err => {
        this.loading.hide();
        // show the unexpected error on screen (english)
        this.errorMsg = err.message;
        this.message.error('IDEA.AUTH.REGISTRATION_FAILED');
      });
  }

  /**
   * Go to the resend link page.
   */
  public goToResendLink(): void {
    this.navCtrl.navigateForward(['auth/resend-link']);
  }
  /**
   * Go to auth page.
   */
  public goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
