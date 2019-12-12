import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';

@Component({
  selector: 'idea-calendar',
  templateUrl: 'calendar.component.html',
  styleUrls: ['calendar.component.scss']
})
export class IDEACalendarComponent {
  /**
   * The calendar to show.
   */
  @Input() protected calendar: IdeaX.Calendar;

  /**
   * Errors while validating the entity.
   */
  public errors: Set<string>;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public tc: IDEATinCanService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: TranslateService
  ) {
    this.errors = new Set<string>();
  }
  public ngOnInit() {
    // work on a copy
    this.calendar = new IdeaX.Calendar(this.calendar);
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  /**
   * Get the ionicon of a service from its name.
   */
  public getServiceIcon(service: IdeaX.ExternalCalendarSources): string {
    switch (service) {
      case IdeaX.ExternalCalendarSources.GOOGLE:
        return 'logo-google';
      case IdeaX.ExternalCalendarSources.MICROSOFT:
        return 'logo-windows';
      default:
        return 'help';
    }
  }

  /**
   * Save a calendar with the new info.
   */
  public save() {
    // checkings
    this.errors = new Set(this.calendar.validate());
    if (this.errors.size) {
      this.message.warning('COMMON.FORM_HAS_ERROR_TO_CHECK');
      return;
    }
    // prepare a request for a private or team calendar
    const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
    // send a put request
    this.loading.show();
    this.API.putResource(baseURL.concat('calendars'), {
      idea: true,
      resourceId: this.calendar.calendarId,
      body: this.calendar
    })
      .then((calendar: IdeaX.Calendar) => {
        this.calendar.load(calendar);
        this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_SAVED');
        this.modalCtrl.dismiss(this.calendar);
      })
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }

  /**
   * Delete the calendar.
   */
  public delete() {
    this.alertCtrl
      .create({
        header: this.t.instant('COMMON.ARE_YOU_SURE'),
        subHeader: this.t.instant('IDEA.AGENDA.CALENDARS.DELETE_CALENDAR'),
        message: this.t.instant('IDEA.AGENDA.CALENDARS.DELETE_CALENDAR_HINT'),
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.DELETE'),
            handler: () => {
              // prepare a request for a private or team calendar
              const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
              // send a delete request
              this.loading.show();
              this.API.deleteResource(baseURL.concat('calendars'), { idea: true, resourceId: this.calendar.calendarId })
                .then(() => {
                  this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_DELETED');
                  this.modalCtrl.dismiss(null);
                })
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }

  /**
   * Close the component.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
