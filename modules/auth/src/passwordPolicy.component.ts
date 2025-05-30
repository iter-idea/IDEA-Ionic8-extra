import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';
import { IDEAEnvironment, IDEATranslatePipe } from '@idea-ionic/common';

@Component({
  selector: 'idea-password-policy',
  standalone: true,
  imports: [CommonModule, IDEATranslatePipe, IonCard, IonCardHeader, IonCardTitle, IonCardContent],
  template: `
    <ion-card class="passwordPolicyCard">
      <ion-card-header>
        <ion-card-title>{{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS_TITLE' | translate }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <ul>
          <li>{{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.MIN_LENGTH' | translate: { n: passwordPolicy.minLength } }}</li>
          @if (passwordPolicy.requireDigits) {
            <li>
              {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_DIGITS' | translate }}
            </li>
          }
          @if (passwordPolicy.requireSymbols) {
            <li>
              {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_SYMBOLS' | translate }}
            </li>
          }
          @if (passwordPolicy.requireUppercase) {
            <li>
              {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE' | translate }}
            </li>
          }
          @if (passwordPolicy.requireLowercase) {
            <li>
              {{ 'IDEA_AUTH.PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE' | translate }}
            </li>
          }
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
