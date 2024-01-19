import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { mdToHtml, AppStatus } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEAAppStatusService } from './appStatus.service';

import { environment as env } from '@env/environment';

/**
 * Handle blocking status messaging for the app.
 */
@Component({
  selector: 'idea-app-status',
  templateUrl: 'appStatus.page.html',
  styleUrls: ['appStatus.page.scss']
})
export class IDEAAppStatusPage {
  status: AppStatus;
  htmlContent: string;

  appleStoreURL = (env.idea.app as any)?.appleStoreURL;
  googleStoreURL = (env.idea.app as any)?.googleStoreURL;

  appIconURI = '/assets/icons/icon.svg';

  constructor(
    private platform: Platform,
    private t: IDEATranslationsService,
    private appStatus: IDEAAppStatusService
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.status = await this.appStatus.check();
    if (this.status.content) this.htmlContent = mdToHtml(this.status.content);
  }

  getTitle(): string {
    if (this.status.inMaintenance) return this.t._('IDEA_COMMON.APP_STATUS.MAINTENANCE');
    if (this.status.mustUpdate) return this.t._('IDEA_COMMON.APP_STATUS.MUST_UPDATE');
    return this.t._('IDEA_COMMON.APP_STATUS.EVERYTHING_IS_OK');
  }

  isAndroid(): boolean {
    return this.platform.is('android');
  }
  isIOS(): boolean {
    return this.platform.is('ios');
  }

  async openGoogleStoreLink(): Promise<void> {
    await Browser.open({ url: this.googleStoreURL });
  }
  async opeAppleStoreLink(): Promise<void> {
    await Browser.open({ url: this.appleStoreURL });
  }
}
