import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Plugins, PushNotificationToken, PushNotification } from '@capacitor/core';
import { Observable } from 'rxjs';
import { IDEAErrorReportingService } from './errorReporting.service';
import IdeaX = require('idea-toolbox');

// from idea-config.js
declare const IDEA_API_VERSION: string;

/**
 * To subscribe push notifications events.
 */
@Injectable()
export class IDEAPushNotificationsService {
  /**
   * Observable: registrations of new devices.
   */
  public registrations: Observable<IdeaX.PushNotificationsDevice>;
  /**
   * Observable: new notifications.
   */
  public notifications: Observable<PushNotification>;
  /**
   * Observables: errors.
   */
  public errors: Observable<Error>;

  constructor(public platform: Platform, public errorReporting: IDEAErrorReportingService) {
    this.platform.ready().then(() => {
      // monitor registrations
      this.registrations = new Observable(observer => {
        Plugins.PushNotifications.addListener('registration', (token: PushNotificationToken) => {
          observer.next(
            new IdeaX.PushNotificationsDevice({
              token: token.value,
              platform: this.platform.is('ios')
                ? IDEA_API_VERSION === 'dev'
                  ? IdeaX.PushNotificationsPlatforms.APNS_SANDBOX
                  : IdeaX.PushNotificationsPlatforms.APNS
                : IdeaX.PushNotificationsPlatforms.FCM
            })
          );
        });
      });
      // monitor registration errors
      this.errors = new Observable(observer => {
        Plugins.PushNotifications.addListener('registrationError', (err: Error) => {
          this.errorReporting.sendReport(err);
          observer.next(err);
        });
      });
      // monitor new notifications
      this.notifications = new Observable(observer => {
        Plugins.PushNotifications.addListener('pushNotificationReceived', (n: PushNotification) => observer.next(n));
      });
    });
  }

  /**
   * Return true if the DataWedge-compatible device can be used.
   */
  public isAvailable(): boolean {
    return Boolean(this.platform.is('capacitor'));
  }

  /**
   * To fire the registration of a new device.
   */
  public registerDevice() {
    Plugins.PushNotifications.register();
  }
}
