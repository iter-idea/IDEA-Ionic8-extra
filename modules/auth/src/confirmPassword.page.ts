import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

@Component({
  selector: 'idea-confirm-password',
  templateUrl: 'confirmPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAConfirmPasswordPage {
  /**
   * The email address used to identify the account.
   */
  public email: string;
  /**
   * The code (received via email), to use for confirming the account.
   */
  public code: string;
  /**
   * The new password for the account.
   */
  public newPassword: string;
  /**
   * The error message to display in the UI, if any.
   */
  public errorMsg: string;

  constructor(
    public navCtrl: NavController,
    public route: ActivatedRoute,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public auth: IDEAAuthService,
    public t: IDEATranslationsService
  ) {
    this.email = this.route.snapshot.queryParamMap.get('email') || null;
    if (!this.email && this.route.snapshot.queryParams.user)
      this.email = decodeURIComponent(this.route.snapshot.queryParams.user);
    this.code = this.route.snapshot.queryParams.code;
  }

  /**
   * Confirm new password.
   */
  public confirmPassword() {
    this.errorMsg = null;
    this.loading.show();
    this.auth
      .confirmPassword(this.email, this.code, this.newPassword)
      .then(() => {
        this.message.success('IDEA.AUTH.PASSWORD_CHANGED');
        this.goToAuth();
      })
      .catch(() => {
        this.errorMsg = this.t._('IDEA.AUTH.CONFIRM_PASSWORD_ERROR', { n: 8 });
        this.message.error(this.errorMsg, true);
      })
      .finally(() => this.loading.hide());
  }

  /**
   * Go to forgot password page.
   */
  public goToForgotPassword() {
    this.navCtrl.navigateBack(['auth/forgot-password']);
  }
  /**
   * Go to auth page.
   */
  public goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
