import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavController,
  PopoverController,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import {
  IDEAEnvironment,
  IDEAMessageService,
  IDEALoadingService,
  IDEATranslationsService,
  IDEATranslatePipe
} from '@idea-ionic/common';

import { IDEAPasswordPolicyComponent } from './passwordPolicy.component';
import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-new-password',
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonButton,
    IonIcon,
    IonLabel,
    IonItem,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent,
    IonInput
  ],
  template: `
    <ion-content>
      <form class="flexBox">
        <ion-card class="authCard">
          <ion-card-header>
            <ion-card-title color="primary">{{ 'IDEA_AUTH.CHOOSE_A_PASSWORD' | translate }}</ion-card-title>
            <ion-card-subtitle>{{ 'IDEA_AUTH.YOU_NEED_TO_CHOOSE_A_NEW_PASSWORD' | translate }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            @if (errorMsg) {
              <p testId="newpassword.error" class="errorBox">
                <b> {{ 'IDEA_AUTH.ERROR' | translate }}. </b>
                {{ errorMsg }}
              </p>
            }
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="key" color="primary" />
              </ion-label>
              <ion-input
                testId="newpassword.password"
                type="password"
                spellcheck="false"
                autocorrect="off"
                autocomplete="new-password"
                [pattern]="_auth.getPasswordPolicyPatternForInput()"
                [clearOnEdit]="false"
                [placeholder]="'IDEA_AUTH.PASSWORD' | translate"
                [title]="'IDEA_AUTH.CHOOSE_A_PASSWORD' | translate"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="newPassword"
                (keyup.enter)="confirmNewPassword()"
              />
              <ion-button
                testId="openPasswordPolicyButton"
                slot="end"
                fill="clear"
                color="dark"
                (click)="openPasswordPolicy($event)"
              >
                <ion-icon icon="help-circle-outline" slot="icon-only" />
              </ion-button>
            </ion-item>
            <ion-button
              testId="confirmNewPaswordButton"
              expand="block"
              [title]="'IDEA_AUTH.CONFIRM_NEW_PASSWORD_HINT' | translate"
              (click)="confirmNewPassword()"
            >
              {{ 'IDEA_AUTH.CONFIRM_NEW_PASSWORD' | translate }}
            </ion-button>
            <ion-button
              testId="backToSignInButton"
              fill="clear"
              expand="block"
              class="smallCaseButton"
              [title]="'IDEA_AUTH.BACK_TO_SIGN_IN_HINT' | translate"
              (click)="goToAuth()"
            >
              {{ 'IDEA_AUTH.BACK_TO_SIGN_IN' | translate }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </form>
    </ion-content>
  `,
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
