import { Component, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import Moment = require('moment-timezone');

@Component({
  selector: 'idea-calendar-picker',
  templateUrl: 'calendarPicker.component.html',
  styleUrls: ['calendarPicker.component.scss']
})
export class IDEACalendarPickerComponent {
  @Input() public inputDate: Date;
  @Input() public timePicker: boolean;
  @Input() public title: string;

  // support
  public refDate: Moment.Moment;
  public selectedDate: Moment.Moment;
  public today: Moment.Moment;
  public calendarGrid: Array<Array<Moment.Moment>>;
  public hour: number;
  public minute: number;
  public hours: Array<string>;
  public minutes: Array<string>;
  public weekDays: Array<string>;

  constructor(public modal: ModalController, public alertCtrl: AlertController, public t: TranslateService) {}
  public ngOnInit() {
    Moment.locale(this.t.currentLang);
    this.today = Moment();
    this.refDate = this.inputDate ? Moment(this.inputDate) : Moment(this.today);
    this.selectedDate = Moment(this.refDate);
    this.hour = 0;
    this.minute = 0;
    if (this.timePicker) {
      this.hour = this.selectedDate.hour();
      // round the minutes a multiple of 5
      this.minute = Math.ceil(this.selectedDate.minute() / 5) * 5;
      this.selectedDate.minute(this.minute);
    }
    this.buildCalendarGrid(this.refDate);
    this.hours = Array.from(Array(24).keys()).map(i => '0'.concat(i.toString()).slice(-2));
    this.minutes = Array.from(Array(12).keys()).map(i => '0'.concat((i * 5).toString()).slice(-2));
    this.weekDays = Moment.weekdaysShort(true);
  }

  /**
   * Build the calendar grid based on the month of the *refDate*.
   * 6 rows and 7 columns (the days, from Monday to Sunday).
   */
  public buildCalendarGrid(refDate: Moment.Moment) {
    // find the first day in the month: the important data here is the day of the week
    const firstDateOfMonth = Moment([refDate.year(), refDate.month(), 1]);
    // the following flag is used to divide the logic so I can fill the calendar
    // also with the dates from the previous month, until there's space in the grid
    let haventFoundFirstDay = true;
    // index used to build the dates of the month, starting from the first one
    let index = 1;
    this.calendarGrid = new Array<Array<Moment.Moment>>();
    for (let i = 0; i < 6; i++) {
      this.calendarGrid[i] = new Array<Moment.Moment>();
      for (let j = 0; j < 7; j++) {
        if (haventFoundFirstDay) {
          if (firstDateOfMonth.weekday() === j) {
            // note: considers Sunday
            haventFoundFirstDay = false;
            this.calendarGrid[i][j] = Moment(firstDateOfMonth);
            // now the I've found the first date of the month I can fill the calendar
            // the dates fromt the previous month, until there's space in the grid
            for (let y = firstDateOfMonth.weekday(); y >= 0; y--)
              this.calendarGrid[i][firstDateOfMonth.weekday() - y] = Moment(firstDateOfMonth).subtract(y, 'd');
          }
          // fill the following dates until there's space in the grid
        } else this.calendarGrid[i][j] = Moment(firstDateOfMonth).add(index++, 'd');
      }
    }
  }

  /**
   * +- num years to the current one.
   */
  public addYears(offset: number) {
    this.refDate.add(offset, 'y');
    this.buildCalendarGrid(this.refDate);
    // this.refDate = new Date(this.refDate);  // to fire the "onChange" event
  }
  /**
   * Manual selection of the year.
   */
  public setYear(ev: any) {
    const year = parseInt(ev.target.value, 10);
    if (!year) return;
    this.refDate.year(year);
    this.buildCalendarGrid(this.refDate);
    // this.refDate = new Date(this.refDate);  // to fire the "onChange" event
  }
  /**
   * +- num months to the current one.
   */
  public addMonths(offset: number) {
    this.refDate.add(offset, 'M');
    this.buildCalendarGrid(this.refDate);
    // this.refDate = new Date(this.refDate); // to fire the "onChange" event
  }
  /**
   * Manual selection of the month.
   */
  public showMonths() {
    const buttons = [];
    const inputs = [];
    const month = Moment([1970, 0, 1]);
    for (let i = 1; i <= 12; i++) {
      inputs.push({
        type: 'radio',
        label: month.format('MMMM'),
        value: i.toString(),
        checked: i === this.refDate.month() + 1
      });
      month.month(month.month() + 1);
    }
    buttons.push({ text: this.t.instant('COMMON.CANCEL'), role: 'cancel' });
    buttons.push({
      text: this.t.instant('COMMON.SELECT'),
      handler: (m: string) => {
        this.refDate.month(parseInt(m, 10) - 1);
        this.buildCalendarGrid(this.refDate);
      }
    });
    this.alertCtrl
      .create({ header: this.t.instant('IDEA.CALENDAR.MONTH'), buttons: buttons, inputs: inputs })
      .then(alert => alert.present());
  }

  /**
   * Set the new date.
   */
  public selectDate(date: Moment.Moment) {
    this.selectedDate = Moment([date.year(), date.month(), date.date(), this.hour, this.minute]);
  }

  /**
   * Set the new hour.
   */
  public selectHour(hour: string) {
    this.hour = Number(hour);
    this.selectedDate.hour(this.hour);
  }
  /**
   * Set the new minute.
   */
  public selectMinute(minute: string) {
    this.minute = Number(minute);
    this.selectedDate.minute(this.minute);
  }

  /**
   * Return true if the hour in the UI is the selected one.
   */
  public isSameHour(hour: string): boolean {
    return this.selectedDate.hour() === parseInt(hour, 10);
  }
  /**
   * Return true if the minute in the UI is the selected one.
   */
  public isSameMinute(minute: string): boolean {
    return this.selectedDate.minute() === parseInt(minute, 10);
  }

  /**
   * Confirm and close.
   */
  public save(reset?: boolean) {
    this.modal.dismiss(reset ? '' : this.selectedDate);
  }
}
