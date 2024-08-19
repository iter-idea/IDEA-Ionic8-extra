import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-mfa-challenge',
  templateUrl: 'mfaChallenge.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAMFAChallengePage implements OnInit {
  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _translate = inject(IDEATranslationsService);

  otpCode: string;
  errorMsg: string;

  ngOnInit(): void {
    if (!this._auth.challengeUsername) this.goToAuth();
  }

  async completeMFAChallenge(): Promise<void> {
    try {
      this.errorMsg = null;
      await this._loading.show();
      await this._auth.completeMFAChallenge(this.otpCode);
      window.location.assign('');
    } catch (error) {
      this.errorMsg = this._translate._('IDEA_AUTH.INVALID_OTP_CODE');
      this._message.error(this.errorMsg, true);
    } finally {
      this._loading.hide();
    }
  }

  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
