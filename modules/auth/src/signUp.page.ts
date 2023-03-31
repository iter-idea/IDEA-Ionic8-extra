import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { isEmpty } from 'idea-toolbox';

import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';
import { IDEAAuthService } from './auth.service';

import { environment as env } from '@env';

@Component({
  selector: 'idea-sign-up',
  templateUrl: 'signUp.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASignUpPage implements OnInit {
  email: string;
  password: string;
  agreementsCheck = false;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private auth: IDEAAuthService,
    private t: IDEATranslationsService
  ) {}
  ngOnInit(): void {
    if (!env.idea.auth.registrationIsPossible) return this.goToAuth();
    this.agreementsCheck =
      this.t._('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') || this.t._('IDEA_VARIABLES.PRIVACY_POLICY_URL')
        ? this.agreementsCheck
        : true;
  }

  async register(): Promise<void> {
    this.errorMsg = null;
    if (isEmpty(this.email, 'email')) this.errorMsg = this.t._('IDEA_AUTH.VALID_EMAIL_OBLIGATORY');
    else if (!this.password || this.password.length < 8)
      this.errorMsg = this.t._('IDEA_AUTH.PASSWORD_POLICY_VIOLATION', { n: 8 });
    if (this.errorMsg) return this.message.error('IDEA_AUTH.REGISTRATION_FAILED');

    try {
      await this.loading.show();
      await this.auth.register(this.email, this.password);
      this.message.success('IDEA_AUTH.REGISTRATION_COMPLETED');
      this.goToAuth();
    } catch (err) {
      this.errorMsg = (err as any).message;
      this.message.error('IDEA_AUTH.REGISTRATION_FAILED');
    } finally {
      this.loading.hide();
    }
  }

  translationExists(key: string): boolean {
    return !!this.t._(key);
  }

  goToResendLink(): void {
    this.navCtrl.navigateForward(['auth/resend-link']);
  }
  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
