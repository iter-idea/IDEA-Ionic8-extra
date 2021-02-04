import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAMessageService, IDEALoadingService, IDEATinCanService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-new-password',
  templateUrl: 'newPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEANewPasswordPage {
  /**
   * The email address used to identify the account.
   */
  public email: string;
  /**
   * The current temporary password.
   */
  public password: string;
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
    public tc: IDEATinCanService,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public auth: IDEAAuthService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    this.email = this.tc.get('email', true);
    this.password = this.tc.get('password', true);
    if (!this.email || !this.password) this.goToAuth();
  }

  /**
   * Confirm a new password (auth flow that follows a registration or a password reset).
   */
  public async confirmNewPassword() {
    this.errorMsg = null;
    await this.loading.show();
    this.auth
      .confirmNewPassword(this.email, this.password, this.newPassword)
      // we are logged in
      .then(() => window.location.assign(''))
      .catch(() => {
        this.errorMsg = this.t._('IDEA_AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 });
        this.message.error(this.errorMsg, true);
      })
      .finally(() => this.loading.hide());
  }

  /**
   * Go to auth page.
   */
  public goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
