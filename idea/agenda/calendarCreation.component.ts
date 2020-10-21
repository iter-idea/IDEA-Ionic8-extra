import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import IdeaX = require('idea-toolbox');

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';
import { IDEACalendarsService } from './calendars.service';

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
    public calendars: IDEACalendarsService,
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
   * Add a new calendar based on the configuration set.
   */
  public saveNewCalendar(service?: IdeaX.ExternalCalendarSources) {
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
    // save (create) the new calendar
    this.loading.show();
    this.calendars
      .postCalendar(this.calendar)
      .then(cal => {
        this.calendar.load(cal);
        this.message.success('IDEA.AGENDA.CALENDARS.CALENDAR_CREATED');
        // if the calendar is local, no further action is needed
        if (!cal.external) return this.modalCtrl.dismiss(this.calendar);
        // if the calendar should be linked to an external service, proceed
        this.calendars
          .linkExtService(this.calendar)
          // if the link was successful, let the user pick an external calendar to set
          .then(() => this.calendars.chooseAndSetExternalCalendar(this.calendar))
          .then(res => {
            // if a calendar wasn't set, it can be done later on
            if (!res) return this.modalCtrl.dismiss(this.calendar);
            // if an external calendar was set, update the calendar
            this.calendar.load(res);
            // run a first sync for the linked external calendar
            this.loading.show(this.t._('IDEA.AGENDA.CALENDARS.FIRST_SYNC_MAY_TAKE_A_WHILE'));
            this.calendars
              .syncCalendar(this.calendar)
              .then(() => this.message.success('IDEA.AGENDA.CALENDARS.FIRST_SYNC_COMPLETED'))
              .catch(() => this.message.error('COMMON.OPERATION_FAILED'))
              .finally(() => {
                this.loading.hide();
                // the calendar is ready to go
                this.modalCtrl.dismiss(this.calendar);
              });
          })
          .catch(() => {
            this.message.error('COMMON.OPERATION_FAILED');
            // the operation can be retried later on; close the modal anyway
            this.modalCtrl.dismiss(this.calendar);
          });
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
