import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAAuthService } from './auth.service';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

@Component({
  selector: 'idea-forgot-password',
  templateUrl: 'forgotPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAForgotPasswordPage {
  /**
   * The email address used to identify the account.
   */
  public email: string;

  constructor(
    public navCtrl: NavController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public auth: IDEAAuthService,
    public t: IDEATranslationsService
  ) {}

  /**
   * "I forgot my password" procedure.
   */
  public async forgotPassword() {
    await this.loading.show();
    this.auth
      .forgotPassword(this.email)
      .then(() => {
        this.message.success('IDEA_AUTH.PASSWORD_RESET_CODE_SENT');
        this.goToConfirmPassword();
      })
      .catch(() => this.message.error('IDEA_AUTH.USER_NOT_FOUND'))
      .finally(() => this.loading.hide());
  }

  /**
   * Go to the confirm password page.
   */
  public goToConfirmPassword() {
    this.navCtrl.navigateForward(['auth/confirm-password'], { queryParams: { email: this.email || null } });
  }
  /**
   * Go to auth page.
   */
  public goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
