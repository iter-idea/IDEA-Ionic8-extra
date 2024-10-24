import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavController,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonItem,
  IonCardContent,
  IonLabel,
  IonIcon,
  IonButton,
  IonInput
} from '@ionic/angular/standalone';
import { IDEAMessageService, IDEALoadingService, IDEATranslationsService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from './auth.service';

@Component({
  selector: 'idea-mfa-challenge',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonButton,
    IonIcon,
    IonLabel,
    IonCardContent,
    IonItem,
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
            <ion-card-title color="primary">{{ 'IDEA_AUTH.ENTER_OTP_CODE' | translate }}</ion-card-title>
            <ion-card-subtitle>{{ 'IDEA_AUTH.ENTER_OTP_CODE_I' | translate }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            @if (errorMsg) {
              <p class="errorBox">
                <b>{{ 'IDEA_AUTH.ERROR' | translate }}.</b>
                {{ errorMsg }}
              </p>
            }
            <ion-item>
              <ion-label position="inline">
                <ion-icon name="key" color="primary" />
              </ion-label>
              <ion-input
                inputmode="numeric"
                [placeholder]="'IDEA_AUTH.OTP_CODE' | translate"
                [title]="'IDEA_AUTH.ENTER_OTP_CODE' | translate"
                [ngModelOptions]="{ standalone: true }"
                [(ngModel)]="otpCode"
                (keyup.enter)="completeMFAChallenge()"
              />
            </ion-item>
            <ion-button
              expand="block"
              [title]="'IDEA_AUTH.CONFIRM_OTP_CODE_HINT' | translate"
              (click)="completeMFAChallenge()"
            >
              {{ 'IDEA_AUTH.CONFIRM_OTP_CODE' | translate }}
            </ion-button>
            <ion-button
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
export class IDEAMFAChallengePage implements OnInit {
  private _nav = inject(NavController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _auth = inject(IDEAAuthService);
  private _translate = inject(IDEATranslationsService);

  otpCode: string;
  errorMsg: string;

  ngOnInit(): void {
    if (!this._auth.challengeUsername) this.goToAuth();
  }

  async completeMFAChallenge(): Promise<void> {
    try {
      this.errorMsg = null;
      await this._loading.show();
      await this._auth.completeMFAChallenge(this.otpCode);
      window.location.assign('');
    } catch (error) {
      this.errorMsg = this._translate._('IDEA_AUTH.INVALID_OTP_CODE');
      this._message.error(this.errorMsg, true);
    } finally {
      this._loading.hide();
    }
  }

  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
