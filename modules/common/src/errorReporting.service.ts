import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { ClientInfo, ErrorReport } from 'idea-toolbox';

import { IDEAEnvironment } from '../environment';

@Injectable()
export class IDEAErrorReportingService {
  protected _env = inject(IDEAEnvironment);
  protected _http = inject(HttpClient);
  protected _platform = inject(Platform);

  apiStage: string;
  apiUrl: string;

  constructor() {
    this.apiStage = this._env.idea.ideaApi?.stage || (this._env.idea.ideaApi as any)?.version;
    this.apiUrl = 'https://'.concat([this._env.idea.ideaApi?.url, this.apiStage].filter(x => x).join('/'));
  }

  /**
   * Send the error report to the back-end.
   */
  sendReport(error: Error, forceSend?: boolean): Promise<void> {
    return new Promise(resolve => {
      // skip in case we don't want to send the report or the report is useless (blank error)
      if ((!this.shouldSend() && !forceSend) || !error?.name) return resolve();
      // prepare and send the report
      const report = new ErrorReport({
        version: this._env.idea.app.version,
        stage: this.apiStage,
        client: this.getClientInfo(),
        type: error.name,
        error: error.message,
        stack: error.stack
      });
      this._http
        .post(this.apiUrl.concat(`/projects/${this._env.idea.project}/errorReporting`), report)
        .toPromise()
        .catch(() => {}) // note: never throw an error when reporting an error
        .finally(() => resolve());
    });
  }

  /**
   * Whether we should send the reporting or we are in a scenario in which we should skip it.
   */
  shouldSend(): boolean {
    return this.apiStage === 'prod';
  }

  /**
   * Acquire the client's info.
   */
  getClientInfo(): ClientInfo {
    return new ClientInfo({
      timestamp: new Date().toISOString(),
      platform: this._platform.platforms().join(' '),
      screenWidth: this._platform.width(),
      screenHeight: this._platform.height(),
      isLandScape: this._platform.isLandscape(),
      url: this._platform.url(),
      referrer: document.referrer,
      isOnline: navigator.onLine,
      language: navigator.language,
      userAgent: navigator.userAgent
    });
  }
}
