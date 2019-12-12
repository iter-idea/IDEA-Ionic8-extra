import { Component } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core';
import { ModalController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

import { IDEACalendarComponent } from './calendar.component';
import { IDEACalendarCreationComponent } from './calendarCreation.component';
import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';

// from idea-config.js
declare const IDEA_MICROSOFT_API_CLIENT_ID: string;
declare const IDEA_MICROSOFT_API_SCOPE: string;
declare const IDEA_APP_URL: string;

@Component({
  selector: 'idea-calendars',
  templateUrl: 'calendars.page.html',
  styleUrls: ['calendars.page.scss']
})
export class IDEACalendarsPage {
  /**
   * The calendars of the user.
   */
  protected privateCals: Array<IdeaX.Calendar>;
  /**
   * The calendars of the team.
   */
  protected teamCals: Array<IdeaX.Calendar>;
  /**
   * The IDEA membership, to check for permissions.
   */
  protected ideaMembership: IdeaX.Membership;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public tc: IDEATinCanService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public t: TranslateService,
    public API: IDEAAWSAPIService
  ) {}
  public ngOnInit() {
    // get the IDEA membership
    this.loading.show();
    this.API.getResource(`teams/${this.tc.get('membership').teamId}/memberships/${this.tc.get('membership').userId}`, {
      idea: true
    })
      .then((membership: IdeaX.Membership) => (this.ideaMembership = new IdeaX.Membership(membership)))
      .catch(() => this.message.error('COMMON.NO_ELEMENT_FOUND'))
      .finally(() => this.loading.hide());
    // (async) get shared calendars
    this.API.getResource(`teams/${this.tc.get('membership').teamId}/calendars`, { idea: true })
      .then((teamCals: Array<IdeaX.Calendar>) => (this.teamCals = teamCals.map(c => new IdeaX.Calendar(c))))
      .catch(() => {});
    // (async) get private calendars
    this.API.getResource(`calendars`, { idea: true })
      .then((privateCals: Array<IdeaX.Calendar>) => (this.privateCals = privateCals.map(c => new IdeaX.Calendar(c))))
      .catch(() => {});
  }

  /**
   * Edit a calendar.
   */
  public editCalendar(calendar: IdeaX.Calendar) {
    this.modalCtrl.create({ component: IDEACalendarComponent, componentProps: { calendar: calendar } }).then(modal => {
      modal.onDidDismiss().then((res: OverlayEventDetail) => {
        // the calendar was changed
        if (res.data) calendar.load(res.data);
        // the calendar was deleted
        else if (res.data === null) {
          if (calendar.userId) this.privateCals.splice(this.privateCals.indexOf(calendar), 1);
          else this.teamCals.splice(this.teamCals.indexOf(calendar), 1);
        }
      });
      modal.present();
    });
  }

  /**
   * Add a new calendar.
   */
  public addCalendar() {
    this.modalCtrl
      .create({ component: IDEACalendarCreationComponent, componentProps: { ideaMembership: this.ideaMembership } })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          const calendar: IdeaX.Calendar = res.data;
          // a calendar was added
          if (calendar) {
            if (calendar.userId) this.privateCals.push(calendar);
            else this.teamCals.push(calendar);
            // if external, complete the link
            if (calendar.external) this.linkExtCalendar(calendar);
          }
        });
        modal.present();
      });
  }

  /**
   * Choose if to link or delete the calendar.
   */
  public linkExtCalendarOrDelete(calendar: IdeaX.Calendar) {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.AGENDA.CALENDARS.CALENDAR_NOT_YET_LINKED'),
        message: this.t.instant('IDEA.AGENDA.CALENDARS.DO_YOU_WANT_PROCEED_LINKING_OR_DELETE'),
        buttons: [
          { text: this.t.instant('COMMON.DELETE'), handler: () => this.delete(calendar) },
          { text: this.t.instant('IDEA.AGENDA.CALENDARS.LINK'), handler: () => this.linkExtCalendar(calendar) }
        ]
      })
      .then(alert => alert.present());
  }
  /**
   * Proceed to link the calendar with the chosen external service.
   */
  public linkExtCalendar(calendar: IdeaX.Calendar) {
    if (!calendar.external) return;
    switch (calendar.external.service) {
      case IdeaX.ExternalCalendarSources.GOOGLE:
        console.log('Not supported yet');
        break;
      case IdeaX.ExternalCalendarSources.MICROSOFT:
        window.location.assign(
          `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${IDEA_MICROSOFT_API_CLIENT_ID}` +
            `&response_type=code` +
            //`&redirect_uri=${IDEA_APP_URL.concat('/echo/microsoft-calendars-integration')}` +
            `&redirect_uri=${'http://localhost:8100'.concat('/echo/microsoft-calendars-integration')}` +
            `&response_mode=query` +
            `&scope=${IDEA_MICROSOFT_API_SCOPE}` +
            `&state=${calendar.calendarId}`
        );
        break;
    }
  }
  /**
   * Delete the calendar (without asking, since it has been done in other methods).
   */
  public delete(calendar: IdeaX.Calendar) {
    // prepare a request for a private or team calendar
    const baseURL = calendar.teamId ? `teams/${calendar.teamId}/` : '';
    // send a delete request
    this.loading.show();
    this.API.deleteResource(baseURL.concat('calendars'), { idea: true, resourceId: calendar.calendarId })
      .then(() => {
        this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_DELETED');
        if (calendar.userId) this.privateCals.splice(this.privateCals.indexOf(calendar), 1);
        else this.teamCals.splice(this.teamCals.indexOf(calendar), 1);
      })
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }
}
