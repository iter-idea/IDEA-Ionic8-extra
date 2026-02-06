import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonLabel,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput
} from '@ionic/angular/standalone';
import { toCanvas } from 'qrcode';
import { IDEALoadingService, IDEAMessageService, IDEATranslatePipe } from '@idea-ionic/common';

import { IDEAAuthService } from '../auth.service';

@Component({
  selector: 'idea-setup-mfa-modal',
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IonItem,
    IonCardContent,
    IonCard,
    IonLabel,
    IonListHeader,
    IonList,
    IonContent,
    IonTitle,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonInput
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
            <ion-icon name="close-circle-outline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ (isMFAEnabled ? 'IDEA_AUTH.DISABLE_MFA' : 'IDEA_AUTH.SETUP_MFA') | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list class="aList">
        <ion-list-header>
          <ion-label class="ion-text-center">
            <h2>{{ (isMFAEnabled ? 'IDEA_AUTH.DISABLE_MFA_I' : 'IDEA_AUTH.SETUP_MFA_I') | translate }}</h2>
            <p>{{ (isMFAEnabled ? 'IDEA_AUTH.DISABLE_MFA_II' : 'IDEA_AUTH.SETUP_MFA_II') | translate }}</p>
          </ion-label>
        </ion-list-header>
        <ion-card color="white">
          <ion-card-content>
            @if (!isMFAEnabled) {
              <div id="qrCodeContainer"></div>
            }
            <ion-item color="light">
              <ion-input
                type="text"
                inputmode="numeric"
                labelPlacement="floating"
                [label]="'IDEA_AUTH.OTP_CODE' | translate"
                [(ngModel)]="otpCode"
              />
            </ion-item>
            <ion-button expand="block" class="ion-margin-top" [disabled]="!otpCode" (click)="setMFA(!isMFAEnabled)">
              {{ (isMFAEnabled ? 'IDEA_AUTH.DISABLE_MFA' : 'IDEA_AUTH.ENABLE_MFA') | translate }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      ion-list.aList {
        padding-top: 0;
        ion-card {
          margin: 10px auto;
          max-width: 300px;
        }
        #qrCodeContainer {
          width: 180px;
          margin: 10px auto;
        }
      }
    `
  ]
})
export class IDEASetupMFAModalComponent implements OnInit {
  private _modal = inject(ModalController);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _auth = inject(IDEAAuthService);

  otpCode: string;
  isMFAEnabled: boolean;

  async ngOnInit(): Promise<void> {
    try {
      await this._loading.show();
      this.isMFAEnabled = await this._auth.checkIfUserHasMFAEnabled(true);
      if (!this.isMFAEnabled) {
        const url = await this._auth.getURLForEnablingMFA();
        await this.generateQRCodeCanvasByURL(url);
      }
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }
  private generateQRCodeCanvasByURL(url: string): Promise<void> {
    return new Promise((resolve, reject): void => {
      const container = document.getElementById('qrCodeContainer');
      container.innerHTML = '';
      toCanvas(url, { errorCorrectionLevel: 'L' }, (err: Error, canvas: HTMLCanvasElement): void => {
        if (err) return reject(err);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '4px';
        container.appendChild(canvas);
        resolve();
      });
    });
  }

  async setMFA(enable: boolean): Promise<void> {
    if (!this.otpCode) return;
    try {
      await this._loading.show();
      if (enable) await this._auth.enableMFA(this.otpCode);
      else await this._auth.disableMFA(this.otpCode);
      this.isMFAEnabled = enable;
      this._message.success('COMMON.OPERATION_COMPLETED');
      this._modal.dismiss({ enabled: enable });
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  close(): void {
    this._modal.dismiss();
  }
}
