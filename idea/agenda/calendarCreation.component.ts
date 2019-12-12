import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEALoadingService } from '../loading.service';
import { IDEAMessageService } from '../message.service';
import { IDEAAWSAPIService } from '../AWSAPI.service';

@Component({
  selector: 'idea-calendar-creation',
  templateUrl: 'calendarCreation.component.html',
  styleUrls: ['calendarCreation.component.scss']
})
export class IDEACalendarCreationComponent {
  /**
   * The calendar to create.
   */
  @Input() public ideaMembership: IdeaX.Membership;

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
    public t: TranslateService
  ) {
    this.calendar = new IdeaX.Calendar();
  }

  /**
   * Reset the scope of the calendar (private/shared).
   */
  public resetScope() {
    this.calendar.teamId = this.calendar.userId = null;
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
    if (!(this.calendar.userId || this.calendar.teamId)) return;
    // set the last obligatory fields
    this.calendar.name = this.calendar.userId
      ? this.t.instant('IDEA.AGENDA.CALENDARS.DEFAULT_PRIVATE_CALENDAR_NAME')
      : this.t.instant('IDEA.AGENDA.CALENDARS.DEFAULT_TEAM_CALENDAR_NAME');
    this.calendar.color = this.DEFAULT_COLOR;
    // flag the calendar so it has to be linked to an externals service (the procedure follows the creation)
    if (service) this.calendar.external = new IdeaX.ExternalCalendarInfo({ service });
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
