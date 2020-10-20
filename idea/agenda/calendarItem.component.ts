import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEASuggestionsComponent } from '../select/suggestions.component';
import { IDEATranslationsService } from '../translations/translations.service';

import { IDEACalendarComponent } from './calendar.component';

// from idea-config.js
declare const IDEA_MICROSOFT_API_CLIENT_ID: string;
declare const IDEA_MICROSOFT_API_SCOPE: string;
declare const IDEA_GOOGLE_API_CLIENT_ID: string;
declare const IDEA_GOOGLE_API_SCOPE: string;
declare const IDEA_APP_URL: string;

@Component({
  selector: 'idea-calendar-item',
  templateUrl: 'calendarItem.component.html',
  styleUrls: ['calendarItem.component.scss']
})
export class IDEACalendarItemComponent {
  /**
   * The calendar to show.
   */
  @Input() public calendar: IdeaX.Calendar;
  /**
   * Whether the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * Report to parent components a change.
   */
  @Output() public somethingChanged = new EventEmitter<IdeaX.Calendar>();

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}

  /**
   * Get the ion-icon of a service from its name.
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
   * Open the modal to manage the calendar.
   */
  public manageCalendar() {
    if (this.disabled) return;
    this.modalCtrl
      .create({ component: IDEACalendarComponent, componentProps: { calendarId: this.calendar.calendarId } })
      .then(modal => {
        modal.onDidDismiss().then(res => {
          if (res.data === undefined) return;
          // the calendar was deleted
          else if (res.data === null) this.calendar = null;
          // the calendar was updated
          else this.calendar.load(res.data);
          // report changes to parent components
          this.somethingChanged.emit(res.data);
        });
        modal.present();
      });
  }

  /**
   * Continue the flow to link or delete the calendar.
   */
  public linkExtCalendarOrDelete() {
    if (this.disabled) return;
    this.getExternalCalendars()
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
            modal.onDidDismiss().then(res => {
              if (res.data && res.data.value) {
                // find the chosen calendar
                const cal = extCals.find(c => c.id === res.data.value);
                // prepare a request for a private or team calendar
                const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
                // set the external calendar link
                this.loading.show();
                this.API.patchResource(baseURL.concat('calendars'), {
                  idea: true,
                  resourceId: this.calendar.calendarId,
                  body: { action: 'SET_EXTERNAL_CALENDAR', externalId: cal.id }
                })
                  .then(() => {
                    this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_LINKED');
                    this.calendarFirstSync();
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
              { text: this.t._('COMMON.DELETE'), handler: () => this.delete() },
              {
                text: this.t._('IDEA.AGENDA.CALENDARS.LINK'),
                handler: () => this.linkExtCalendar()
              }
            ]
          })
          .then(alert => alert.present());
      });
  }
  /**
   * Get the calendars list of the external service, to link with the selected calendar.
   */
  public getExternalCalendars(): Promise<Array<ExternalCalendar>> {
    return new Promise((resolve, reject) => {
      // prepare a request for a private or team calendar
      const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
      // get the access token to make requests; in case it fails, proceed to link the external service
      this.loading.show();
      this.API.patchResource(baseURL.concat('calendars'), {
        idea: true,
        resourceId: this.calendar.calendarId,
        body: { action: 'GET_ACCESS_TOKEN' }
      })
        .then((result: any) => {
          // acquire the calendars to choose one
          switch (this.calendar.external.service) {
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
                .get('https://graph.microsoft.com/v1.0/me/calendars', {
                  headers: { Authorization: 'Bearer '.concat(result.token) }
                })
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
  public async linkExtCalendar() {
    if (!this.calendar.external) return;
    let url: string;
    switch (this.calendar.external.service) {
      case IdeaX.ExternalCalendarSources.GOOGLE:
        url =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(IDEA_GOOGLE_API_CLIENT_ID)}` +
          `&response_type=code` +
          `&redirect_uri=${encodeURIComponent(IDEA_APP_URL.concat('/echo/google-calendars-integration'))}` +
          `&include_granted_scopes=true` +
          `&access_type=offline&prompt=consent` +
          `&scope=${encodeURIComponent(IDEA_GOOGLE_API_SCOPE)}` +
          `&state=${encodeURIComponent(this.calendar.calendarId)}`;
        break;
      case IdeaX.ExternalCalendarSources.MICROSOFT:
        url =
          `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
          `client_id=${encodeURIComponent(IDEA_MICROSOFT_API_CLIENT_ID)}` +
          `&response_type=code` +
          `&redirect_uri=${encodeURIComponent(IDEA_APP_URL.concat('/echo/microsoft-calendars-integration'))}` +
          `&response_mode=query` +
          `&scope=${encodeURIComponent(IDEA_MICROSOFT_API_SCOPE)}` +
          `&state=${encodeURIComponent(this.calendar.calendarId)}`;
        break;
    }
    await Browser.open({ url });
    // since we don't know when/if the auth flow will finish, we wait
    this.alertCtrl
      .create({
        header: this.t._('IDEA.AGENDA.CALENDARS.LINKING_CALENDAR'),
        message: this.t._('IDEA.AGENDA.CALENDARS.LINKING_CALENDAR_CONFIRM_ONCE_DONE'),
        backdropDismiss: false,
        buttons: [{ text: this.t._('COMMON.DONE'), handler: () => this.linkExtCalendarOrDelete() }]
      })
      .then(alert => alert.present());
  }
  /**
   * First sync of the extenal calendar.
   */
  protected calendarFirstSync(continuing?: boolean) {
    // prepare a request for a private or team calendar
    const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
    // this is a recursive operation: the API returns if the sync has to continue or it finished
    if (!continuing) this.loading.show(this.t._('IDEA.AGENDA.CALENDARS.FIRST_SYNC_MAY_TAKE_A_WHILE'));
    // request a first synchronisation (it will take a while);
    this.API.patchResource(baseURL.concat('calendars'), {
      idea: true,
      resourceId: this.calendar.calendarId,
      body: { action: 'SYNC_EXTERNAL_CALENDAR', firstSync: true }
    })
      .then((res: any) => {
        if (res.moreData) this.calendarFirstSync(true);
        else {
          this.loading.hide();
          this.somethingChanged.emit();
          this.message.success('IDEA.AGENDA.CALENDARS.FIRST_SYNC_COMPLETED');
        }
      })
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'));
  }

  /**
   * Delete the calendar (without asking, since it has been done in other methods).
   */
  public delete() {
    // prepare a request for a private or team calendar
    const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
    // send a delete request
    this.loading.show();
    this.API.deleteResource(baseURL.concat('calendars'), { idea: true, resourceId: this.calendar.calendarId })
      .then(() => {
        this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_DELETED');
        this.somethingChanged.emit();
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
