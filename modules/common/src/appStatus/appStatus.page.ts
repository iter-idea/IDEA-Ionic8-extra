import { Component, inject, ChangeDetectionStrategy, computed, signal } from '@angular/core';
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
  IonSpinner,
  Platform
} from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { mdToHtml } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEAAppStatusService } from './appStatus.service';

/**
 * How often the page reads the status again during a maintenance, to let the user in as soon as it's over.
 */
const MAINTENANCE_POLLING_MS = 30 * 1000;

/**
 * Handle blocking status messaging for the app.
 */
@Component({
  selector: 'idea-app-status',
  imports: [
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
    IonSpinner,
    IDEATranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (status(); as status) {
      <ion-content class="ion-padding">
        <div class="maxWidthContainer">
          <ion-card color="dark">
            <ion-card-header>
              <ion-card-title class="ion-text-center">
                <h3>{{ title() | translate }}</h3>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content class="ion-align-items-center">
              <ion-img class="logo" [src]="appIconURI" (ionError)="$event.target.style.display = 'none'" />
              @if (htmlContent()) {
                <p class="htmlContent" [innerHTML]="htmlContent()"></p>
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
              @if (status.inMaintenance) {
                <p class="hint">{{ 'IDEA_COMMON.APP_STATUS.CHECKS_BY_ITSELF' | translate }}</p>
                <div class="ion-text-center">
                  <ion-button fill="outline" color="light" [disabled]="checking()" (click)="tryAgain()">
                    @if (checking()) {
                      <ion-spinner slot="start" name="dots" />
                    } @else {
                      <ion-icon slot="start" name="refresh" />
                    }
                    {{ 'IDEA_COMMON.APP_STATUS.TRY_AGAIN' | translate }}
                  </ion-button>
                </div>
              }
              @if (!status.inMaintenance && !status.mustUpdate) {
                <div class="ion-text-center">
                  <ion-button (click)="goToApp()">
                    {{ 'IDEA_COMMON.APP_STATUS.GO_TO_APP' | translate }}
                  </ion-button>
                </div>
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
      p.hint {
        margin: 0 0 16px 0;
        padding: 0 20px;
        text-align: center;
        font-size: 0.9em;
        opacity: 0.8;
      }
    `
  ]
})
export class IDEAAppStatusPage {
  protected _env = inject(IDEAEnvironment);
  private _platform = inject(Platform);
  private _appStatus = inject(IDEAAppStatusService);

  status = this._appStatus.status;
  htmlContent = computed((): string => (this.status()?.content ? mdToHtml(this.status().content) : null));
  title = computed((): string => {
    if (this.status()?.inMaintenance) return 'IDEA_COMMON.APP_STATUS.MAINTENANCE';
    if (this.status()?.mustUpdate) return 'IDEA_COMMON.APP_STATUS.MUST_UPDATE';
    return 'IDEA_COMMON.APP_STATUS.EVERYTHING_IS_OK';
  });

  checking = signal(false);
  private polling: ReturnType<typeof setInterval>;

  appleStoreURL: string;
  googleStoreURL: string;

  appIconURI = '/assets/icons/icon.svg';

  constructor() {
    this.appleStoreURL = (this._env.idea.app as any)?.appleStoreURL;
    this.googleStoreURL = (this._env.idea.app as any)?.googleStoreURL;
  }

  async ionViewWillEnter(): Promise<void> {
    // only read, never `check`: the page must not send the app to itself
    await this._appStatus.load();
    this.polling = setInterval((): void => {
      if (this.status()?.inMaintenance && document.visibilityState === 'visible')
        this._appStatus.refresh({ force: true });
    }, MAINTENANCE_POLLING_MS);
  }
  ionViewWillLeave(): void {
    clearInterval(this.polling);
  }

  async tryAgain(): Promise<void> {
    this.checking.set(true);
    try {
      await this._appStatus.refresh({ force: true });
    } finally {
      this.checking.set(false);
    }
  }
  goToApp(): void {
    this._appStatus.leaveStatusPage();
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
