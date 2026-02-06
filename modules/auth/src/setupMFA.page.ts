import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  NavController,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton
} from '@ionic/angular/standalone';
import { IDEATranslatePipe } from '@idea-ionic/common';

import { IDEASetupMFAButtonComponent } from './setupMFA/setupMFAButton.component';

@Component({
  selector: 'idea-mfa-setup',
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IDEASetupMFAButtonComponent,
    IonButton,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonContent
  ],
  template: `
    <ion-content>
      <form class="flexBox">
        <ion-card class="authCard">
          <ion-card-header>
            <ion-card-title color="primary">{{ 'IDEA_AUTH.SETUP_MFA' | translate }}</ion-card-title>
            <ion-card-subtitle>{{ 'IDEA_AUTH.MFA_IS_MANDATORY' | translate }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <idea-setup-mfa-button testId="setupMfaButton" (change)="reloadApp()" />
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
export class IDEASetupMFAPage {
  private _nav = inject(NavController);

  reloadApp(): void {
    window.location.assign('');
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
