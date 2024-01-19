import { Component, OnInit } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { isEmpty } from 'idea-toolbox';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAPasswordPolicyComponent } from './passwordPolicy.component';

import { IDEAAuthService } from './auth.service';

import { environment as env } from '@env/environment';

@Component({
  selector: 'idea-sign-up',
  templateUrl: 'signUp.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASignUpPage implements OnInit {
  email: string;
  password: string;
  agreementsCheck = false;
  passwordPolicy = env.idea.auth.passwordPolicy;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private popoverCtrl: PopoverController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private t: IDEATranslationsService,
    public auth: IDEAAuthService
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
    else {
      const errors = this.auth.validatePasswordAgainstPolicy(this.password);
      if (errors.length)
        this.errorMsg = [
          this.t._('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW'),
          ...errors.map(x =>
            this.t._('IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(x), { n: this.passwordPolicy.minLength })
          )
        ].join(' ');
    }
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

  async openPasswordPolicy(event: Event): Promise<void> {
    const cssClass = 'passwordPolicyPopover';
    const popover = await this.popoverCtrl.create({ component: IDEAPasswordPolicyComponent, event, cssClass });
    await popover.present();
  }

  goToResendLink(): void {
    this.navCtrl.navigateForward(['auth/resend-link']);
  }
  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
