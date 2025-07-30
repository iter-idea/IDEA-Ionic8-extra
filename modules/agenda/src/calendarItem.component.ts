import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { Calendar } from 'idea-toolbox';
import { IDEALoadingService, IDEAMessageService, IDEATranslationsService } from '@idea-ionic/common';

import { IDEACalendarComponent } from './calendar.component';
import { IDEACalendarsService } from './calendars.service';

@Component({
  // eslint-disable-next-line
  standalone: false,
  selector: 'idea-calendar-item',
  templateUrl: 'calendarItem.component.html',
  styleUrls: ['calendarItem.component.scss']
})
export class IDEACalendarItemComponent {
  private _alert = inject(AlertController);
  private _modal = inject(ModalController);
  private _message = inject(IDEAMessageService);
  private _loading = inject(IDEALoadingService);
  private _translate = inject(IDEATranslationsService);
  _calendars = inject(IDEACalendarsService);

  /**
   * The calendar to show.
   */
  @Input() calendar: Calendar;
  /**
   * Whether the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * Whether we want to enable advanced permissions (based on the memberships) on the calendar.
   */
  @Input() advancedPermissions: boolean;
  /**
   * Whether the calendar color is an important detail or it shouldn't be shown.
   */
  @Input() hideColor: boolean;
  /**
   * The URL to be used on the redirect calls.
   */
  @Input() baseURL: string;
  /**
   * Report to parent components a change.
   */
  @Output() somethingChanged = new EventEmitter<Calendar>();

  async manageCalendar(): Promise<void> {
    if (this.disabled) return;
    const modal = await this._modal.create({
      component: IDEACalendarComponent,
      componentProps: {
        calendar: this.calendar,
        advancedPermissions: this.advancedPermissions,
        hideColor: this.hideColor
      }
    });
    modal.onDidDismiss().then(res => {
      const cal = res.data;
      if (cal === undefined) return;
      else if (cal === null) this.calendar = null;
      else this.calendar.load(cal);
      this.somethingChanged.emit();
    });
    modal.present();
  }

  async linkExtCalendarOrDelete(): Promise<void> {
    if (this.disabled) return;
    try {
      const cal = await this._calendars.chooseAndSetExternalCalendar(this.calendar);
      if (!cal) throw new Error('NO_EXTERNAL_CALENDAR_CHOSEN');
      this.calendar.load(cal);
      this._message.success('IDEA_AGENDA.CALENDARS.CALENDAR_LINKED');
      try {
        await this._loading.show(this._translate._('IDEA_AGENDA.CALENDARS.FIRST_SYNC_MAY_TAKE_A_WHILE'));
        await this._calendars.syncCalendar(this.calendar);
        this._message.success('IDEA_AGENDA.CALENDARS.FIRST_SYNC_COMPLETED');
      } catch (error) {
        this._message.error('COMMON.OPERATION_FAILED');
      } finally {
        this._loading.hide();
        this.somethingChanged.emit();
      }
    } catch (error) {
      const doDelete = async (): Promise<void> => {
        try {
          await this._loading.show();
          await this._calendars.deleteCalendar(this.calendar);
          this._message.success('COMMON.OPERATION_COMPLETED');
          this.somethingChanged.emit();
        } catch (error) {
          this._message.error('COMMON.OPERATION_FAILED');
        } finally {
          this._loading.hide();
        }
      };
      const doLink = async (): Promise<void> => {
        try {
          await this._calendars.linkExtService(this.calendar, this.baseURL);
          this.linkExtCalendarOrDelete();
        } catch (error) {
          this._message.error('COMMON.OPERATION_FAILED');
        }
      };
      const header = this._translate._('IDEA_AGENDA.CALENDARS.CALENDAR_NOT_YET_LINKED');
      const message = this._translate._('IDEA_AGENDA.CALENDARS.DO_YOU_WANT_PROCEED_LINKING_OR_DELETE');
      const buttons = [
        { text: this._translate._('COMMON.DELETE'), handler: doDelete },
        { text: this._translate._('IDEA_AGENDA.CALENDARS.LINK'), handler: doLink }
      ];
      const alert = await this._alert.create({ header, message, buttons });
      alert.present();
    }
  }
}
