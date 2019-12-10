import { Component } from '@angular/core';
import { Platform, ModalController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAAppointmentComponent } from './appointment.component';

@Component({
  selector: 'idea-agenda',
  templateUrl: 'agenda.component.html',
  styleUrls: ['agenda.component.scss']
})
export class IDEAAgendaComponent {
  /**
   * The appointments to show in the calendar.
   */
  public appointments: Array<AgendaAppointment>;
  /**
   * The range (in months) considered to download data, having a reference date.
   * It will be requested all the data before N months and after N months the reference date.
   * e.g. 6 months, with reference today: [today-6months, today+6months].
   */
  public MONTHS_RANGE_FOR_GATHERING_DATA = 6;
  /**
   * The range (in months) considered to trigger an API request to download data, based on the reference date.
   * It should be smaller than `monthsRangeForGatheringData` so that the user doesn't perceive the remote loading
   * (if he/sh doesn't change the range too fast).
   */
  public MONTHS_RANGE_FOR_TRIGGERING_REQUEST = 3;
  /**
   * Default duration for a new appointment (ms). @todo team settings
   */
  public DEFAULT_APPOINTMENT_DURATION = 3600000;
  /**
   * The appointments gathered for the current range, grouped by calendar.
   */
  public appointmentsByCalendar: { [key: string]: Array<IdeaX.Appointment> };
  /**
   * The appointments (agenda format) gathered for the current range, grouped by calendar.
   */
  public agendaAppointmentsByCalendar: { [key: string]: Array<AgendaAppointment> };
  /**
   * The reference date to gather data. note: it's different from `currentDate` since this changes only when
   * we exit from the `MONTHS_RANGE_FOR_TRIGGERING_REQUEST`.
   */
  public referenceDate: Moment.Moment;
  /**
   * The shared and private calendars available to the current user.
   */
  public calendars: Array<IdeaX.Calendar>;
  /**
   * Helper to identify the calendars currently selected.
   */
  public calendarsChecks: Array<IdeaX.Check>;
  /**
   * The title of the view: it gives a time context to the agenda.
   */
  public viewTitle: string;
  /**
   * Whether the day selected is today.
   */
  public isToday: boolean;
  /**
   * The current view mode of the agenda.
   */
  public viewMode: AgendaViewModes;
  /**
   * The date currently selected in the agenda.
   */
  public currentDate: Date;
  /**
   * The format for the title in the view in case of WEEK mode.
   */
  public formatWeekTitle: string;
  /**
   * The format for the title in the view in case of DAY mode.
   */
  public formatDayTitle: string;
  /**
   * The format of the hour column.
   */
  public formatHourColumn: string;
  /**
   * Helper to show a spinner while loading the appointments.
   */
  public _loadingAppointments: boolean = false;
  get loadingAppointments(): boolean {
    return this._loadingAppointments;
  }
  set loadingAppointments(loading: boolean) {
    // to overcome changesDetector in showing the spinner while loading the appointments.
    setTimeout(() => (this._loadingAppointments = loading), loading ? 100 : 300);
  }
  /**
   * Helper to see if a time (cell) was selected twice in a row.
   */
  public lastTimeSelected: Date;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public tc: IDEATinCanService,
    public loading: IDEALoadingService,
    public t: TranslateService,
    public API: IDEAAWSAPIService
  ) {}
  public ngOnInit() {
    this.viewMode = AgendaViewModes.MONTH;
    // set the formats based on the current language
    Moment.locale(this.t.currentLang);
    this.setFormatsBasedOnLang(this.t.currentLang);
    // init the main working attributes
    this.goToToday();
    this.referenceDate = Moment();
    this.calendars = new Array<IdeaX.Calendar>();
    this.calendarsChecks = new Array<IdeaX.Check>();
    this.appointments = new Array<AgendaAppointment>();
    this.appointmentsByCalendar = {};
    this.agendaAppointmentsByCalendar = {};
    // acquire all the calendars available to the user and gather their appointments (if the calendar is selected)
    this.loading.show();
    Promise.all([
      // shared calendars
      this.API.getResource(`teams/${this.tc.get('membership').teamId}/calendars`, { idea: true }),
      // private calendars
      this.API.getResource(`calendars`, { idea: true })
    ])
      .then((res: Array<Array<IdeaX.Calendar>>) => {
        // flatten the results in a single array of calendars and order them by name
        this.calendars = this.flattenArray(res).sort((a, b) => a.name.localeCompare(b.name));
        // prepare the helper to allow the display of specific calendars (and so their appointments)
        this.calendarsChecks = this.calendars.map(
          c => new IdeaX.Check({ value: c.calendarId, name: c.name, checked: true, color: c.color })
        );
        // load the appointments from each selected calendar
        this.loadAppointmentsBasedOnVisibileCalendars().then(() => this.loading.hide());
      })
      .catch(() => this.loading.hide());
  }
  /**
   * Load in the UI the appointments based on the currently checked calendars.
   */
  public loadAppointmentsBasedOnVisibileCalendars(force?: boolean) {
    return new Promise(resolve => {
      // prepare the requests to gather the appointments from each checked calendars
      const requests = this.calendars
        .filter(cal => this.calendarsChecks.find(x => x.value === cal.calendarId).checked)
        .map(cal => this.getCalendarAppointments(cal, force));
      // execute the requests and concat the results in an array of appointments
      Promise.all(requests).then((res: Array<Array<AgendaAppointment>>) =>
        resolve((this.appointments = this.flattenArray(res)))
      );
    });
  }
  /**
   * Get the appointments of a calendar. If the data isn't available or if forced, request the data remotely.
   */
  public getCalendarAppointments(calendar: IdeaX.Calendar, forceRefresh?: boolean): Promise<Array<AgendaAppointment>> {
    return new Promise(resolve => {
      // if not forced and the data is available, return it
      if (!forceRefresh && this.agendaAppointmentsByCalendar[calendar.calendarId])
        return resolve(this.agendaAppointmentsByCalendar[calendar.calendarId]);
      // request appointments remotely, from a shared or a local calendar, based on the interval around the ref. date
      const baseURL = calendar.teamId ? `teams/${this.tc.get('membership').teamId}/` : '';
      this.API.getResource(baseURL.concat(`calendars/${calendar.calendarId}/appointments`), {
        idea: true,
        params: {
          from: Moment(this.referenceDate)
            .subtract(this.MONTHS_RANGE_FOR_GATHERING_DATA, 'months')
            .format('x'),
          to: Moment(this.referenceDate)
            .add(this.MONTHS_RANGE_FOR_GATHERING_DATA, 'months')
            .format('x')
        }
      })
        .then((app: Array<IdeaX.Appointment>) => {
          // save the data for the next request and return it
          this.appointmentsByCalendar[calendar.calendarId] = app.map(a => new IdeaX.Appointment(a));
          this.agendaAppointmentsByCalendar[calendar.calendarId] = app.map(
            a => new AgendaAppointment(a, calendar.color)
          );
          resolve(this.agendaAppointmentsByCalendar[calendar.calendarId]);
        })
        .catch(() => {});
    });
  }
  /**
   * Helper to set the formats of the agenda's labels based on the language.
   */
  protected setFormatsBasedOnLang(lang: string) {
    switch (lang) {
      case 'it':
        this.formatWeekTitle = `MMMM yyyy, 'settimana' w`;
        this.formatDayTitle = 'dd MMMM yyyy';
        this.formatHourColumn = 'HH';
        break;
      default:
        this.formatWeekTitle = 'MMMM yyyy (w)';
        this.formatHourColumn = 'ha';
        break;
    }
  }
  /**
   * Helper to flatten an array.
   */
  protected flattenArray(arr: Array<any>) {
    return arr.reduce((a, v) => a.concat(v), []);
  }

  /**
   * Helper to calculate the step to move in the agenda, based on the view.
   */
  private getStep(): { years: number; months: number; days: number } {
    switch (this.viewMode) {
      case AgendaViewModes.MONTH:
        return { years: 0, months: 1, days: 0 };
      case AgendaViewModes.WEEK:
        return { years: 0, months: 0, days: 7 };
      case AgendaViewModes.DAY:
        return { years: 0, months: 0, days: 1 };
    }
  }
  /**
   * Get the adjacent date in the agenda, based on the view.
   */
  public getAdjacentCalendarDate(direction: number) {
    const step = this.getStep();
    let calculateCalendarDate = new Date(this.currentDate.getTime());
    const year = calculateCalendarDate.getFullYear() + direction * step.years,
      month = calculateCalendarDate.getMonth() + direction * step.months,
      date = calculateCalendarDate.getDate() + direction * step.days;
    calculateCalendarDate.setFullYear(year, month, date);
    if (this.viewMode === AgendaViewModes.MONTH) {
      const firstDayInNextMonth = new Date(year, month + 1, 1);
      if (firstDayInNextMonth.getTime() <= calculateCalendarDate.getTime()) {
        calculateCalendarDate = new Date(firstDayInNextMonth.getTime() - 24 * 60 * 60 * 1000);
      }
    }
    this.currentDate = calculateCalendarDate;
  }
  /**
   * Wether the two dates are in the same view (based on the viewMode).
   */
  public areDatesInSameView(d1: Date, d2: Date): boolean {
    return Moment(d1).isSame(Moment(d2), this.viewMode);
  }
  /**
   * Wether the two dates can be considered "the same" (based on the viewMode).
   */
  public areDatesTheSameBasedOnView(d1: Date, d2: Date): boolean {
    const granularity = this.viewMode === AgendaViewModes.MONTH ? 'day' : 'hour';
    return Moment(d1).isSame(Moment(d2), granularity);
  }
  /**
   * Humanize the unixDate time.
   */
  public humanizeDateTime(unixDate: IdeaX.epochDateTime, format: string): string {
    return Moment.unix(unixDate / 1000).format(format);
  }
  /**
   * Change the view mode and update the appointments in the view.
   */
  public changeViewMode(mode: AgendaViewModes) {
    this.viewMode = mode;
    this.loadAppointmentsBasedOnVisibileCalendars();
  }
  /**
   * Move the currentDate to today.
   */
  public goToToday() {
    this.currentDate = new Date();
  }
  /**
   * Differ past appointments.
   */
  public markDisabled = (date: Date) => {
    const current = new Date();
    current.setHours(0, 0, 0);
    return date < current;
  };
  /**
   * Calculate the contrast color of the given one, to highlight the text over the background.
   */
  public getConstrastTextColor(hex: string): string {
    if (hex.indexOf('#') === 0) hex = hex.slice(1);
    // convert 3-digit hex to 6-digits
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    // fallback for not hex colors
    if (hex.length !== 6) '000000';
    const r = parseInt(hex.slice(0, 2), 16),
      g = parseInt(hex.slice(2, 4), 16),
      b = parseInt(hex.slice(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF';
  }

  /**
   * Change the date selected in the agenda.
   */
  public onCurrentDateChanged(event: Date) {
    event.setHours(12, 0, 0, 0);
    // fix a bug when the calendar swiper isn't active: properly set the current date
    if (!this.areDatesTheSameBasedOnView(this.currentDate, event)) this.currentDate = event;
    // set isToday helper
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    this.isToday = today.getTime() === event.getTime();
  }
  /**
   * When the reference date changes outside the range, trigger the request of the appointments of the new range.
   */
  public onRangeChanged(ev: any) {
    const start = Moment(ev.startTime);
    // if the new reference date is outside the triggering range, download new data to foreseen the user's actions
    if (Math.abs(this.referenceDate.diff(start, 'months')) > this.MONTHS_RANGE_FOR_TRIGGERING_REQUEST) {
      this.referenceDate = Moment(start);
      this.loadingAppointments = true;
      this.loadAppointmentsBasedOnVisibileCalendars(true).then(() => (this.loadingAppointments = false));
    } else this.loadAppointmentsBasedOnVisibileCalendars();
  }

  /**
   * When clicking twice on the same cell, insert a new appointment with that starting time.
   */
  public onTimeSelected(ev) {
    if (this.viewMode === AgendaViewModes.MONTH) return; // ignore
    // if the same time was selected, check if to prompt the insertion of a new appointent
    if (this.lastTimeSelected === ev.selectedTime) {
      this.lastTimeSelected = null;
      // if the cell hasn't appointments already and it isn't disabled, prompt for a new one
      if (!(ev.events && ev.events.length) && !ev.disabled)
        this.addAppointment(ev.selectedTime.getTime(), ev.selectedTime.getTime() + this.DEFAULT_APPOINTMENT_DURATION);
    } else this.lastTimeSelected = ev.selectedTime;
  }
  /**
   * Open the details of the appointment.
   * @todo project-specific popup
   */
  public onAppointmentSelected(event: any) {
    this.editAppointment(event);
  }
  /**
   * Open the UI for adding a new appointment.
   */
  public addAppointment(startTime?: IdeaX.epochDateTime, endTime?: IdeaX.epochDateTime) {
    // if a starting time wasn't specified, start in the current date at 9 AM
    if (!startTime) {
      const startDate = new Date(this.currentDate);
      startDate.setHours(9);
      startTime = startDate.getTime();
    }
    // set the ending time
    const duration = endTime && endTime > startTime ? endTime - startTime : this.DEFAULT_APPOINTMENT_DURATION;
    // open the modal
    this.modalCtrl
      .create({
        component: IDEAAppointmentComponent,
        componentProps: {
          startTime: startTime,
          defaultDuration: duration,
          calendars: this.calendars,
          defaultCalendarId: this.getDefaultCalendar().calendarId
        }
      })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          if (res.data) {
            // update the view if an appointment was added
            this.loadingAppointments = true;
            this.loadAppointmentsBasedOnVisibileCalendars(true).then(() => (this.loadingAppointments = false));
          }
        });
        modal.present();
      });
  }
  /**
   * Open the UI for editing an appointment.
   */
  public editAppointment(app: AgendaAppointment) {
    // find the appointment to edit
    const appointment = this.appointmentsByCalendar[app.calendarId].find(a => a.appointmentId === app.id);
    // open the modal
    this.modalCtrl
      .create({ component: IDEAAppointmentComponent, componentProps: { appointment, calendars: this.calendars } })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          // update the view if the appointment was deleted
          if (res.data === -1) {
            this.loadingAppointments = true;
            this.loadAppointmentsBasedOnVisibileCalendars(true).then(() => (this.loadingAppointments = false));
          }
        });
        modal.present();
      });
  }
  /**
   * Return the default calendar for a new appointment or an empty one.
   */
  public getDefaultCalendar(): IdeaX.Calendar {
    const checked = this.calendarsChecks.find(x => x.checked);
    const calendar = checked ? this.calendars.find(x => x.calendarId === checked.value) : null;
    return calendar || new IdeaX.Calendar();
  }
}

/**
 * An appointment shown in the agenda.
 */
export class AgendaAppointment {
  /**
   * The id of the appointment.
   */
  public id: string;
  /**
   * The id of the calendar.
   */
  public calendarId: string;
  /**
   * The title to show for the appointment.
   */
  public title: string;
  /**
   * The location to show for the appointment.
   */
  public location: string;
  /**
   * The startTime (date) for the appointment.
   */
  public startTime: Date;
  /**
   * The endTime (date) for the appoinment.
   */
  public endTime: Date;
  /**
   * Whether the appointment is all-day long or not.
   */
  public allDay: boolean;
  /**
   * The color with which to show the appointment in the agenda.
   */
  public color: string;

  constructor(a: IdeaX.Appointment, color: string) {
    this.id = a.appointmentId;
    this.calendarId = a.calendarId;
    this.title = a.title;
    this.location = a.location;
    this.startTime = new Date(a.startTime);
    this.endTime = new Date(a.endTime);
    this.allDay = a.allDay;
    this.color = color;
  }
}

/**
 * The possible views for the agenda.
 */
export enum AgendaViewModes {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day'
}
