import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';
import { IDEATinCanService } from '../tinCan.service';

@Component({
  selector: 'idea-new-password',
  templateUrl: 'newPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEANewPasswordPage {
  public email: string;
  public password: string;
  public newPassword: string;
  public errorMsg: string;

  constructor(
    public navCtrl: NavController,
    public tc: IDEATinCanService,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public auth: IDEAAuthService,
    public t: TranslateService
  ) {
    this.email = this.tc.get('email', true);
    this.password = this.tc.get('password', true);
    if (!this.email || !this.password) this.goToAuth();
  }

  /**
   * Confirm a new password (auth flow that follows a registration or a password reset).
   */
  public confirmNewPassword() {
    this.errorMsg = null;
    this.loading.show();
    this.auth
      .confirmNewPassword(this.email, this.password, this.newPassword)
      .then(() => {
        // we are logged in
        window.location.assign('');
      })
      .catch(() => {
        this.loading.hide();
        this.errorMsg = this.t.instant('IDEA.AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 });
        this.message.error(this.errorMsg, true);
      });
  }

  /**
   * Go to auth page.
   */
  public goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
