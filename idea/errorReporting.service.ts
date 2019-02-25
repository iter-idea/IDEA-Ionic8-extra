import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// from idea-config.js
declare const IDEA_PROJECT: string;
declare const IDEA_API_VERSION: string;
declare const IDEA_ERROR_REPORTING_API_URL: string;

@Injectable()
export class IDEAErrorReportingService {
  constructor(protected http: HttpClient) {}

  public sendReport(error: Error, forceSend?: boolean): Promise<any> {
    return new Promise((resolve) => {
      if (!this.shouldSend() && !forceSend) resolve();
      else {
        this.http
        .post(IDEA_ERROR_REPORTING_API_URL, this.getReport(error))
        .toPromise()
        .finally(() => resolve()); // note: never throw an error when reporting an error
      }
    });
  }

  public getReport(error: Error): IDEAErrorReport {
    return <IDEAErrorReport> {
      project: IDEA_PROJECT,
      timestamp: new Date().toISOString(),
      error: this.translateError(error),
      client: this.getClientInfo()
    };
  }

  protected shouldSend(): boolean {
    return IDEA_API_VERSION && IDEA_API_VERSION === 'prod';
  }

  protected translateError(error: Error): IDEAClientError {
    return <IDEAClientError> {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  public getClientInfo(): IDEAClientInfo {
    return <IDEAClientInfo> {
      timestamp: new Date(),
      timezone: (new Date()).getTimezoneOffset() / 60,
      pageOn: window.location.pathname,
      referrer: document.referrer,
      browserName: navigator.appName,
      browserEngine: navigator.product,
      browserVersion: navigator.appVersion,
      browserUserAgent: navigator.userAgent,
      browserLanguage: navigator.language,
      browserOnline: navigator.onLine,
      browserPlatform:  navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      screenPixelDepth: screen.pixelDepth
    };
  }
}

export interface IDEAErrorReport {
  project: string;
  timestamp: string;
  error: IDEAClientError;
  client: IDEAClientInfo;
}

export interface IDEAClientError {
  name: string;
  message: string;
  stack: string;
}

export interface IDEAClientInfo {
  timestamp: Date;
  timezone: number;
  pageOn: string;
  referrer: string;
  browserName: string;
  browserEngine: string;
  browserVersion: string;
  browserUserAgent: string;
  browserLanguage: string;
  browserOnline: boolean;
  browserPlatform: string;
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  screenPixelDepth: number;
}
