import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-confirm-password',
  templateUrl: 'confirmPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAConfirmPasswordPage implements OnInit {
  email: string;
  newPassword: string;
  code: string;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private auth: IDEAAuthService,
    private t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? null;
    if (!this.email && this.route.snapshot.queryParams.user)
      this.email = decodeURIComponent(this.route.snapshot.queryParams.user);
    this.code = this.route.snapshot.queryParams.code;
  }

  async confirmPassword(): Promise<void> {
    try {
      this.errorMsg = null;
      await this.loading.show();
      await this.auth.confirmPassword(this.email, this.code, this.newPassword);
      this.message.success('IDEA_AUTH.PASSWORD_CHANGED');
      this.goToAuth();
    } catch (error) {
      this.errorMsg = this.t._('IDEA_AUTH.CONFIRM_PASSWORD_ERROR', { n: 8 });
      this.message.error(this.errorMsg, true);
    } finally {
      this.loading.hide();
    }
  }

  goToForgotPassword(): void {
    this.navCtrl.navigateBack(['auth/forgot-password']);
  }
  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
