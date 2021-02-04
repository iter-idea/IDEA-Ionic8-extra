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
  /**
   * The email address used to identify the account.
   */
  public email: string;
  /**
   * The error message to display in the UI, if any.
   */
  public errorMsg: string;

  constructor(
    public navCtrl: NavController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public auth: IDEAAuthService,
    public t: IDEATranslationsService
  ) {}

  /**
   * Resend the link to confirm the email address.
   */
  public async resendConfirmationLink() {
    this.errorMsg = null;
    if (!this.email) {
      this.errorMsg = this.t._('IDEA_AUTH.VALID_EMAIL_OBLIGATORY');
      this.message.error('IDEA_AUTH.SENDING_FAILED');
      return;
    }
    await this.loading.show();
    this.auth
      .resendConfirmationCode(this.email)
      .then(() => {
        this.message.success('IDEA_AUTH.CONFIRMATION_LINK_SENT');
        this.goToAuth();
      })
      .catch(() => {
        this.errorMsg = this.t._('IDEA_AUTH.IS_THE_EMAIL_CORRECT');
        this.message.error('IDEA_AUTH.SENDING_FAILED');
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
