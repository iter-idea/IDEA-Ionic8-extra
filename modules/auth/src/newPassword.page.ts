import { Component, OnInit, inject } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { IDEAEnvironment, IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAPasswordPolicyComponent } from './passwordPolicy.component';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-new-password',
  templateUrl: 'newPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEANewPasswordPage implements OnInit {
  protected env = inject(IDEAEnvironment);

  newPassword: string;
  passwordPolicy: any;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private popoverCtrl: PopoverController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private t: IDEATranslationsService,
    public auth: IDEAAuthService
  ) {
    this.passwordPolicy = this.env.idea.auth.passwordPolicy;
  }
  ngOnInit(): void {
    if (!this.auth.challengeUsername) this.goToAuth();
  }

  async confirmNewPassword(): Promise<void> {
    try {
      this.errorMsg = null;
      const errors = this.auth.validatePasswordAgainstPolicy(this.newPassword);
      if (errors.length)
        this.errorMsg = [
          this.t._('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW'),
          ...errors.map(x =>
            this.t._('IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(x), { n: this.passwordPolicy.minLength })
          )
        ].join(' ');
      if (this.errorMsg) return this.message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');

      await this.loading.show();
      await this.auth.confirmNewPassword(this.newPassword);
      window.location.assign('');
    } catch (error) {
      this.errorMsg = (error as any).message;
      this.message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');
    } finally {
      this.loading.hide();
    }
  }

  async openPasswordPolicy(event: Event): Promise<void> {
    const cssClass = 'passwordPolicyPopover';
    const popover = await this.popoverCtrl.create({ component: IDEAPasswordPolicyComponent, event, cssClass });
    await popover.present();
  }

  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
