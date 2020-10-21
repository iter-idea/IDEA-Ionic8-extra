import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEACalendarsService } from './calendars.service';

@Component({
  selector: 'idea-calendar',
  templateUrl: 'calendar.component.html',
  styleUrls: ['calendar.component.scss']
})
export class IDEACalendarComponent {
  /**
   * The calendar to manage.
   */
  @Input() public calendar: IdeaX.Calendar;
  /**
   * Working copy of the calendar, to update only when confirmed.
   */
  public _calendar: IdeaX.Calendar;
  /**
   * Helper to allow selecting memberships.
   */
  public membershipsChecks: Array<IdeaX.Check>;
  /**
   * The current membership.
   */
  public membership: IdeaX.Membership;
  /**
   * Errors while validating the entity.
   */
  public errors: Set<string> = new Set<string>();
  /**
   * The default color for a calendar.
   */
  public DEFAULT_COLOR = '#555';

  constructor(
    public calendars: IDEACalendarsService,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public tc: IDEATinCanService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    this.membership = this.tc.get('membership');
    // work on a copy
    this._calendar = new IdeaX.Calendar(this.calendar);
    // load the teammates to use for shared calendars permissions
    this.API.getResource(`teams/${this.membership.teamId}/memberships`)
      .then(
        (memberships: Array<IdeaX.Membership>) =>
          (this.membershipsChecks = memberships.map(
            m =>
              new IdeaX.Check({
                value: m.userId,
                name: m.name,
                checked: (this._calendar.usersCanManageAppointments || []).some(x => x === m.userId)
              })
          ))
      )
      .catch(() => {});
  }

  /**
   * Set the support array to display errors in the UI.
   */
  public hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  /**
   * Save a calendar with the new info.
   */
  public save() {
    // set the default color, in case none was selected
    if (!this._calendar.color) this._calendar.color = this.DEFAULT_COLOR;
    // map the memberships able to manage appointments
    if (this._calendar.isShared())
      this._calendar.usersCanManageAppointments = this.membershipsChecks
        .filter(x => x.checked)
        .map(x => String(x.value));
    else delete this._calendar.usersCanManageAppointments;
    // checkings
    this.errors = new Set(this._calendar.validate());
    if (this.errors.size) return this.message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');
    // send a put request
    this.loading.show();
    this.calendars
      .putCalendar(this._calendar)
      .then((res: IdeaX.Calendar) => {
        this.calendar.load(res);
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
        header: this.t._('COMMON.ARE_YOU_SURE'),
        subHeader: this.t._('IDEA.AGENDA.CALENDARS.DELETE_CALENDAR'),
        message: this.t._('IDEA.AGENDA.CALENDARS.DELETE_CALENDAR_HINT'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.DELETE'),
            handler: () => {
              this.loading.show();
              this.calendars
                .deleteCalendar(this._calendar)
                .then(() => {
                  this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_DELETED');
                  this.modalCtrl.dismiss(true);
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
