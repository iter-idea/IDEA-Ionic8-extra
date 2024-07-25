import { Component, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { mdToHtml, AppStatus } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAAppStatusService } from './appStatus.service';

/**
 * Handle blocking status messaging for the app.
 */
@Component({
  selector: 'idea-app-status',
  templateUrl: 'appStatus.page.html',
  styleUrls: ['appStatus.page.scss']
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
