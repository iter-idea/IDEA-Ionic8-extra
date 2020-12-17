import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import IdeaX = require('idea-toolbox');

// from idea-config.js
declare const IDEA_PROJECT: string;
declare const IDEA_API_IDEA_ID: string;
declare const IDEA_API_IDEA_REGION: string;
declare const IDEA_API_IDEA_VERSION: string;

export const API_URL =
  `https://${IDEA_API_IDEA_ID}.execute-api.${IDEA_API_IDEA_REGION}.amazonaws.com/` + `${IDEA_API_IDEA_VERSION}`;

@Injectable()
export class IDEAErrorReportingService {
  constructor(public http: HttpClient) {}

  public sendReport(error: Error, forceSend?: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.shouldSend() && !forceSend) return resolve();
      const report = new IdeaX.ErrorReport();
      report.load({ project: IDEA_PROJECT, error, client: this.getClientInfo() });
      this.http
        .post(API_URL.concat(`/projects/${IDEA_PROJECT}/errorReporting`), report)
        .toPromise()
        .catch(() => {})
        .finally(() => resolve()); // note: never throw an error when reporting an error
    });
  }

  protected shouldSend(): boolean {
    return IDEA_API_IDEA_VERSION && IDEA_API_IDEA_VERSION === 'prod';
  }

  public getClientInfo(): IdeaX.ClientInfo {
    return new IdeaX.ClientInfo({
      timestamp: new Date(),
      timezone: new Date().getTimezoneOffset() / 60,
      pageOn: window.location.pathname,
      referrer: document.referrer,
      browserName: navigator.appName,
      browserEngine: navigator.product,
      browserVersion: navigator.appVersion,
      browserUserAgent: navigator.userAgent,
      browserLanguage: navigator.language,
      browserOnline: navigator.onLine,
      browserPlatform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      screenPixelDepth: screen.pixelDepth
    });
  }
}
