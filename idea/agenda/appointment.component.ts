import { Component, Input, EventEmitter } from '@angular/core';
import { Platform, ModalController, AlertController } from '@ionic/angular';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAMessageService } from '../message.service';
import { IDEAExtBrowserService } from '../extBrowser.service';
import { IDEATranslationsService } from '../translations/translations.service';

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
   * The supported linked object types for the appointments of this project.
   */
  @Input() public linkedObjectTypes: Array<IdeaX.AppointmentLinkedObjectTypes>;
  /**
   * Emitter to allow the selection of an object to link to the appointment (passed through the Agenda component).
   */
  @Input() public linkObjectToAppointment: EventEmitter<{
    appointment: IdeaX.Appointment;
    isSharedCalendar: boolean;
  }>;
  /**
   * Emitter to allow the creation of a new object to link to the appointment (passed through the Agenda component)
   */
  @Input() public newObjectLinkedToAppointment: EventEmitter<{
    appointment: IdeaX.Appointment;
    isSharedCalendar: boolean;
  }>;
  /**
   * Emitter to allow the unlinking of an object from the appointment (passed through the Agenda component).
   */
  @Input() public unlinkObjectFromAppointment: EventEmitter<{
    object: IdeaX.AppointmentLinkedObject;
    appointment: IdeaX.Appointment;
    isSharedCalendar: boolean;
  }>;
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
  /**
   * Helper to use the enum in the UI.
   */
  public LOTypes = IdeaX.AppointmentLinkedObjectTypes;
  /**
   * Enable/disable the mode in which you can remove linked objects.
   */
  public removeLinkedObjectMode: boolean;
  /**
   * Helper to use the enum in the UI.
   */
  public Attendance = IdeaX.AppointmentAttendance;
  /**
   * Helper to use the enum in the UI to loop over the attendance statuses, excluded the NEEDS_ACTION.
   */
  public AttendanceActions = IdeaX.loopNumericEnumKeys(IdeaX.AppointmentAttendance).filter(
    x => x !== IdeaX.AppointmentAttendance.NEEDS_ACTION
  );
  /**
   * The current status for the user's attendance to the event.
   */
  public attendance: IdeaX.AppointmentAttendance;
  /**
   * The current membership.
   */
  public membership: IdeaX.Membership;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public tc: IDEATinCanService,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public extBrowser: IDEAExtBrowserService,
    public t: IDEATranslationsService,
    public API: IDEAAWSAPIService
  ) {
    this.membership = this.tc.get('membership');
    this.appointment = new IdeaX.Appointment();
    this.errors = new Set<string>();
  }
  public ngOnInit() {
    // load the calendars
    this.calendarsSuggestions = this.calendars
      .map(c => new IdeaX.Calendar(c))
      // exclude the calendars for which the user doesn't have writing permissions
      .filter(c => c.canUserManageAppointments(this.membership.userId))
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
    // set the attendance, if any
    this.attendance = this.appointment.getAttendance();
  }

  /**
   * Set the calendar in which the appointment is included.
   */
  public setCalendar(calendarId: string) {
    this.appointment.calendarId = calendarId;
    this.calendar = new IdeaX.Calendar(this.calendars.find(x => x.calendarId === this.appointment.calendarId));
    this.userCanEdit = !this.appointment.appointmentId
      ? true
      : this.calendar.canUserManageAppointments(this.membership.userId);
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
    if (this.errors.size) return this.message.error('IDEA.AGENDA.APPOINTMENT.FORM_HAS_ERROR_TO_CHECK');
    // if the attendance is changed, send the request to change it
    this.loading.show();
    this.sendAttendanceChangeIfNeeded().then(() => {
      // post/put the appointment
      let request: any;
      const baseURL = this.calendar.isShared() ? `teams/${this.membership.teamId}/` : '';
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
      request
        .then((appointment: IdeaX.Appointment) => {
          this.appointment.load(appointment);
          this.message.success('IDEA.AGENDA.APPOINTMENT.SAVED');
          this.modalCtrl.dismiss(this.appointment);
        })
        .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
        .finally(() => this.loading.hide());
    });
  }
  /**
   * Delete the an appointment and close the modal.
   */
  public delete() {
    this.alertCtrl
      .create({
        header: this.t._('COMMON.ARE_YOU_SURE'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.CONFIRM'),
            handler: () => {
              const baseURL = this.calendar.isShared() ? `teams/${this.membership.teamId}/` : '';
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

  /**
   * Trigger the action to link an object to the appointment.
   */
  public linkObject() {
    this.linkObjectToAppointment.emit({ appointment: this.appointment, isSharedCalendar: this.calendar.isShared() });
  }
  /**
   * Trigger the action to create a new object linked to the appointment.
   */
  public createLinkedObject() {
    this.newObjectLinkedToAppointment.emit({
      appointment: this.appointment,
      isSharedCalendar: this.calendar.isShared()
    });
    this.close();
  }
  /**
   * Remove an object linked to the appointment.
   */
  public removeLinkedObject(obj: IdeaX.AppointmentLinkedObject, ev?: Event) {
    if (ev) ev.stopPropagation();
    this.unlinkObjectFromAppointment.emit({
      object: obj,
      appointment: this.appointment,
      isSharedCalendar: this.calendar.isShared()
    });
    this.removeLinkedObjectMode = false;
  }

  /**
   * Send the new attendance status change, if needed.
   */
  private sendAttendanceChangeIfNeeded(): Promise<void> {
    return new Promise(resolve => {
      // get the user as attendee
      const attendee = this.appointment.getAttendee();
      // skip in case the event doesn't have attendees or the attendance didn't change
      if (!attendee || attendee.attendance === this.attendance) return resolve();
      // Google doesn't need an extra action for this: the PUT request is enough.
      if (!this.calendar.external || this.calendar.external.service === IdeaX.ExternalCalendarSources.GOOGLE) {
        // set the attendance status for the user
        attendee.attendance = this.attendance;
        return resolve();
      }
      // send the request
      const baseURL = this.calendar.isShared() ? `teams/${this.membership.teamId}/` : '';
      const reqURL = baseURL.concat(`calendars/${this.appointment.calendarId}/appointments`);
      this.API.patchResource(reqURL, {
        idea: true,
        resourceId: this.appointment.appointmentId,
        body: { action: 'SET_ATTENDANCE', attendance: this.attendance }
      })
        .then(() => {
          // set the attendance status for the user
          attendee.attendance = this.attendance;
          resolve();
        })
        // ignore error
        .catch(() => resolve());
    });
  }
}
