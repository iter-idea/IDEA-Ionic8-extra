import { Injectable, inject } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { Calendar, ExternalCalendarSources, Suggestion } from 'idea-toolbox';
import {
  IDEAEnvironment,
  IDEALoadingService,
  IDEATranslationsService,
  IDEASuggestionsComponent
} from '@idea-ionic/common';
import { IDEAAWSAPIService } from '@idea-ionic/uncommon';

/**
 * Note: to test locally, you need to temporarily change the redirect URI:
 *  - in the lambda `idea_calendars`, e.g. `SCARLETT_URL`;
 *  - in the client config file: `APP_URL`.
 * In both cases, the value should be set to `http://localhost:8100` (or according to the local URL).
 */
@Injectable()
export class IDEACalendarsService {
  protected _env = inject(IDEAEnvironment);
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _loading = inject(IDEALoadingService);
  private _API = inject(IDEAAWSAPIService);
  private _translate = inject(IDEATranslationsService);

  /**
   * Get the ion-icon of an external service from its name.
   */
  getServiceIcon(service: ExternalCalendarSources | string): string {
    switch (service) {
      case ExternalCalendarSources.GOOGLE:
        return 'logo-google';
      case ExternalCalendarSources.MICROSOFT:
        return 'logo-windows';
      default:
        return 'help';
    }
  }
  /**
   * Get the base URL for API request (shared/private calendar).
   */
  getRequestURL(calendar: Calendar): string {
    return (calendar.teamId ? `teams/${calendar.teamId}/` : '').concat('calendars');
  }

  /**
   * Create a new calendar.
   */
  async postCalendar(cal: Calendar): Promise<Calendar> {
    const calendar = await this._API.postResource(this.getRequestURL(cal), { idea: true, body: cal });
    return new Calendar(calendar);
  }
  /**
   * Update an existing calendar.
   */
  async putCalendar(cal: Calendar): Promise<Calendar> {
    const body = { idea: true, resourceId: cal.calendarId, body: cal };
    const calendar = await this._API.putResource(this.getRequestURL(cal), body);
    return new Calendar(calendar);
  }
  /**
   * Delete a calendar.
   */
  async deleteCalendar(cal: Calendar): Promise<void> {
    await this._API.deleteResource(this.getRequestURL(cal), { idea: true, resourceId: cal.calendarId });
  }
  /**
   * Associate an external calendar with the given calendar.
   */
  async setExternalCalendar(cal: Calendar, externalId: string): Promise<Calendar> {
    const body = { idea: true, resourceId: cal.calendarId, body: { action: 'SET_EXTERNAL_CALENDAR', externalId } };
    const calendar = await this._API.patchResource(this.getRequestURL(cal), body);
    return new Calendar(calendar);
  }

  /**
   * Link the calendar with the chosen external service (auth flow).
   */
  async linkExtService(cal: Calendar): Promise<void> {
    if (!cal.external) throw new Error('NOT_EXTERNAL');
    const baseURL = window.location.protocol.concat('//', window.location.hostname);
    let url: string;
    switch (cal.external.service) {
      case ExternalCalendarSources.GOOGLE:
        url =
          'https://accounts.google.com/o/oauth2/v2/auth?' +
          `client_id=${encodeURIComponent(this._env.google.apiClientId)}` +
          '&response_type=code' +
          `&redirect_uri=${encodeURIComponent(baseURL.concat('/echo/google-calendars-integration'))}` +
          '&include_granted_scopes=true' +
          '&access_type=offline&prompt=consent' +
          `&scope=${encodeURIComponent(this._env.google.apiScope)}` +
          `&state=${encodeURIComponent(cal.calendarId)}`;
        break;
      case ExternalCalendarSources.MICROSOFT:
        url =
          'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' +
          `client_id=${encodeURIComponent(this._env.microsoft.apiClientId)}` +
          '&response_type=code' +
          `&redirect_uri=${encodeURIComponent(baseURL.concat('/echo/microsoft-calendars-integration'))}` +
          '&response_mode=query' +
          `&scope=${encodeURIComponent(this._env.microsoft.apiScope)}` +
          `&state=${encodeURIComponent(cal.calendarId)}`;
        break;
    }
    if (!url) throw new Error('INVALID_SERVICE');
    await Browser.open({ url });
    // since we don't know when/if the auth flow will finish, we wait
    await this.showAlertLinkingCalendar();
  }
  private async showAlertLinkingCalendar(): Promise<void> {
    return new Promise(async resolve => {
      const header = this._translate._('IDEA_AGENDA.CALENDARS.LINKING_CALENDAR');
      const message = this._translate._('IDEA_AGENDA.CALENDARS.LINKING_CALENDAR_CONFIRM_ONCE_DONE');
      const buttons = [{ text: this._translate._('COMMON.DONE'), handler: resolve }];
      const alert = await this._alert.create({ header, message, buttons, backdropDismiss: false });
      alert.present();
    });
  }

  /**
   * Get the external calendars list of the external service.
   */
  async getExternalCalendars(cal: Calendar): Promise<ExtCalendar[]> {
    if (!cal.external) throw new Error('NOT_EXTERNAL');
    // get the access token to make requests; in case it fails, proceed to link the external service
    const body = { idea: true, resourceId: cal.calendarId, body: { action: 'GET_ACCESS_TOKEN' } };
    const result = await this._API.patchResource(this.getRequestURL(cal), body);
    const headers = { Authorization: 'Bearer '.concat(result.token) };
    if (cal.external.service === ExternalCalendarSources.GOOGLE) {
      const res = await (
        await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers })
      ).json();
      return res.items.map((c: any): ExtCalendar => ({ name: c.summary, id: c.id }) as ExtCalendar);
    } else if (cal.external.service === ExternalCalendarSources.MICROSOFT) {
      const res = await (await fetch('https://graph.microsoft.com/v1.0/me/calendars', { headers })).json();
      return res.value.map((c: any): ExtCalendar => ({ name: c.name, id: c.id }) as ExtCalendar);
    }
  }

  /**
   * If the external service is linked, choose an external calendar and set it for the chosen calendar.
   * @return the updated calendar.
   */
  async chooseAndSetExternalCalendar(cal: Calendar): Promise<Calendar> {
    const extCalId = await this.openModalAndPickExternalCalendar(cal);
    if (!extCalId) return;
    return await this.setExternalCalendar(cal, extCalId);
  }
  /**
   * Open the modal to pick a calendar from the external service.
   * @return the id of the external calendar.
   */
  private async openModalAndPickExternalCalendar(cal: Calendar): Promise<string> {
    let extCals: ExtCalendar[];
    try {
      await this._loading.show();
      extCals = await this.getExternalCalendars(cal);
      if (!extCals.length) throw new Error('NO_EXTERNAL_CALENDARS');
    } catch (error) {
      throw error;
    } finally {
      this._loading.hide();
    }
    const modal = await this._modal.create({
      component: IDEASuggestionsComponent,
      componentProps: {
        data: extCals.map(c => new Suggestion({ value: c.id, name: c.name })),
        searchPlaceholder: this._translate._('IDEA_AGENDA.CALENDARS.CHOOSE_AN_EXTERNAL_CALENDAR_TO_LINK'),
        sortData: true,
        hideIdFromUI: true,
        hideClearButton: true,
        mustChoose: true
      },
      backdropDismiss: false
    });
    modal.present();
    const res = await modal.onDidDismiss();
    return res.data ? res.data.value : null;
  }

  /**
   * First sync of the extenal calendar.
   */
  syncCalendar(cal: Calendar): Promise<void> {
    return new Promise((resolve, reject): void => this.syncCalendarHelper(cal, err => (err ? reject(err) : resolve())));
  }
  /**
   * Helper to recursively sync an the extenal calendar.
   */
  private syncCalendarHelper(cal: Calendar, done: (err?: Error) => void): void {
    // this is a recursive operation: the API returns if the sync has to continue or it finished
    this._API
      .patchResource(this.getRequestURL(cal), {
        idea: true,
        resourceId: cal.calendarId,
        body: { action: 'SYNC_EXTERNAL_CALENDAR', firstSync: true }
      })
      .then((res: any): void => {
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
