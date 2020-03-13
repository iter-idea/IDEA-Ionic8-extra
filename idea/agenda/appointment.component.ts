import { Component, Input } from '@angular/core';
import { Platform, ModalController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAMessageService } from '../message.service';
import { IDEAExtBrowserService } from '../extBrowser.service';

@Component({
  selector: 'idea-appointment',
  templateUrl: 'appointment.component.html',
  styleUrls: ['appointment.component.scss']
})
export class IDEAAppointmentComponent {
  /**
   * The appointment to manage.
   */
  @Input() public appointment: IdeaX.Appointment;
  /**
   * A default start time for the appointment.
   */
  @Input() public startTime: IdeaX.epochDateTime;
  /**
   * The default suggested duration for the appointment.
   */
  @Input() public defaultDuration: IdeaX.epochDateTime;
  /**
   * The calendars available to the user.
   */
  @Input() public calendars: Array<IdeaX.Calendar>;
  /**
   * The default suggested calendar for the appointment.
   */
  @Input() public defaultCalendarId: string;
  /**
   * Helper structure to let the user pick a calendar.
   */
  public calendarsSuggestions: Array<IdeaX.Suggestion>;
  /**
   * The appointment's calendar.
   */
  public calendar: IdeaX.Calendar;
  /**
   * Errors while validating the appointment.
   */
  public errors: Set<string>;
  /**
   * Helper to know whether the user can edit the appointment, based on the calendar's permissions.
   */
  public userCanEdit: boolean;
  /**
   * Helper to know whether the user can see the appointment's details, based on the calendar's permissions.
   */
  public userCanSeeDetails: boolean;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public tc: IDEATinCanService,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public extBrowser: IDEAExtBrowserService,
    public t: TranslateService,
    public API: IDEAAWSAPIService
  ) {
    this.appointment = new IdeaX.Appointment();
    this.errors = new Set<string>();
  }
  public ngOnInit() {
    // load the calendars
    this.calendarsSuggestions = this.calendars
      .map(c => new IdeaX.Calendar(c))
      // exclude the calendars for which the user doesn't have writing permissions
      .filter(c => c.canUserManageAppointments(this.tc.get('membership').userId))
      .map(c => new IdeaX.Suggestion({ value: c.calendarId, name: c.name, color: c.color }));
    if (!this.appointment.appointmentId) {
      // set default values for a new appointment
      this.appointment.startTime = this.startTime || Date.now();
      this.appointment.endTime = new Date(this.appointment.startTime + (this.defaultDuration || 0)).getTime();
      this.appointment.timezone = Moment.tz.guess(); // @todo let the user to change it
    }
    // set the calendar; in case of default, check whether it's in the permitted ones
    const defaultCal = this.calendarsSuggestions.find(x => x.value === this.defaultCalendarId);
    this.setCalendar(
      this.appointment.calendarId || (defaultCal ? this.defaultCalendarId : this.calendarsSuggestions[0].value)
    );
  }

  /**
   * Set the calendar in which the appointment is included.
   */
  public setCalendar(calendarId: string) {
    this.appointment.calendarId = calendarId;
    this.calendar = new IdeaX.Calendar(this.calendars.find(x => x.calendarId === this.appointment.calendarId));
    this.userCanEdit = !this.appointment.appointmentId
      ? true
      : this.calendar.canUserManageAppointments(this.tc.get('membership').userId);
    this.userCanSeeDetails = this.calendar.external
      ? this.calendar.external.userAccess > IdeaX.ExternalCalendarPermissions.FREE_BUSY
      : true;
  }

  /**
   * Get the ionicon of a service from its name.
   */
  public getServiceIcon(): string {
    if (!this.calendar.external) return null;
    switch (this.calendar.external.service) {
      case IdeaX.ExternalCalendarSources.GOOGLE:
        return 'logo-google';
      case IdeaX.ExternalCalendarSources.MICROSOFT:
        return 'logo-windows';
      default:
        return 'help';
    }
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }
  /**
   * Close the modal.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
  /**
   * Save the new/updated appointment and close the modal.
   */
  public save() {
    // checkings
    this.errors = new Set(this.appointment.validate());
    if (this.errors.size) {
      this.message.warning('IDEA.AGENDA.APPOINTMENT.FORM_HAS_ERROR_TO_CHECK');
      return;
    }
    // post/put the appointment
    let request: any;
    const baseURL = this.calendar.isShared() ? `teams/${this.tc.get('membership').teamId}/` : '';
    const reqURL = baseURL.concat(`calendars/${this.appointment.calendarId}/appointments`);
    if (!this.appointment.appointmentId)
      request = this.API.postResource(reqURL, {
        idea: true,
        body: this.appointment
      });
    else
      request = this.API.putResource(reqURL, {
        idea: true,
        resourceId: this.appointment.appointmentId,
        body: this.appointment
      });
    this.loading.show();
    request
      .then((appointment: IdeaX.Appointment) => {
        this.appointment.load(appointment);
        this.message.success('IDEA.AGENDA.APPOINTMENT.SAVED');
        this.modalCtrl.dismiss(this.appointment);
      })
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }
  /**
   * Delete the an appointment and close the modal.
   */
  public delete() {
    this.alertCtrl
      .create({
        header: this.t.instant('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            handler: () => {
              const baseURL = this.calendar.isShared() ? `teams/${this.tc.get('membership').teamId}/` : '';
              this.loading.show();
              this.API.deleteResource(baseURL.concat(`calendars/${this.appointment.calendarId}/appointments`), {
                idea: true,
                resourceId: this.appointment.appointmentId
              })
                .then(() => {
                  this.message.success('IDEA.AGENDA.APPOINTMENT.DELETED');
                  this.modalCtrl.dismiss(-1);
                })
                .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                .finally(() => this.loading.hide());
            }
          }
        ]
      })
      .then(alert => alert.present());
  }
}
