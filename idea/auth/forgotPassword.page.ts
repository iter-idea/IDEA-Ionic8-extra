import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';

@Component({
  selector: 'idea-forgot-password',
  templateUrl: 'forgotPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAForgotPasswordPage {
  protected email: string;

  constructor(
    protected navCtrl: NavController,
    protected message: IDEAMessageService,
    protected loading: IDEALoadingService,
    protected auth: IDEAAuthService,
    protected t: TranslateService
  ) {}

  /**
   * "I forgot my password" procedure.
   */
  protected forgotPassword() {
    this.loading.show();
    this.auth.forgotPassword(this.email)
    .then(() => {
      this.loading.hide();
      this.message.success(this.t.instant('IDEA.AUTH.PASSWORD_RESET_CODE_SENT'));
      this.goToConfirmPassword();
    })
    .catch(() => {
      this.loading.hide();
      this.message.error(this.t.instant('IDEA.AUTH.USER_NOT_FOUND'));
    });
  }

  /**
   * Go to the confirm password page.
   */
  protected goToConfirmPassword() {
    this.navCtrl.navigateForward(['auth/confirm-password'], { queryParams: { email: this.email || null } });
  }
  /**
   * Go to auth page.
   */
  protected goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
