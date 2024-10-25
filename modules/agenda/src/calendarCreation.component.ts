import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { Calendar, ExternalCalendarInfo, ExternalCalendarSources, Membership, Team } from 'idea-toolbox';
import { IDEALoadingService, IDEAMessageService, IDEATranslationsService } from '@idea-ionic/common';
import { IDEATinCanService } from '@idea-ionic/uncommon';

import { IDEACalendarsService } from './calendars.service';

@Component({
  selector: 'idea-calendar-creation',
  templateUrl: 'calendarCreation.component.html',
  styleUrls: ['calendarCreation.component.scss']
})
export class IDEACalendarCreationComponent implements OnInit {
  private _modal = inject(ModalController);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _translate = inject(IDEATranslationsService);
  private _tc = inject(IDEATinCanService);
  _calendars = inject(IDEACalendarsService);

  /**
   * Whether we want to allow the creation of only a particular type of calendar, based on the scope.
   */
  @Input() fixScope: CalendarScopes;
  /**
   * Whether we want to allow the creation of local calendars.
   */
  @Input() onlyExternalCalendars: boolean;

  team: Team;
  membership: Membership;
  calendar: Calendar;
  DEFAULT_COLOR = '#555';
  SOURCES = Object.keys(ExternalCalendarSources);

  ngOnInit(): void {
    this.calendar = new Calendar();
    this.team = this._tc.get('team');
    this.membership = this._tc.get('membership');
    if (this.fixScope === CalendarScopes.SHARED) this.calendar.teamId = this.team.teamId;
    if (this.fixScope === CalendarScopes.PRIVATE) this.calendar.userId = this.membership.userId;
  }

  resetScope(): void {
    if (this.canChangeScope()) this.calendar.teamId = this.calendar.userId = null;
  }
  canChangeScope(): boolean {
    return !this.fixScope && this.scopeIsSet();
  }
  scopeIsSet(): boolean {
    return Boolean(this.calendar.userId) || Boolean(this.calendar.teamId);
  }

  async saveNewCalendar(service?: ExternalCalendarSources | string): Promise<void> {
    if (!this.scopeIsSet()) return;
    if (!service && this.onlyExternalCalendars) return;
    if (service) {
      this.calendar.external = new ExternalCalendarInfo({ service });
      this.calendar.name = '-'; // it will be substituted with the external name
    } else {
      this.calendar.name = this.calendar.userId
        ? this._translate._('IDEA_AGENDA.CALENDARS.DEFAULT_PERSONAL_CALENDAR_NAME')
        : this._translate._('IDEA_AGENDA.CALENDARS.DEFAULT_TEAM_CALENDAR_NAME');
      this.calendar.color = this.DEFAULT_COLOR;
    }
    try {
      await this._loading.show();
      const cal = await this._calendars.postCalendar(this.calendar);
      this.calendar.load(cal);
      this._message.success('IDEA_AGENDA.CALENDARS.CALENDAR_CREATED');
      if (!cal.external) {
        this._modal.dismiss(this.calendar);
        return;
      }
      try {
        await this._calendars.linkExtService(this.calendar);
        const res = await this._calendars.chooseAndSetExternalCalendar(this.calendar);
        if (!res) {
          this._modal.dismiss(this.calendar);
          return;
        }
        this.calendar.load(res);
        await this._loading.show(this._translate._('IDEA_AGENDA.CALENDARS.FIRST_SYNC_MAY_TAKE_A_WHILE'));
        try {
          await this._calendars.syncCalendar(this.calendar);
          this._message.success('IDEA_AGENDA.CALENDARS.FIRST_SYNC_COMPLETED');
        } catch (error) {
          this._message.error('COMMON.OPERATION_FAILED');
        } finally {
          this._modal.dismiss(this.calendar);
        }
      } catch (error) {
        this._message.error('COMMON.OPERATION_FAILED');
        this._modal.dismiss(this.calendar);
      }
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  close(): void {
    this._modal.dismiss();
  }
}

/**
 * The possible scopes of the calendar.
 */
export enum CalendarScopes {
  SHARED = 'shared', // teamId
  PRIVATE = 'private' // userId
}
