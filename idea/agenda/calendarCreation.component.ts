import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-calendar-creation',
  templateUrl: 'calendarCreation.component.html',
  styleUrls: ['calendarCreation.component.scss']
})
export class IDEACalendarCreationComponent {
  /**
   * Whether the user is an administrator of the current IDEA team.
   */
  @Input() public isUserAdmin: boolean;
  /**
   * Whether we want to allow the creation of only private calendars.
   */
  @Input() public onlyPrivateCalendars: boolean;
  /**
   * Whether we want to allow the creation of local calendars.
   */
  @Input() public onlyExternalCalendars: boolean;
  /**
   * The current membership (generic).
   */
  public membership: IdeaX.Membership;
  /**
   * The calendar to create.
   */
  public calendar: IdeaX.Calendar;
  /**
   * The default color for a new calendar.
   */
  public DEFAULT_COLOR = '#555';
  /**
   * The possible external services for the new calendar.
   */
  public SOURCES = Object.keys(IdeaX.ExternalCalendarSources);

  constructor(
    public modalCtrl: ModalController,
    public tc: IDEATinCanService,
    public loading: IDEALoadingService,
    public message: IDEAMessageService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    this.calendar = new IdeaX.Calendar();
    this.membership = this.tc.get('membership');
    if (this.onlyPrivateCalendars) this.calendar.userId = this.membership.userId;
  }

  /**
   * If allowed by the component configuration, reset the scope of the calendar (private/shared).
   */
  public resetScope() {
    if (this.canChangeScope()) this.calendar.teamId = this.calendar.userId = null;
  }
  /**
   * Whether we can change the scope of the calendar (private/shared).
   */
  public canChangeScope(): boolean {
    return !this.onlyPrivateCalendars && this.scopeIsSet();
  }
  /**
   * Whether the scope has been set already.
   */
  public scopeIsSet(): boolean {
    return Boolean(this.calendar.userId) || Boolean(this.calendar.teamId);
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
   * Add a new calendar based on the configuration set.
   */
  public addCalendar(service?: IdeaX.ExternalCalendarSources) {
    // be sure the scope of the calendar was chosen
    if (!this.scopeIsSet()) return;
    // be sure we are allowed to create the calendar
    if (!service && this.onlyExternalCalendars) return;
    // flag the calendar so it has to be linked to an externals service (the procedure follows the creation)
    if (service) {
      this.calendar.external = new IdeaX.ExternalCalendarInfo({ service });
      this.calendar.name = '-'; // it will be substituted with the external name
    } else {
      // default values for local calendars
      this.calendar.name = this.calendar.userId
        ? this.t._('IDEA.AGENDA.CALENDARS.DEFAULT_PERSONAL_CALENDAR_NAME')
        : this.t._('IDEA.AGENDA.CALENDARS.DEFAULT_TEAM_CALENDAR_NAME');
      this.calendar.color = this.DEFAULT_COLOR;
    }
    // prepare a request for a private or team calendar
    const baseURL = this.calendar.teamId ? `teams/${this.calendar.teamId}/` : '';
    // send a post request
    this.loading.show();
    this.API.postResource(baseURL.concat('calendars'), { idea: true, body: this.calendar })
      .then((calendar: IdeaX.Calendar) => {
        this.calendar.load(calendar);
        this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_CREATED');
        this.modalCtrl.dismiss(this.calendar);
      })
      .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
      .finally(() => this.loading.hide());
  }

  /**
   * Close the component.
   */
  public close() {
    this.modalCtrl.dismiss();
  }
}
