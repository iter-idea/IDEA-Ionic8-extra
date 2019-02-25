import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';
import { IDEATinCan } from '../tinCan.service';

@Component({
  selector: 'idea-new-password',
  templateUrl: 'newPassword.page.html',
  styleUrls: ['auth.scss'],
})
export class IDEANewPasswordPage {
  protected email: string;
  protected password: string;
  protected newPassword: string;
  protected errorMsg: string;

  constructor(
    protected navCtrl: NavController,
    protected tc: IDEATinCan,
    protected message: IDEAMessageService,
    protected loading: IDEALoadingService,
    protected auth: IDEAAuthService,
    protected t: TranslateService
  ) {
    this.email = this.tc.get('email', true);
    this.password = this.tc.get('password', true);
    if (!this.email || !this.password) this.goToAuth();
  }

  /**
   * Confirm a new password (auth flow that follows a registration or a password reset).
   */
  protected confirmNewPassword() {
    this.errorMsg = null;
    this.loading.show();
    this.auth.confirmNewPassword(this.email, this.password, this.newPassword)
    .then(() => {
      // we are logged in
      window.location.assign('');
    })
    .catch(() => {
      this.loading.hide();
      this.errorMsg = this.t.instant('IDEA.AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 });
      this.message.error(this.t.instant('IDEA.AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 }));
    });
  }

  /**
   * Go to auth page.
   */
  protected goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
