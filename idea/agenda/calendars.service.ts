import { Injectable } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
const { Browser } = Plugins;
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAMessageService } from '../message.service';

import { IDEASuggestionsComponent } from '../select/suggestions.component';

// from idea-config.js
declare const IDEA_MICROSOFT_API_CLIENT_ID: string;
declare const IDEA_MICROSOFT_API_SCOPE: string;
declare const IDEA_GOOGLE_API_CLIENT_ID: string;
declare const IDEA_GOOGLE_API_SCOPE: string;
declare const IDEA_APP_URL: string;

@Injectable()
export class IDEACalendarsService {
  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public message: IDEAMessageService,
    public loading: IDEALoadingService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}

  /**
   * Get the ion-icon of an external service from its name.
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
   * Get the base URL for API request (shared/private calendar).
   */
  public getRequestURL(calendar: IdeaX.Calendar): string {
    return (calendar.teamId ? `teams/${calendar.teamId}/` : '').concat('calendars');
  }

  /**
   * Create a new calendar.
   */
  public postCalendar(cal: IdeaX.Calendar): Promise<IdeaX.Calendar> {
    return new Promise((resolve, reject) => {
      this.API.postResource(this.getRequestURL(cal), { idea: true, body: cal })
        .then((res: IdeaX.Calendar) => resolve(new IdeaX.Calendar(res)))
        .catch(err => reject(err));
    });
  }
  /**
   * Update an existing calendar.
   */
  public putCalendar(cal: IdeaX.Calendar): Promise<IdeaX.Calendar> {
    return new Promise((resolve, reject) => {
      this.API.putResource(this.getRequestURL(cal), { idea: true, resourceId: cal.calendarId, body: cal })
        .then((res: IdeaX.Calendar) => resolve(new IdeaX.Calendar(res)))
        .catch(err => reject(err));
    });
  }
  /**
   * Delete a calendar.
   */
  public deleteCalendar(cal: IdeaX.Calendar): Promise<void> {
    return new Promise((resolve, reject) => {
      this.API.deleteResource(this.getRequestURL(cal), { idea: true, resourceId: cal.calendarId })
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }
  /**
   * Associate an external calendar with the given calendar.
   */
  public setExternalCalendar(cal: IdeaX.Calendar, externalId: string): Promise<IdeaX.Calendar> {
    return new Promise((resolve, reject) => {
      this.API.patchResource(this.getRequestURL(cal), {
        idea: true,
        resourceId: cal.calendarId,
        body: { action: 'SET_EXTERNAL_CALENDAR', externalId }
      })
        .then(res => resolve(new IdeaX.Calendar(res)))
        .catch(err => reject(err));
    });
  }

  /**
   * Link the calendar with the chosen external service (auth flow).
   */
  public linkExtService(cal: IdeaX.Calendar): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!cal.external) return reject(new Error('NOT_EXTERNAL'));
      let url: string;
      switch (cal.external.service) {
        case IdeaX.ExternalCalendarSources.GOOGLE:
          url =
            `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(IDEA_GOOGLE_API_CLIENT_ID)}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(IDEA_APP_URL.concat('/echo/google-calendars-integration'))}` +
            `&include_granted_scopes=true` +
            `&access_type=offline&prompt=consent` +
            `&scope=${encodeURIComponent(IDEA_GOOGLE_API_SCOPE)}` +
            `&state=${encodeURIComponent(cal.calendarId)}`;
          break;
        case IdeaX.ExternalCalendarSources.MICROSOFT:
          url =
            `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${encodeURIComponent(IDEA_MICROSOFT_API_CLIENT_ID)}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(IDEA_APP_URL.concat('/echo/microsoft-calendars-integration'))}` +
            `&response_mode=query` +
            `&scope=${encodeURIComponent(IDEA_MICROSOFT_API_SCOPE)}` +
            `&state=${encodeURIComponent(cal.calendarId)}`;
          break;
      }
      if (!url) return reject(new Error('INVALID_SERVICE'));
      // start the auth flow in the browser
      Browser.open({ url }).then(() => {
        // since we don't know when/if the auth flow will finish, we wait
        this.alertCtrl
          .create({
            header: this.t._('IDEA.AGENDA.CALENDARS.LINKING_CALENDAR'),
            message: this.t._('IDEA.AGENDA.CALENDARS.LINKING_CALENDAR_CONFIRM_ONCE_DONE'),
            backdropDismiss: false,
            buttons: [{ text: this.t._('COMMON.DONE'), handler: () => resolve() }]
          })
          .then(alert => alert.present());
      });
    });
  }

  /**
   * Get the external calendars list of the external service.
   */
  public getExternalCalendars(cal: IdeaX.Calendar): Promise<Array<ExtCalendar>> {
    return new Promise((resolve, reject) => {
      if (!cal.external) return reject(new Error('NOT_EXTERNAL'));
      // get the access token to make requests; in case it fails, proceed to link the external service
      this.API.patchResource(this.getRequestURL(cal), {
        idea: true,
        resourceId: cal.calendarId,
        body: { action: 'GET_ACCESS_TOKEN' }
      })
        .then((result: any) => {
          // prepare the headers (authorization) for the request to the external service
          const headers = { Authorization: 'Bearer '.concat(result.token) };
          // acquire and return the calendars
          switch (cal.external.service) {
            case IdeaX.ExternalCalendarSources.GOOGLE:
              this.API.rawRequest()
                .get('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers })
                .toPromise()
                .then((res: any) => resolve(res.items.map((c: any) => ({ name: c.summary, id: c.id } as ExtCalendar))))
                .catch(err => reject(err));
              break;
            case IdeaX.ExternalCalendarSources.MICROSOFT:
              this.API.rawRequest()
                .get('https://graph.microsoft.com/v1.0/me/calendars', { headers })
                .toPromise()
                .then((res: any) => resolve(res.value.map((c: any) => ({ name: c.name, id: c.id } as ExtCalendar))))
                .catch(err => reject(err));
              break;
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * If the external service is linked, choose an external calendar and set it for the chosen calendar.
   * @return the updated calendar.
   */
  public chooseAndSetExternalCalendar(cal: IdeaX.Calendar): Promise<IdeaX.Calendar> {
    return new Promise((resolve, reject) => {
      this.openModalAndPickExternalCalendar(cal)
        .then(extCalId => {
          // the external calendar will be set later on
          if (!extCalId) return resolve();
          // an external calendar was chosen: set it right away
          this.setExternalCalendar(cal, extCalId)
            .then(res => resolve(res))
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }
  /**
   * Open the modal to pick a calendar from the external service.
   * @return the id of the external calendar.
   */
  private openModalAndPickExternalCalendar(cal: IdeaX.Calendar): Promise<string> {
    return new Promise((resolve, reject) => {
      this.loading.show();
      this.getExternalCalendars(cal)
        .then((extCals: Array<ExtCalendar>) => {
          if (!extCals.length) return reject(new Error('NO_EXTERNAL_CALENDARS'));
          // let the user to choose the external calendar to associate
          this.modalCtrl
            .create({
              component: IDEASuggestionsComponent,
              componentProps: {
                data: extCals.map(c => new IdeaX.Suggestion({ value: c.id, name: c.name })),
                searchPlaceholder: this.t._('IDEA.AGENDA.CALENDARS.CHOOSE_AN_EXTERNAL_CALENDAR_TO_LINK'),
                sortData: true,
                hideIdFromUI: true,
                hideClearButton: true,
                mustChoose: true
              },
              backdropDismiss: false
            })
            .then(modal => {
              modal.onDidDismiss().then(res => resolve(res.data ? res.data.value : null));
              modal.present();
            });
        })
        .catch(err => reject(err))
        .finally(() => this.loading.hide());
    });
  }

  /**
   * First sync of the extenal calendar.
   */
  public syncCalendar(cal: IdeaX.Calendar): Promise<void> {
    return new Promise((resolve, reject) => this.syncCalendarHelper(cal, err => (err ? reject(err) : resolve())));
  }
  /**
   * Helper to recursively sync an the extenal calendar.
   */
  private syncCalendarHelper(cal: IdeaX.Calendar, done: (err?: Error) => void) {
    // this is a recursive operation: the API returns if the sync has to continue or it finished
    this.API.patchResource(this.getRequestURL(cal), {
      idea: true,
      resourceId: cal.calendarId,
      body: { action: 'SYNC_EXTERNAL_CALENDAR', firstSync: true }
    })
      .then((res: any) => {
        if (res.moreData) this.syncCalendarHelper(cal, done);
        else done();
      })
      .catch(err => done(err));
  }
}

/**
 * Helper structure to define external services' calendars (basic info).
 */
interface ExtCalendar {
  id: string;
  name: string;
}
