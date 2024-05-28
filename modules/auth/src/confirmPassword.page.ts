import { Component, OnInit, inject } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { IDEAEnvironment, IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAPasswordPolicyComponent } from './passwordPolicy.component';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-confirm-password',
  templateUrl: 'confirmPassword.page.html',
  styleUrls: ['auth.scss']
})
export class IDEAConfirmPasswordPage implements OnInit {
  protected env = inject(IDEAEnvironment);

  email: string;
  newPassword: string;
  code: string;
  passwordPolicy: any;
  errorMsg: string;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private popoverCtrl: PopoverController,
    private message: IDEAMessageService,
    private loading: IDEALoadingService,
    private t: IDEATranslationsService,
    public auth: IDEAAuthService
  ) {
    this.passwordPolicy = this.env.idea.auth.passwordPolicy;
  }
  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? null;
    if (!this.email && this.route.snapshot.queryParams.user)
      this.email = decodeURIComponent(this.route.snapshot.queryParams.user);
    this.code = this.route.snapshot.queryParams.code;
  }

  async confirmPassword(): Promise<void> {
    try {
      await this.loading.show();
      this.errorMsg = null;
      const errors = this.auth.validatePasswordAgainstPolicy(this.newPassword);
      if (errors.length === 0 && this.passwordPolicy.advancedPasswordCheck) {
        const emailParts = [...this.email?.split('@')[0].split(/\W/g)];
        errors.push(...(await this.auth.validatePasswordAgainstDatabases(this.newPassword, emailParts)));
      }
      if (errors.length)
        this.errorMsg = [
          this.t._('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW'),
          ...errors.map(x =>
            this.t._('IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(x), { n: this.passwordPolicy.minLength })
          )
        ].join(' ');
      if (this.errorMsg) return this.message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');
      await this.auth.confirmPassword(this.email, this.code, this.newPassword);
      this.message.success('IDEA_AUTH.PASSWORD_CHANGED');
      this.goToAuth();
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

  goToForgotPassword(): void {
    this.navCtrl.navigateBack(['auth/forgot-password']);
  }
  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
