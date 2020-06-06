import { Component } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core';
import { ModalController, AlertController, NavController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEATranslationsService } from '../translations/translations.service';

import { IDEACalendarComponent } from './calendar.component';
import { IDEACalendarCreationComponent } from './calendarCreation.component';
import { IDEASuggestionsComponent } from '../select/suggestions.component';
import { IDEAExtBrowserService } from '../extBrowser.service';

// from idea-config.js
declare const IDEA_MICROSOFT_API_CLIENT_ID: string;
declare const IDEA_MICROSOFT_API_SCOPE: string;
declare const IDEA_GOOGLE_API_CLIENT_ID: string;
declare const IDEA_GOOGLE_API_SCOPE: string;
declare const IDEA_APP_URL: string;

@Component({
  selector: 'idea-calendars',
  templateUrl: 'calendars.component.html',
  styleUrls: ['calendars.component.scss']
})
export class IDEACalendarsComponent {
  /**
   * The calendars of the user.
   */
  public privateCals: Array<IdeaX.Calendar>;
  /**
   * The calendars of the team.
   */
  public teamCals: Array<IdeaX.Calendar>;
  /**
   * The IDEA membership, to check for permissions.
   */
  public ideaMembership: IdeaX.Membership;

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public tc: IDEATinCanService,
    public extBrowser: IDEAExtBrowserService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public t: IDEATranslationsService,
    public API: IDEAAWSAPIService
  ) {}
  public ngOnInit() {
    // check whether the module is active
    if (!this.tc.get('team').hasModule('agenda')) return this.navCtrl.navigateRoot(['']);
    this.loadCalendars();
  }
  public loadCalendars(skipLoading?: boolean) {
    // get the IDEA membership
    if (!skipLoading) this.loading.show();
    this.API.getResource(`teams/${this.tc.get('membership').teamId}/memberships/${this.tc.get('membership').userId}`, {
      idea: true
    })
      .then((membership: IdeaX.Membership) => (this.ideaMembership = new IdeaX.Membership(membership)))
      .catch(() => this.message.error('COMMON.NO_ELEMENT_FOUND'))
      .finally(() => (skipLoading ? null : this.loading.hide()));
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
    this.modalCtrl.create({ component: IDEACalendarComponent, componentProps: { calendar } }).then(modal => {
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
            // add it to the correct list
            if (calendar.userId) this.privateCals.push(calendar);
            else this.teamCals.push(calendar);
          }
        });
        modal.present();
      });
  }

  /**
   * Continue the flow to link or delete the calendar.
   */
  public linkExtCalendarOrDelete(calendar: IdeaX.Calendar) {
    this.getExternalCalendars(calendar)
      .then((extCals: Array<ExternalCalendar>) => {
        // let the user to choose the external calendar to associate
        this.modalCtrl
          .create({
            component: IDEASuggestionsComponent,
            componentProps: {
              data: extCals.map(c => new IdeaX.Suggestion({ value: c.id, name: c.name })),
              searchPlaceholder: this.t._('IDEA.AGENDA.CALENDARS.CHOOSE_AN_EXTERNAL_CALENDAR_TO_LINK'),
              sortData: true,
              hideIdFromUI: true
            }
          })
          .then(modal => {
            modal.onDidDismiss().then((res: OverlayEventDetail) => {
              if (res.data && res.data.value) {
                // find the chosen calendar
                const cal = extCals.find(c => c.id === res.data.value);
                // prepare a request for a private or team calendar
                const baseURL = calendar.teamId ? `teams/${calendar.teamId}/` : '';
                // set the external calendar link
                this.loading.show();
                this.API.patchResource(baseURL.concat('calendars'), {
                  idea: true,
                  resourceId: calendar.calendarId,
                  body: { action: 'SET_EXTERNAL_CALENDAR', externalId: cal.id }
                })
                  .then(() => {
                    this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_LINKED');
                    this.loadCalendars(true);
                    this.calendarFirstSync(calendar);
                  })
                  .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
                  .finally(() => this.loading.hide());
              }
            });
            modal.present();
          });
      })
      .catch(() => {
        // the calendar isn't linked yet (we don't have a token): link or delete
        this.alertCtrl
          .create({
            header: this.t._('IDEA.AGENDA.CALENDARS.CALENDAR_NOT_YET_LINKED'),
            message: this.t._('IDEA.AGENDA.CALENDARS.DO_YOU_WANT_PROCEED_LINKING_OR_DELETE'),
            buttons: [
              { text: this.t._('COMMON.DELETE'), handler: () => this.delete(calendar) },
              {
                text: this.t._('IDEA.AGENDA.CALENDARS.LINK'),
                handler: () => this.linkExtCalendar(calendar)
              }
            ]
          })
          .then(alert => alert.present());
      });
  }
  /**
   * Get the calendars list of the external service, to link with the selected calendar.
   */
  public getExternalCalendars(calendar: IdeaX.Calendar): Promise<Array<ExternalCalendar>> {
    return new Promise((resolve, reject) => {
      // prepare a request for a private or team calendar
      const baseURL = calendar.teamId ? `teams/${calendar.teamId}/` : '';
      // get the access token to make requests; in case it fails, proceed to link the external service
      this.loading.show();
      this.API.patchResource(baseURL.concat('calendars'), {
        idea: true,
        resourceId: calendar.calendarId,
        body: { action: 'GET_ACCESS_TOKEN' }
      })
        .then((result: any) => {
          // acquire the calendars to choose one
          switch (calendar.external.service) {
            case IdeaX.ExternalCalendarSources.GOOGLE:
              this.API.rawRequest()
                .get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                  headers: { Authorization: 'Bearer '.concat(result.token) }
                })
                .toPromise()
                .then((res: any) => resolve(res.items.map(c => ({ name: c.summary, id: c.id } as ExternalCalendar))))
                .catch(() => reject())
                .finally(() => this.loading.hide());
              break;
            case IdeaX.ExternalCalendarSources.MICROSOFT:
              this.API.rawRequest()
                .get('https://graph.microsoft.com/v1.0/me/calendars', { headers: { Authorization: result.token } })
                .toPromise()
                .then((res: any) => resolve(res.value.map(c => ({ name: c.name, id: c.id } as ExternalCalendar))))
                .catch(() => reject())
                .finally(() => this.loading.hide());
              break;
          }
        })
        .catch(() => {
          this.loading.hide();
          reject();
        });
    });
  }
  /**
   * Proceed to link the calendar with the chosen external service.
   */
  public async linkExtCalendar(calendar: IdeaX.Calendar) {
    if (!calendar.external) return;
    let url: string;
    switch (calendar.external.service) {
      case IdeaX.ExternalCalendarSources.GOOGLE:
        url =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(IDEA_GOOGLE_API_CLIENT_ID)}` +
          `&response_type=code` +
          `&redirect_uri=${encodeURIComponent(IDEA_APP_URL.concat('/echo/google-calendars-integration'))}` +
          `&include_granted_scopes=true` +
          `&access_type=offline&prompt=consent` +
          `&scope=${encodeURIComponent(IDEA_GOOGLE_API_SCOPE)}` +
          `&state=${encodeURIComponent(calendar.calendarId)}`;
        break;
      case IdeaX.ExternalCalendarSources.MICROSOFT:
        url =
          `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${encodeURIComponent(IDEA_MICROSOFT_API_CLIENT_ID)}` +
          `&response_type=code` +
          `&redirect_uri=${encodeURIComponent(IDEA_APP_URL.concat('/echo/microsoft-calendars-integration'))}` +
          `&response_mode=query` +
          `&scope=${encodeURIComponent(IDEA_MICROSOFT_API_SCOPE)}` +
          `&state=${encodeURIComponent(calendar.calendarId)}`;
        break;
    }
    this.extBrowser.openLink(url);
    // since we don't know when/if the auth flow will finish, we wait
    this.alertCtrl
      .create({
        header: this.t._('IDEA.AGENDA.CALENDARS.LINKING_CALENDAR'),
        message: this.t._('IDEA.AGENDA.CALENDARS.LINKING_CALENDAR_CONFIRM_ONCE_DONE'),
        backdropDismiss: false,
        buttons: [{ text: this.t._('COMMON.DONE'), handler: () => this.linkExtCalendarOrDelete(calendar) }]
      })
      .then(alert => alert.present());
  }
  /**
   * First sync of the extenal calendar.
   */
  protected calendarFirstSync(calendar: IdeaX.Calendar, continuing?: boolean) {
    // prepare a request for a private or team calendar
    const baseURL = calendar.teamId ? `teams/${calendar.teamId}/` : '';
    // this is a recursive operation: the API returns if the sync has to continue or it finished
    if (!continuing) this.loading.show(this.t._('IDEA.AGENDA.CALENDARS.FIRST_SYNC_MAY_TAKE_A_WHILE'));
    // request a first synchronisation (it will take a while);
    this.API.patchResource(baseURL.concat('calendars'), {
      idea: true,
      resourceId: calendar.calendarId,
      body: { action: 'SYNC_EXTERNAL_CALENDAR', firstSync: true }
    })
      .then((res: any) => {
        if (res.moreData) this.calendarFirstSync(calendar, true);
        else {
          this.loading.hide();
          this.message.success('IDEA.AGENDA.CALENDARS.FIRST_SYNC_COMPLETED');
        }
      })
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'));
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

/**
 * Helper structure to define external services' calendars (basic info).
 */
interface ExternalCalendar {
  id: string;
  name: string;
}
