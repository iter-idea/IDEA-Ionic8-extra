import { Component, OnInit, inject } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { isEmpty } from 'idea-toolbox';
import { IDEAEnvironment, IDEAMessageService, IDEALoadingService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAPasswordPolicyComponent } from './passwordPolicy.component';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-sign-up',
  templateUrl: 'signUp.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASignUpPage implements OnInit {
  protected _env = inject(IDEAEnvironment);
  private _nav = inject(NavController);
  private _popover = inject(PopoverController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  public _auth = inject(IDEAAuthService);

  email: string;
  password: string;
  agreementsCheck = false;
  passwordPolicy: any;
  errorMsg: string;

  constructor() {
    this.passwordPolicy = this._env.idea.auth.passwordPolicy;
  }
  ngOnInit(): void {
    if (!this._env.idea.auth.registrationIsPossible) return this.goToAuth();
    this.agreementsCheck =
      this._translate._('IDEA_VARIABLES.TERMS_AND_CONDITIONS_URL') ||
      this._translate._('IDEA_VARIABLES.PRIVACY_POLICY_URL')
        ? this.agreementsCheck
        : true;
  }

  async register(): Promise<void> {
    try {
      await this._loading.show();
      this.errorMsg = null;
      if (isEmpty(this.email, 'email')) this.errorMsg = this._translate._('IDEA_AUTH.VALID_EMAIL_OBLIGATORY');
      else {
        const errors = this._auth.validatePasswordAgainstPolicy(this.password);
        if (errors.length === 0 && this.passwordPolicy.advancedPasswordCheck) {
          const emailParts = [...this.email?.split('@')[0].split(/\W/g)];
          errors.push(...(await this._auth.validatePasswordAgainstDatabases(this.password, emailParts)));
        }
        if (errors.length)
          this.errorMsg = [
            this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS_FOLLOW'),
            ...errors.map(x =>
              this._translate._('IDEA_AUTH.PASSWORD_REQUIREMENTS.'.concat(x), { n: this.passwordPolicy.minLength })
            )
          ].join(' ');
      }
      if (this.errorMsg) return this._message.error('IDEA_AUTH.REGISTRATION_FAILED');
      await this._auth.register(this.email, this.password);
      this._message.success('IDEA_AUTH.REGISTRATION_COMPLETED');
      this.goToAuth();
    } catch (err) {
      this.errorMsg = (err as any).message;
      this._message.error('IDEA_AUTH.REGISTRATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  translationExists(key: string): boolean {
    return !!this._translate._(key);
  }

  async openPasswordPolicy(event: Event): Promise<void> {
    const cssClass = 'passwordPolicyPopover';
    const popover = await this._popover.create({ component: IDEAPasswordPolicyComponent, event, cssClass });
    await popover.present();
  }

  goToResendLink(): void {
    this._nav.navigateForward(['auth', 'resend-link']);
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
