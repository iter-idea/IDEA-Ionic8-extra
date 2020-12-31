import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Plugins, PushNotificationToken, PushNotification } from '@capacitor/core';
import { Observable } from 'rxjs';
import { PushNotificationsDevice, PushNotificationsPlatforms } from 'idea-toolbox';

import { IDEAErrorReportingService } from './errorReporting.service';

/**
 * To subscribe push notifications events.
 */
@Injectable()
export class IDEAPushNotificationsService {
  /**
   * Observable: registrations of new devices.
   */
  public registrations: Observable<PushNotificationsDevice>;
  /**
   * Observable: new notifications.
   */
  public notifications: Observable<PushNotification>;
  /**
   * Observables: errors.
   */
  public errors: Observable<Error>;

  constructor(public platform: Platform, public errorReporting: IDEAErrorReportingService) {
    if (!this.isAvailable()) return;
    // monitor registrations
    this.registrations = new Observable(observer => {
      Plugins.PushNotifications.addListener('registration', (token: PushNotificationToken) =>
        observer.next(new PushNotificationsDevice({ token: token.value, platform: PushNotificationsPlatforms.FCM }))
      );
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
  }

  /**
   * Return true if the device is supported.
   */
  public isAvailable(): boolean {
    return Boolean(this.platform.is('mobile'));
  }

  /**
   * To fire the registration of a new device: it will rewquest the permission to use Push Notification.
   * On iOS will prompt the request, on Android it's automatic.
   */
  public registerDevice() {
    Plugins.PushNotifications.requestPermission().then(result => {
      if (result.granted) Plugins.PushNotifications.register();
    });
  }
}
