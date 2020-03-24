import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-forgot-password',
  templateUrl: 'forgotPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAForgotPasswordPage {
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
  public forgotPassword() {
    this.loading.show();
    this.auth
      .forgotPassword(this.email)
      .then(() => {
        this.loading.hide();
        this.message.success('IDEA.AUTH.PASSWORD_RESET_CODE_SENT');
        this.goToConfirmPassword();
      })
      .catch(() => {
        this.loading.hide();
        this.message.error('IDEA.AUTH.USER_NOT_FOUND');
      });
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
