import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subject } from 'rxjs';
import { CalendarEvent, CalendarEventTimesChangedEvent, CalendarMonthViewDay, CalendarView } from 'angular-calendar';
import { isFuture, isToday, isSameDay } from 'date-fns';
import ColorParse = require('color-parse');

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATinCanService } from '../tinCan.service';

@Component({
  selector: 'idea-agenda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'agenda.component.html',
  styleUrls: ['agenda.component.scss']
})
export class IDEAAgendaComponent {
  /**
   * The events to display in the calendar.
   */
  @Input() public events: Array<AgendaEvent> = [];
  /**
   * An array of day indexes (0 = sunday, 1 = monday, etc.) that will be hidden on the view.
   */
  @Input() public excludeDays: Array<number> = [];
  /**
   * The day start hours in 24 hour time. Must be 0-23
   */
  @Input() public dayStartHour = 0;
  /**
   * The day start hours in 24 hour time. Must be 0-23
   */
  @Input() public dayEndHour = 23;
  /**
   * The number of segments in an hour. Must divide equally into 60.
   */
  @Input() public hourSegments = 2;
  /**
   * Whether to open the current day's details right away in month view.
   */
  @Input() public activeDayIsOpen = false;
  /**
   * The view mode for the agenda.
   */
  @Input() public view: CalendarView = CalendarView.Week;
  /**
   * Whether to block any day/slot in the past.
   */
  @Input() public onlyFuture = false;
  /**
   * Trigger when an event is selected.
   */
  @Output() public selectEvent = new EventEmitter<AgendaEvent>();
  /**
   * Trigger when a day is selected.
   */
  @Output() public selectDay = new EventEmitter<Date>();
  /**
   * Trigger when a time slot is selected.
   */
  @Output() public selectSlot = new EventEmitter<Date>();
  /**
   * Trigger when an event changed date (drag&drop or resize).
   */
  @Output() public changeEvent = new EventEmitter<AgendaEvent>();
  /**
   * Helper to use the enum in the UX.
   */
  public CalendarView = CalendarView;
  /**
   * The currently selected date.
   */
  public viewDate: Date = new Date();
  /**
   * A controller to refresh the current view.
   */
  public refresh: Subject<any> = new Subject();
  /**
   * The locale used to format dates.
   * @hide
   */
  public locale: string;
  /**
   * The starting day for the week, according to the locale (0 = sunday).
   * @hide
   */
  public weekStartsOn: number;

  constructor(public platform: Platform, public tc: IDEATinCanService, public t: IDEATranslationsService) {}
  public ngOnInit() {
    this.locale = this.t.getCurrentLang();
    // in case of Italian locale the starting day for the week is monday (1), otherwise sunday (0)
    this.weekStartsOn = this.locale === 'it' ? 1 : 0;
  }

  /**
   * Run some checks before the month view is rendered (e.g. disable invalid days).
   */
  public beforeMonthViewRender({ body }: { body: CalendarMonthViewDay[] }) {
    body.forEach(day => {
      if (!this.dateIsValid(day.date, true)) day.cssClass = 'cal-disabled';
    });
  }
  /**
   * Run some checks before the weel/day view is rendered (e.g. disable invalid days).
   */
  public beforeWeekOrDayViewRender({ header }: { header: any }) {
    header.forEach((day: any) => {
      if (!this.dateIsValid(day.date, true)) day.cssClass = 'cal-disabled';
    });
  }

  /**
   * Check whether a date is valid based on the configured parameters.
   */
  public dateIsValid(date: Date, sameDayIsValid?: boolean): boolean {
    if (!this.onlyFuture) return true;
    return isFuture(date) || (sameDayIsValid ? isToday(date) : false);
  }

  /**
   * Change the current view for the agenda.
   */
  public setView(view: CalendarView) {
    this.view = view;
  }

  /**
   * Close a day's details in the month view.
   */
  public closeDayDetailsMonthView() {
    this.activeDayIsOpen = false;
  }

  /**
   * A day was selected: manage the detailed view.
   */
  public changeDay({ date, events }: { date: Date; events: AgendaEvent[] }) {
    // skip if the date isn't valid
    if (!this.dateIsValid(date, true)) return;
    // if the selected day changed, if the new day has events, open the details in month view (otherwise close them)
    if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || !events || events.length === 0)
      this.activeDayIsOpen = false;
    else this.activeDayIsOpen = true;
    // update the current date in the agenda
    this.viewDate = date;
  }

  /**
   * The time of an event was changed.
   */
  public eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent) {
    // update the event
    event.start = newStart;
    event.end = newEnd;
    // re-map the array to trigger the UI refresh
    this.events = this.events.slice();
    // trigger the event to the parent component
    this.changeEvent.emit(event);
  }

  /**
   * Given a color, it returns an opaque version of it.
   */
  public getAlternateColor(color: string, amount: number, opacity?: number): string {
    const alt = ColorParse(color);
    const r = Math.max(Math.min(255, alt.values[0] + amount), 0);
    const g = Math.max(Math.min(255, alt.values[1] + amount), 0);
    const b = Math.max(Math.min(255, alt.values[2] + amount), 0);
    return `rgba(${r}, ${g}, ${b}, ${opacity || 1})`;
  }

  /**
   * Get the content of the tooltip based on the event.
   */
  public getTooltipContent(event: AgendaEvent): string {
    if (!event) return '';
    let str = event.title ? '<b>' + event.title + '</b>' : '';
    if (event.description) str = str.concat('<br>', event.description);
    if (event.icons) event.icons.forEach(x => (str = str.concat('<br>', '<i>', x.title, '</i>')));
    if (event.avatars && event.avatars.length) {
      str = str.concat('<br><br>~');
      event.avatars.forEach(x => (str = str.concat('<br>', x.title)));
    }
    return str;
  }
}

/**
 * A richer version of the classic CalendarEvent.
 */
export interface AgendaEvent extends CalendarEvent {
  /**
   * A brief description for the event (e.g. customer, address, etc.).
   */
  description?: string;
  /**
   * A list of URLs of images to show as small avatars.
   */
  avatars?: Array<{ url: string; title: string }>;
  /**
   * A list of ion-icons to show.
   */
  icons?: Array<{ name: string; title: string }>;
}
