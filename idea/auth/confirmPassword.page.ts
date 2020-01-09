import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'idea-confirm-password',
  templateUrl: 'confirmPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAConfirmPasswordPage {
  public email: string;
  public code: string;
  public newPassword: string;
  public errorMsg: string;

  constructor(
    public navCtrl: NavController,
    public route: ActivatedRoute,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public auth: IDEAAuthService,
    public t: TranslateService
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
        this.loading.hide();
        this.message.success('IDEA.AUTH.PASSWORD_CHANGED');
        this.goToAuth();
      })
      .catch(() => {
        this.loading.hide();
        this.errorMsg = this.t.instant('IDEA.AUTH.CONFIRM_PASSWORD_ERROR', { n: 8 });
        this.message.error(this.errorMsg, true);
      });
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
