import { Injectable, inject } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { PushNotifications, PushNotificationSchema } from '@capacitor/push-notifications';
import { Observable } from 'rxjs';
import { PushNotificationsDevice, PushNotificationsPlatforms } from 'idea-toolbox';

import { IDEAErrorReportingService } from './errorReporting.service';

/**
 * To subscribe push notifications events.
 */
@Injectable()
export class IDEAPushNotificationsService {
  private _platform = inject(Platform);
  private _errorReporting = inject(IDEAErrorReportingService);

  registrations: Observable<PushNotificationsDevice>;
  notifications: Observable<PushNotificationSchema>;
  errors: Observable<Error>;

  constructor() {
    if (!this.isAvailable()) return;

    this.registrations = new Observable(observer => {
      PushNotifications.addListener('registration', token =>
        observer.next(new PushNotificationsDevice({ token: token.value, platform: PushNotificationsPlatforms.FCM }))
      );
    });
    this.errors = new Observable(observer => {
      // rif. https://forum.ionicframework.com/t/226376
      (PushNotifications as any).addListener('registrationError', (err: Error): void => {
        this._errorReporting.sendReport(err);
        observer.next(err);
      });
    });
    this.notifications = new Observable(observer => {
      PushNotifications.addListener('pushNotificationReceived', n => observer.next(n));
    });
  }

  /**
   * Return true if the device is supported.
   */
  isAvailable(): boolean {
    return this._platform.is('capacitor') && !!PushNotifications;
  }

  /**
   * To fire the registration of a new device: it will rewquest the permission to use Push Notification.
   * On iOS will prompt the request, on Android it's automatic.
   */
  async registerDevice(): Promise<void> {
    if (!this.isAvailable()) return;

    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive === 'granted') PushNotifications.register();
  }
}
