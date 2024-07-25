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
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _route = inject(ActivatedRoute);
  private _popover = inject(PopoverController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  _auth = inject(IDEAAuthService);

  email: string;
  newPassword: string;
  code: string;
  passwordPolicy: any;
  errorMsg: string;

  constructor() {
    this.passwordPolicy = this._env.idea.auth.passwordPolicy;
  }
  ngOnInit(): void {
    this.email = this._route.snapshot.queryParamMap.get('email') ?? null;
    if (!this.email && this._route.snapshot.queryParams.user)
      this.email = decodeURIComponent(this._route.snapshot.queryParams.user);
    this.code = this._route.snapshot.queryParams.code;
  }

  async confirmPassword(): Promise<void> {
    try {
      await this._loading.show();
      this.errorMsg = null;
      const errors = this._auth.validatePasswordAgainstPolicy(this.newPassword);
      if (errors.length === 0 && this.passwordPolicy.advancedPasswordCheck) {
        const emailParts = [...this.email?.split('@')[0].split(/\W/g)];
        errors.push(...(await this._auth.validatePasswordAgainstDatabases(this.newPassword, emailParts)));
      }
      if (errors.length)
        this.errorMsg = [
          this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW'),
          ...errors.map(x =>
            this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(x), { n: this.passwordPolicy.minLength })
          )
        ].join(' ');
      if (this.errorMsg) return this._message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');
      await this._auth.confirmPassword(this.email, this.code, this.newPassword);
      this._message.success('IDEA_AUTH.PASSWORD_CHANGED');
      this.goToAuth();
    } catch (error) {
      this.errorMsg = (error as any).message;
      this._message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');
    } finally {
      this._loading.hide();
    }
  }

  async openPasswordPolicy(event: Event): Promise<void> {
    const cssClass = 'passwordPolicyPopover';
    const popover = await this._popover.create({ component: IDEAPasswordPolicyComponent, event, cssClass });
    await popover.present();
  }

  goToForgotPassword(): void {
    this._nav.navigateBack(['auth', 'forgot-password']);
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
