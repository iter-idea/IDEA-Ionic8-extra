import { Component, inject } from '@angular/core';
import { IDEAEnvironment } from '@idea-ionic/common';

@Component({
  selector: 'idea-password-policy',
  template: `
    <ion-card class="passwordPolicyCard">
      <ion-card-header>
        <ion-card-title>{{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS_TITLE' | translate }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <ul>
          <li>{{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.MIN_LENGTH' | translate : { n: passwordPolicy.minLength } }}</li>
          <li *ngIf="passwordPolicy.requireDigits">
            {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_DIGITS' | translate }}
          </li>
          <li *ngIf="passwordPolicy.requireSymbols">
            {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_SYMBOLS' | translate }}
          </li>
          <li *ngIf="passwordPolicy.requireUppercase">
            {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE' | translate }}
          </li>
          <li *ngIf="passwordPolicy.requireLowercase">
            {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE' | translate }}
          </li>
        </ul>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      ion-card.passwordPolicyCard {
        box-shadow: none;
        border: none;
        padding: 6px;
      }
      ion-card.passwordPolicyCard ion-card-title {
        font-size: 1rem;
      }
      ion-card.passwordPolicyCard ul {
        margin: 0;
      }
    `
  ]
})
export class IDEAPasswordPolicyComponent {
  protected _env = inject(IDEAEnvironment);

  passwordPolicy: any;

  constructor() {
    this.passwordPolicy = this._env.idea.auth.passwordPolicy;
  }
}
