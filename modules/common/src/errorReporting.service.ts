import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { ClientInfo, ErrorReport } from 'idea-toolbox';

import { IDEAEnvironment } from '../environment';

@Injectable()
export class IDEAErrorReportingService {
  protected env = inject(IDEAEnvironment);

  apiStage: string;
  apiUrl: string;

  constructor(
    protected http: HttpClient,
    protected platform: Platform
  ) {
    this.apiStage = this.env.idea.ideaApi?.stage || (this.env.idea.ideaApi as any)?.version;
    this.apiUrl = `https://${this.env.idea.ideaApi?.url}/${this.apiStage}`;
  }

  /**
   * Send the error report to the back-end.
   */
  public sendReport(error: Error, forceSend?: boolean): Promise<void> {
    return new Promise(resolve => {
      // skip in case we don't want to send the report or the report is useless (blank error)
      if ((!this.shouldSend() && !forceSend) || !error?.name) return resolve();
      // prepare and send the report
      const report = new ErrorReport({
        version: this.env.idea.app.version,
        stage: this.apiStage,
        client: this.getClientInfo(),
        type: error.name,
        error: error.message,
        stack: error.stack
      });
      this.http
        .post(this.apiUrl.concat(`/projects/${this.env.idea.project}/errorReporting`), report)
        .toPromise()
        .catch(() => {}) // note: never throw an error when reporting an error
        .finally(() => resolve());
    });
  }

  /**
   * Whether we should send the reporting or we are in a scenario in which we should skip it.
   */
  public shouldSend(): boolean {
    return this.apiStage === 'prod';
  }

  /**
   * Acquire the client's info.
   */
  public getClientInfo(): ClientInfo {
    return new ClientInfo({
      timestamp: new Date().toISOString(),
      platform: this.platform.platforms().join(' '),
      screenWidth: this.platform.width(),
      screenHeight: this.platform.height(),
      isLandScape: this.platform.isLandscape(),
      url: this.platform.url(),
      referrer: document.referrer,
      isOnline: navigator.onLine,
      language: navigator.language,
      userAgent: navigator.userAgent
    });
  }
}
