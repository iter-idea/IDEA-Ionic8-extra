import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAAuthService } from './auth.service';
import { IDEAMessageService } from '../message.service';
import { IDEALoadingService } from '../loading.service';

@Component({
  selector: 'idea-resend-link',
  templateUrl: 'resendLink.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAResendLinkPage {
  protected email: string;
  protected password: string;
  protected errorMsg: string;

  constructor(
    protected navCtrl: NavController,
    protected message: IDEAMessageService,
    protected loading: IDEALoadingService,
    protected auth: IDEAAuthService,
    protected t: TranslateService
  ) {}

  /**
   * Resend the link to confirm the email address.
   */
  protected resendConfirmationLink() {
    this.errorMsg = null;
    if (!this.email) {
      this.errorMsg = this.t.instant('IDEA.AUTH.EMAIL_OBLIGATORY');
      this.message.error('IDEA.AUTH.SENDING_FAILED');
      return;
    }
    this.loading.show();
    this.auth.resendConfirmationCode(this.email)
    .then(() => {
      this.loading.hide();
      this.message.success('IDEA.AUTH.CONFIRMATION_LINK_SENT');
      this.goToAuth();
    })
    .catch(() => {
      this.loading.hide();
      this.errorMsg = this.t.instant('IDEA.AUTH.IS_THE_EMAIL_CORRECT');
      this.message.error('IDEA.AUTH.SENDING_FAILED');
    });
  }

  /**
   * Go to auth page.
   */
  protected goToAuth() {
    this.navCtrl.navigateBack(['auth']);
  }
}
