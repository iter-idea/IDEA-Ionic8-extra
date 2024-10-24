import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonImg,
  IonRow,
  Platform
} from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { mdToHtml, AppStatus } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEAAppStatusService } from './appStatus.service';

/**
 * Handle blocking status messaging for the app.
 */
@Component({
  selector: 'idea-app-status',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonCardTitle,
    IonImg,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonIcon,
    IDEATranslatePipe
  ],
  template: `
    @if (status) {
      <ion-content class="ion-padding">
        <div class="maxWidthContainer">
          <ion-card color="dark">
            <ion-card-header>
              <ion-card-title class="ion-text-center">
                <h3>{{ getTitle() }}</h3>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content class="ion-align-items-center">
              <ion-img class="logo" [src]="appIconURI" (ionError)="$event.target.style.display = 'none'" />
              @if (htmlContent) {
                <p class="htmlContent" [innerHTML]="htmlContent"></p>
              }
              @if (status.mustUpdate) {
                <ion-grid>
                  <ion-row>
                    <ion-col class="ion-text-center">
                      @if (isIOS() && appleStoreURL) {
                        <ion-button (click)="opeAppleStoreLink()">
                          <ion-icon slot="start" name="logo-apple-appstore" />
                          {{ 'IDEA_COMMON.APP_STATUS.UPDATE' | translate }}
                        </ion-button>
                      }
                      @if (isAndroid() && googleStoreURL) {
                        <ion-button (click)="openGoogleStoreLink()">
                          <ion-icon slot="start" name="logo-google-playstore" />
                          {{ 'IDEA_COMMON.APP_STATUS.UPDATE' | translate }}
                        </ion-button>
                      }
                    </ion-col>
                  </ion-row>
                </ion-grid>
              }
            </ion-card-content>
          </ion-card>
        </div>
      </ion-content>
    }
  `,
  styles: [
    `
      ion-img.logo {
        width: 100px;
        margin: 0 auto;
        margin-bottom: 24px;
      }
      p.htmlContent {
        margin: 0 0 24px 0;
        padding: 20px;
      }
    `
  ]
})
export class IDEAAppStatusPage {
  protected _env = inject(IDEAEnvironment);
  private _platform = inject(Platform);
  private _translate = inject(IDEATranslationsService);
  private _appStatus = inject(IDEAAppStatusService);

  status: AppStatus;
  htmlContent: string;

  appleStoreURL: string;
  googleStoreURL: string;

  appIconURI = '/assets/icons/icon.svg';

  constructor() {
    this.appleStoreURL = (this._env.idea.app as any)?.appleStoreURL;
    this.googleStoreURL = (this._env.idea.app as any)?.googleStoreURL;
  }

  async ionViewWillEnter(): Promise<void> {
    this.status = await this._appStatus.check();
    if (this.status.content) this.htmlContent = mdToHtml(this.status.content);
  }

  getTitle(): string {
    if (this.status.inMaintenance) return this._translate._('IDEA_COMMON.APP_STATUS.MAINTENANCE');
    if (this.status.mustUpdate) return this._translate._('IDEA_COMMON.APP_STATUS.MUST_UPDATE');
    return this._translate._('IDEA_COMMON.APP_STATUS.EVERYTHING_IS_OK');
  }

  isAndroid(): boolean {
    return this._platform.is('android');
  }
  isIOS(): boolean {
    return this._platform.is('ios');
  }

  async openGoogleStoreLink(): Promise<void> {
    await Browser.open({ url: this.googleStoreURL });
  }
  async opeAppleStoreLink(): Promise<void> {
    await Browser.open({ url: this.appleStoreURL });
  }
}
