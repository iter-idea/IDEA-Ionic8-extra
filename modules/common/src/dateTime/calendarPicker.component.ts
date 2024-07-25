import { Component, Input, OnInit, inject } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { epochDateTime, epochISOString } from 'idea-toolbox';

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
export class IDEACalendarPickerComponent implements OnInit {
  @Input() inputDate: epochDateTime | epochISOString;
  @Input() timePicker = false;
  @Input() manualTimePicker = false;
  @Input() title: string;
  @Input() hideClearButton = false;
  @Input() min: epochDateTime | epochISOString;
  @Input() max: epochDateTime | epochISOString;

  refDate: Date;
  selectedDate: Date;
  today: Date;
  calendarGrid: Date[][];
  hour: number;
  minute: number;
  hours: string[];
  minutes: string[];
  weekDays: string[];
  dateMin: Date;
  dateMax: Date;

  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);

  ngOnInit(): void {
    this.today = new Date();
    this.refDate = this.inputDate ? new Date(this.inputDate) : new Date(this.today);
    this.selectedDate = new Date(this.refDate);
    this.hour = 12; // to endure timezones
    this.minute = 0;
    if (this.timePicker || this.manualTimePicker) {
      this.hour = this.selectedDate.getHours();
      if (this.manualTimePicker) this.minute = this.selectedDate.getMinutes();
      else {
        // round the minutes a multiple of 5
        this.minute = Math.ceil(this.selectedDate.getMinutes() / 5) * 5;
        this.selectedDate.setMinutes(this.minute);
      }
    }
    this.buildCalendarGrid(this.refDate);
    this.hours = Array.from(Array(24).keys()).map(i => '0'.concat(i.toString()).slice(-2));
    this.minutes = Array.from(Array(12).keys()).map(i => '0'.concat((i * 5).toString()).slice(-2));
    // build the weekdays based on the current locale
    this.weekDays = new Array<string>();
    const refDateForWeekDays = new Date(SUNDAY);
    refDateForWeekDays.setDate(refDateForWeekDays.getDate() - this.getLocalisedDay(refDateForWeekDays));
    for (let i = 0; i < 7; i++) {
      this.weekDays.push(refDateForWeekDays.toLocaleDateString(this._translate.getCurrentLang(), { weekday: 'short' }));
      refDateForWeekDays.setDate(refDateForWeekDays.getDate() + 1);
    }
    if (this.min) this.dateMin = new Date(this.min);
    if (this.max) this.dateMax = new Date(this.max);
  }

  getLocalisedDay(date: Date): number {
    let n = date.getDay();
    switch (this._translate.getCurrentLang()) {
      case 'it':
        n = --n < 0 ? 6 : n;
        break;
    }
    return n;
  }

  buildCalendarGrid(refDate: Date): void {
    // find the first day in the month: the important data here is the day of the week
    const firstDateOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    // the following flag is used to divide the logic so I can fill the calendar
    // also with the dates from the previous month, until there's space in the grid
    let haventFoundFirstDay = true;
    // index used to build the dates of the month, starting from the first one
    let index = 1;
    this.calendarGrid = new Array<Date[]>();
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

  addYears(offset: number): void {
    this.refDate.setFullYear(this.refDate.getFullYear() + offset);
    this.buildCalendarGrid(this.refDate);
  }
  setYear(year: string | number): void {
    if (!year) return;

    this.refDate.setFullYear(Number(year));
    this.buildCalendarGrid(this.refDate);
  }
  addMonths(offset: number): void {
    this.refDate.setMonth(this.refDate.getMonth() + offset);
    this.buildCalendarGrid(this.refDate);
  }
  async showMonths(): Promise<void> {
    const buttons = [];
    const inputs: any[] = [];
    const month = new Date(0);
    for (let i = 1; i <= 12; i++) {
      inputs.push({
        type: 'radio',
        label: month.toLocaleDateString(this._translate.getCurrentLang(), { month: 'long' }),
        value: i.toString(),
        checked: i === this.refDate.getMonth() + 1
      });
      month.setMonth(month.getMonth() + 1);
    }
    buttons.push({ text: this._translate._('COMMON.CANCEL'), role: 'cancel' });
    buttons.push({
      text: this._translate._('COMMON.SELECT'),
      handler: (m: string): void => {
        this.refDate.setMonth(parseInt(m, 10) - 1);
        this.buildCalendarGrid(this.refDate);
      }
    });

    const alert = await this._alert.create({
      header: this._translate._('IDEA_COMMON.CALENDAR.MONTH'),
      buttons,
      inputs
    });
    alert.present();
  }

  isDateSelectable(date: Date): boolean {
    if (this.dateMin && date < this.dateMin) return false;
    if (this.dateMax && date > this.dateMax) return false;
    return true;
  }

  selectDate(date: Date): void {
    this.selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), this.hour, this.minute);
  }

  selectHour(hour: string): void {
    this.hour = Number(hour);
    this.selectedDate.setHours(this.hour);
  }
  selectMinute(minute: string): void {
    this.minute = Number(minute);
    this.selectedDate.setMinutes(this.minute);
  }

  isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  isSameHour(hour: string): boolean {
    return this.selectedDate.getHours() === Number(hour);
  }
  isSameMinute(minute: string): boolean {
    return this.selectedDate.getMinutes() === Number(minute);
  }

  save(reset?: boolean): void {
    this._modal.dismiss(reset ? '' : this.selectedDate);
  }
  close(): void {
    this._modal.dismiss();
  }
}
