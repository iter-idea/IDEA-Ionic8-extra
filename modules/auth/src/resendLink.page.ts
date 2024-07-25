import { Component, inject } from '@angular/core';
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

  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _translate = inject(IDEATranslationsService);

  async resendConfirmationLink(): Promise<void> {
    this.errorMsg = null;
    if (!this.email) {
      this.errorMsg = this._translate._('IDEA_AUTH.VALID_EMAIL_OBLIGATORY');
      this._message.error('IDEA_AUTH.SENDING_FAILED');
      return;
    }
    try {
      await this._loading.show();
      await this._auth.resendConfirmationCode(this.email);
      this._message.success('IDEA_AUTH.CONFIRMATION_LINK_SENT');
      this.goToAuth();
    } catch (error) {
      this.errorMsg = this._translate._('IDEA_AUTH.IS_THE_EMAIL_CORRECT');
      this._message.error('IDEA_AUTH.SENDING_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
