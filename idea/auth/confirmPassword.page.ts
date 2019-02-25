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
  protected email: string;
  protected code: string;
  protected newPassword: string;
  protected errorMsg: string;

  constructor(
    protected navCtrl: NavController,
    protected route: ActivatedRoute,
    protected message: IDEAMessageService,
    protected loading: IDEALoadingService,
    protected auth: IDEAAuthService,
    protected t: TranslateService
  ) {
    this.email = this.route.snapshot.queryParamMap.get('email') || null;
  }

  /**
   * Confirm new password.
   */
  protected confirmPassword() {
    this.errorMsg = null;
    this.loading.show();
    this.auth.confirmPassword(this.email, this.code, this.newPassword)
    .then(() => {
      this.loading.hide();
      this.message.success(this.t.instant('IDEA.AUTH.PASSWORD_CHANGED'));
      this.goToAuth();
    })
    .catch(() => {
      this.loading.hide();
      this.errorMsg = this.t.instant('IDEA.AUTH.CONFIRM_PASSWORD_ERROR', { n: 8 });
      this.message.error(this.t.instant('IDEA.AUTH.CONFIRM_PASSWORD_ERROR', { n: 8 }));
    });
  }

  /**
   * Go to forgot password page.
   */
  protected goToForgotPassword() {
    this.navCtrl.navigateBack(['auth/forgot-password']);
  }
  /**
   * Go to auth page.
   */
  protected goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
