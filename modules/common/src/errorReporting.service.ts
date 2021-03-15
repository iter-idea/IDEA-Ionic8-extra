import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { ClientInfo, ErrorReport } from 'idea-toolbox';

// from idea-config.js
declare const IDEA_PROJECT: string;
declare const IDEA_APP_VERSION: string;
declare const IDEA_API_IDEA_URL: string;
declare const IDEA_API_IDEA_VERSION: string;

export const API_URL = `https://${IDEA_API_IDEA_URL}/${IDEA_API_IDEA_VERSION}`;

@Injectable()
export class IDEAErrorReportingService {
  constructor(protected http: HttpClient, protected platform: Platform) {}

  /**
   * Send the error report to the back-end.
   */
  public sendReport(error: Error, forceSend?: boolean): Promise<void> {
    return new Promise(resolve => {
      // skip in case we don't want to send the report or the report is useless (blank error)
      if ((!this.shouldSend() && !forceSend) || !error?.name) return resolve();
      // prepare and send the report
      const report = new ErrorReport({
        version: IDEA_APP_VERSION,
        stage: IDEA_API_IDEA_VERSION,
        client: this.getClientInfo(),
        type: error.name,
        error: error.message,
        stack: error.stack
      });
      this.http
        .post(API_URL.concat(`/projects/${IDEA_PROJECT}/errorReporting`), report)
        .toPromise()
        .catch(() => {}) // note: never throw an error when reporting an error
        .finally(() => resolve());
    });
  }

  /**
   * Whether we should send the reporting or we are in a scenario in which we should skip it.
   */
  public shouldSend(): boolean {
    return IDEA_API_IDEA_VERSION === 'prod';
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
