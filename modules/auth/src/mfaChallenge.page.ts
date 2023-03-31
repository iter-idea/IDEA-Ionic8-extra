import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-mfa-challenge',
  templateUrl: 'mfaChallenge.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAMFAChallengePage implements OnInit {
  otpCode: string;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private auth: IDEAAuthService,
    private t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    if (!this.auth.challengeUsername) this.goToAuth();
  }

  async completeMFAChallenge(): Promise<void> {
    try {
      this.errorMsg = null;
      await this.loading.show();
      await this.auth.completeMFAChallenge(this.otpCode);
      window.location.assign('');
    } catch (error) {
      this.errorMsg = this.t._('IDEA_AUTH.INVALID_OTP_CODE');
      this.message.error(this.errorMsg, true);
    } finally {
      this.loading.hide();
    }
  }

  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
