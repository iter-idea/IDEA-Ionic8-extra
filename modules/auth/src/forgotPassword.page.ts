import { Component, inject } from '@angular/core';
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

  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);

  async forgotPassword(): Promise<void> {
    try {
      await this._loading.show();
      await this._auth.forgotPassword(this.email);
      this._message.success('IDEA_AUTH.PASSWORD_RESET_CODE_SENT');
      this.goToConfirmPassword();
    } catch (error) {
      this._message.error('IDEA_AUTH.USER_NOT_FOUND');
    } finally {
      this._loading.hide();
    }
  }

  goToConfirmPassword(): void {
    this._nav.navigateForward(['auth', 'confirm-password'], { queryParams: { email: this.email ?? null } });
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
