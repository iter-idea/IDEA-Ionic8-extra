import { Component, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { epochDateTime } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

/**
 * A random sunday, used as reference to calculate the week days.
 */
const SUNDAY = 259200000;

@Component({
  selector: 'idea-calendar-picker',
  templateUrl: 'calendarPicker.component.html',
  styleUrls: ['calendarPicker.component.scss']
})
export class IDEACalendarPickerComponent {
  @Input() public inputDate: epochDateTime;
  @Input() public timePicker: boolean;
  @Input() public title: string;

  // support
  public refDate: Date;
  public selectedDate: Date;
  public today: Date;
  public calendarGrid: Array<Array<Date>>;
  public hour: number;
  public minute: number;
  public hours: Array<string>;
  public minutes: Array<string>;
  public weekDays: Array<string>;

  constructor(public modal: ModalController, public alertCtrl: AlertController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    this.today = new Date();
    this.refDate = this.inputDate ? new Date(this.inputDate) : new Date(this.today);
    this.selectedDate = new Date(this.refDate);
    this.hour = 12; // to endure timezones
    this.minute = 0;
    if (this.timePicker) {
      this.hour = this.selectedDate.getHours();
      // round the minutes a multiple of 5
      this.minute = Math.ceil(this.selectedDate.getMinutes() / 5) * 5;
      this.selectedDate.setMinutes(this.minute);
    }
    this.buildCalendarGrid(this.refDate);
    this.hours = Array.from(Array(24).keys()).map(i => '0'.concat(i.toString()).slice(-2));
    this.minutes = Array.from(Array(12).keys()).map(i => '0'.concat((i * 5).toString()).slice(-2));
    // build the weekdays based on the current locale
    this.weekDays = new Array<string>();
    const refDateForWeekDays = new Date(SUNDAY);
    refDateForWeekDays.setDate(refDateForWeekDays.getDate() - this.getLocalisedDay(refDateForWeekDays));
    for (let i = 0; i < 7; i++) {
      this.weekDays.push(refDateForWeekDays.toLocaleDateString(this.t.getCurrentLang(), { weekday: 'short' }));
      refDateForWeekDays.setDate(refDateForWeekDays.getDate() + 1);
    }
  }

  /**
   * Get the localised day.
   */
  public getLocalisedDay(date: Date): number {
    let n = date.getDay();
    switch (this.t.getCurrentLang()) {
      case 'it':
        n = --n < 0 ? 6 : n;
        break;
      default:
        n;
    }
    return n;
  }

  /**
   * Build the calendar grid based on the month of the *refDate*.
   * 6 rows and 7 columns (the days, from Monday to Sunday).
   */
  public buildCalendarGrid(refDate: Date) {
    // find the first day in the month: the important data here is the day of the week
    const firstDateOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    // the following flag is used to divide the logic so I can fill the calendar
    // also with the dates from the previous month, until there's space in the grid
    let haventFoundFirstDay = true;
    // index used to build the dates of the month, starting from the first one
    let index = 1;
    this.calendarGrid = new Array<Array<Date>>();
    for (let i = 0; i < 6; i++) {
      this.calendarGrid[i] = new Array<Date>();
      for (let j = 0; j < 7; j++) {
        if (haventFoundFirstDay) {
          if (this.getLocalisedDay(firstDateOfMonth) === j) {
            // note: considers Sunday
            haventFoundFirstDay = false;
            this.calendarGrid[i][j] = new Date(firstDateOfMonth);
            // now the I've found the first date of the month I can fill the calendar
            // the dates fromt the previous month, until there's space in the grid
            for (let y = this.getLocalisedDay(firstDateOfMonth); y >= 0; y--) {
              const d = new Date(firstDateOfMonth);
              d.setDate(firstDateOfMonth.getDate() - y);
              this.calendarGrid[i][this.getLocalisedDay(firstDateOfMonth) - y] = d;
            }
          }
        } else {
          // fill the following dates until there's space in the grid
          const d = new Date(firstDateOfMonth);
          d.setDate(firstDateOfMonth.getDate() + index++);
          this.calendarGrid[i][j] = d;
        }
      }
    }
  }

  /**
   * +- num years to the current one.
   */
  public addYears(offset: number) {
    this.refDate.setFullYear(this.refDate.getFullYear() + offset);
    this.buildCalendarGrid(this.refDate);
  }
  /**
   * Manual selection of the year.
   */
  public setYear(ev: any) {
    const year = parseInt(ev.target.value, 10);
    if (!year) return;
    this.refDate.setFullYear(year);
    this.buildCalendarGrid(this.refDate);
  }
  /**
   * +- num months to the current one.
   */
  public addMonths(offset: number) {
    this.refDate.setMonth(this.refDate.getMonth() + offset);
    this.buildCalendarGrid(this.refDate);
  }
  /**
   * Manual selection of the month.
   */
  public showMonths() {
    const buttons = [];
    const inputs = [];
    const month = new Date(0);
    for (let i = 1; i <= 12; i++) {
      inputs.push({
        type: 'radio',
        label: month.toLocaleDateString(this.t.getCurrentLang(), { month: 'long' }),
        value: i.toString(),
        checked: i === this.refDate.getMonth() + 1
      });
      month.setMonth(month.getMonth() + 1);
    }
    buttons.push({ text: this.t._('COMMON.CANCEL'), role: 'cancel' });
    buttons.push({
      text: this.t._('COMMON.SELECT'),
      handler: (m: string) => {
        this.refDate.setMonth(parseInt(m, 10) - 1);
        this.buildCalendarGrid(this.refDate);
      }
    });
    this.alertCtrl.create({ header: this.t._('IDEA.CALENDAR.MONTH'), buttons, inputs }).then(alert => alert.present());
  }

  /**
   * Set the new date.
   */
  public selectDate(date: Date) {
    this.selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.hour, this.minute);
  }

  /**
   * Set the new hour.
   */
  public selectHour(hour: string) {
    this.hour = Number(hour);
    this.selectedDate.setHours(this.hour);
  }
  /**
   * Set the new minute.
   */
  public selectMinute(minute: string) {
    this.minute = Number(minute);
    this.selectedDate.setMinutes(this.minute);
  }

  /**
   * Whether the two date are the same.
   */
  public isSameDay(dateA: Date, dateB: Date): boolean {
    return dateA.toISOString().slice(0, 10) === dateB.toISOString().slice(0, 10);
  }

  /**
   * Whether the two date are in the same month.
   */
  public isSameMonth(dateA: Date, dateB: Date): boolean {
    return dateA.toISOString().slice(0, 7) === dateB.toISOString().slice(0, 7);
  }

  /**
   * Return true if the hour in the UI is the selected one.
   */
  public isSameHour(hour: string): boolean {
    return this.selectedDate.getHours() === parseInt(hour, 10);
  }
  /**
   * Return true if the minute in the UI is the selected one.
   */
  public isSameMinute(minute: string): boolean {
    return this.selectedDate.getMinutes() === parseInt(minute, 10);
  }

  /**
   * Confirm and close.
   */
  public save(reset?: boolean) {
    this.modal.dismiss(reset ? '' : this.selectedDate);
  }
}
