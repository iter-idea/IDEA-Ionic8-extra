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
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _popover = inject(PopoverController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  _auth = inject(IDEAAuthService);

  newPassword: string;
  passwordPolicy: any;
  errorMsg: string;

  constructor() {
    this.passwordPolicy = this._env.idea.auth.passwordPolicy;
  }
  ngOnInit(): void {
    if (!this._auth.challengeUsername) this.goToAuth();
  }

  async confirmNewPassword(): Promise<void> {
    try {
      await this._loading.show();
      this.errorMsg = null;
      const errors = this._auth.validatePasswordAgainstPolicy(this.newPassword);
      if (errors.length === 0 && this.passwordPolicy.advancedPasswordCheck)
        errors.push(...(await this._auth.validatePasswordAgainstDatabases(this.newPassword)));
      if (errors.length)
        this.errorMsg = [
          this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW'),
          ...errors.map(x =>
            this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(x), { n: this.passwordPolicy.minLength })
          )
        ].join(' ');
      if (this.errorMsg) return this._message.error('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW');
      await this._auth.confirmNewPassword(this.newPassword);
      window.location.assign('');
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

  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
