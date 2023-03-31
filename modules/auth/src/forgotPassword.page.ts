import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAMessageService, IDEALoadingService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-forgot-password',
  templateUrl: 'forgotPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAForgotPasswordPage {
  email: string;

  constructor(
    private navCtrl: NavController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private auth: IDEAAuthService
  ) {}

  async forgotPassword(): Promise<void> {
    try {
      await this.loading.show();
      await this.auth.forgotPassword(this.email);
      this.message.success('IDEA_AUTH.PASSWORD_RESET_CODE_SENT');
      this.goToConfirmPassword();
    } catch (error) {
      this.message.error('IDEA_AUTH.USER_NOT_FOUND');
    } finally {
      this.loading.hide();
    }
  }

  goToConfirmPassword(): void {
    this.navCtrl.navigateForward(['auth/confirm-password'], { queryParams: { email: this.email ?? null } });
  }
  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
