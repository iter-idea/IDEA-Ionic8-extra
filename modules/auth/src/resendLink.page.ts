import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-resend-link',
  templateUrl: 'resendLink.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAResendLinkPage {
  email: string;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private auth: IDEAAuthService,
    private t: IDEATranslationsService
  ) {}

  async resendConfirmationLink(): Promise<void> {
    this.errorMsg = null;
    if (!this.email) {
      this.errorMsg = this.t._('IDEA_AUTH.VALID_EMAIL_OBLIGATORY');
      this.message.error('IDEA_AUTH.SENDING_FAILED');
      return;
    }
    try {
      await this.loading.show();
      await this.auth.resendConfirmationCode(this.email);
      this.message.success('IDEA_AUTH.CONFIRMATION_LINK_SENT');
      this.goToAuth();
    } catch (error) {
      this.errorMsg = this.t._('IDEA_AUTH.IS_THE_EMAIL_CORRECT');
      this.message.error('IDEA_AUTH.SENDING_FAILED');
    } finally {
      this.loading.hide();
    }
  }

  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
