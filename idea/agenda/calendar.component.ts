import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATranslationsService } from '../translations/translations.service';

import { Membership } from '../../../../../api/_shared/membership.model';

@Component({
  selector: 'idea-calendar',
  templateUrl: 'calendar.component.html',
  styleUrls: ['calendar.component.scss']
})
export class IDEACalendarComponent {
  /**
   * The calendar to show.
   */
  @Input() public calendar: IdeaX.Calendar;
  /**
   * Helper to allow selecting memberships.
   */
  public membershipsChecks: Array<IdeaX.Check>;
  /**
   * The current membership.
   */
  public membership: Membership;
  /**
   * Errors while validating the entity.
   */
  public errors: Set<string>;
  /**
   * The default color for a calendar.
   */
  public DEFAULT_COLOR = '#555';

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public tc: IDEATinCanService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {
    this.errors = new Set<string>();
  }
  public ngOnInit() {
    this.membership = this.tc.get('membership');
    // prepare a request for a private or team calendar
    const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
    // get the calendar (in case of external calendar, update the external info)
    this.loading.show();
    this.API.getResource(baseURL.concat('calendars'), { idea: true, resourceId: this.calendar.calendarId })
      .then((cal: IdeaX.Calendar) => {
        // work on a copy
        this.calendar = new IdeaX.Calendar(cal);
        // load the teammates
        this.API.getResource(`teams/${this.tc.get('membership').teamId}/memberships`)
          .then(
            (memberships: Array<IdeaX.Membership>) =>
              (this.membershipsChecks = memberships.map(
                m =>
                  new IdeaX.Check({
                    value: m.userId,
                    name: m.name,
                    checked: (this.calendar.usersCanManageAppointments || []).some(x => x === m.userId)
                  })
              ))
          )
          .catch(() => {});
      })
      .catch(() => {
        this.message.error('COMMON.OPERATION_FAILED');
        this.close();
      })
      .finally(() => this.loading.hide());
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
    // set the default color, in case none was selected
    if (!this.calendar.color) this.calendar.color = this.DEFAULT_COLOR;
    // map the memberships able to manage appointments
    if (this.calendar.isShared())
      this.calendar.usersCanManageAppointments = this.membershipsChecks
        .filter(x => x.checked)
        .map(x => String(x.value));
    else delete this.calendar.usersCanManageAppointments;
    // checkings
    this.errors = new Set(this.calendar.validate());
    if (this.errors.size) return this.message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');
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
        header: this.t._('COMMON.ARE_YOU_SURE'),
        subHeader: this.t._('IDEA.AGENDA.CALENDARS.DELETE_CALENDAR'),
        message: this.t._('IDEA.AGENDA.CALENDARS.DELETE_CALENDAR_HINT'),
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.DELETE'),
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
   * Make the calendar the default one for the current user.
   */
  public setAsDefault() {
    // save the current settings, in case something goes wrong
    const oldDef = this.membership.defaultCalendarId;
    // update the attribute right away
    this.membership.defaultCalendarId = this.calendar.calendarId;
    // silently send the request
    this.API.patchResource(`teams/${this.membership.teamId}/memberships`, {
      resourceId: this.membership.userId,
      body: { action: 'DEFAULT_CALENDAR', calendarId: this.calendar.calendarId }
    }).catch(() => {
      // back to old settings
      this.membership.defaultCalendarId = oldDef;
      this.message.error('COMMON.OPERATION_FAILED');
    });
  }

  /**
   * Close the component.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
