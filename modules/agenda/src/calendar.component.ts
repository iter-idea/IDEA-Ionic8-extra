import { Component, Input, OnInit, inject } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { Calendar, Check, Membership } from 'idea-toolbox';
import {
  IDEALoadingService,
  IDEAAWSAPIService,
  IDEATinCanService,
  IDEAMessageService,
  IDEATranslationsService
} from '@idea-ionic/common';

import { IDEACalendarsService } from './calendars.service';

@Component({
  selector: 'idea-calendar',
  templateUrl: 'calendar.component.html',
  styleUrls: ['calendar.component.scss']
})
export class IDEACalendarComponent implements OnInit {
  /**
   * The calendar to manage.
   */
  @Input() calendar: Calendar;
  /**
   * Whether we want to enable advanced permissions (based on the memberships) on the calendar.
   */
  @Input() advancedPermissions: boolean;
  /**
   * Whether the calendar color is an important detail or it shouldn't be shown.
   */
  @Input() hideColor: boolean;

  calendarWC: Calendar;
  membershipsChecks: Check[];
  membership: Membership;
  errors = new Set<string>();
  DEFAULT_COLOR = '#555';

  private _calendars = inject(IDEACalendarsService);
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _tc = inject(IDEATinCanService);
  private _loading = inject(IDEALoadingService);
  private _message = inject(IDEAMessageService);
  private _API = inject(IDEAAWSAPIService);
  private _translate = inject(IDEATranslationsService);

  async ngOnInit(): Promise<void> {
    this.membership = this._tc.get('membership');
    this.calendarWC = new Calendar(this.calendar);
    try {
      const memberships: Membership[] = await this._API.getResource(`teams/${this.membership.teamId}/memberships`);
      this.membershipsChecks = memberships.map(
        m =>
          new Check({
            value: m.userId,
            name: m.name,
            checked: (this.calendarWC.usersCanManageAppointments || []).some(x => x === m.userId)
          })
      );
    } catch (error) {
      this._message.error('COMMON.COULDNT_LOAD_LIST');
    }
  }

  hasFieldAnError(field: string): boolean {
    return this.errors.has(field);
  }

  async save(): Promise<void> {
    if (!this.calendarWC.color) this.calendarWC.color = this.DEFAULT_COLOR;
    if (this.calendarWC.isShared() && this.advancedPermissions)
      this.calendarWC.usersCanManageAppointments = this.membershipsChecks
        .filter(x => x.checked)
        .map(x => String(x.value));
    else delete this.calendarWC.usersCanManageAppointments;

    this.errors = new Set(this.calendarWC.validate());
    if (this.errors.size) return this._message.error('COMMON.FORM_HAS_ERROR_TO_CHECK');

    try {
      await this._loading.show();
      const res = await this._calendars.putCalendar(this.calendarWC);
      this.calendar.load(res);
      this._message.success('IDEA_AGENDA.CALENDARS.CALENDAR_SAVED');
      this._modal.dismiss(this.calendar);
    } catch (error) {
      this._message.error('COMMON.OPERATION_FAILED');
    } finally {
      this._loading.hide();
    }
  }

  async delete(): Promise<void> {
    const doDelete = async (): Promise<void> => {
      try {
        await this._loading.show();
        await this._calendars.deleteCalendar(this.calendarWC);
        this._message.success('IDEA_AGENDA.CALENDARS.CALENDAR_DELETED');
        this._modal.dismiss(true);
      } catch (error) {
        this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
      }
    };

    const header = this._translate._('COMMON.ARE_YOU_SURE');
    const subHeader = this._translate._('IDEA_AGENDA.CALENDARS.DELETE_CALENDAR');
    const message = this._translate._('IDEA_AGENDA.CALENDARS.DELETE_CALENDAR_HINT');
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.DELETE'), handler: doDelete }
    ];
    const alert = await this._alert.create({ header, subHeader, message, buttons });
    alert.present();
  }

  close(): void {
    this._modal.dismiss();
  }
}
