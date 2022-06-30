import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subject } from 'rxjs';
import { CalendarEvent, CalendarEventTimesChangedEvent, CalendarMonthViewDay, CalendarView } from 'angular-calendar';
// @ts-ignore
import { isFuture, isToday, isSameDay } from 'date-fns';
// @ts-ignore
import ColorParse from 'color-parse';
import { IDEATinCanService, IDEATranslationsService } from '@idea-ionic/common';

@Component({
  selector: 'idea-agenda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'agenda.component.html',
  styleUrls: ['agenda.component.scss']
})
export class IDEAAgendaComponent implements OnInit {
  /**
   * The events to display in the calendar.
   */
  @Input() public events: AgendaEvent[] = [];
  /**
   * An array of day indexes (0 = sunday, 1 = monday, etc.) that will be hidden on the view.
   */
  @Input() public excludeDays: number[] = [];
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
   * Trigger when the view date of reference changed (because we moved inside the calendar).
   */
  @Output() public changeDate = new EventEmitter<Date>();
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
  /**
   * Helper to use the enum in the UI.
   */
  public Attendance = EventAttendance;

  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

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
   * Emit the change of the view date and close the detail component of the month view, if needed.
   */
  public viewDateChanged(newDate: Date) {
    if (this.view === CalendarView.Month) this.activeDayIsOpen = false;
    this.changeDate.emit(newDate);
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
    const r = Math.max(Math.min(255, Number(alt.values[0]) + amount), 0);
    const g = Math.max(Math.min(255, Number(alt.values[1]) + amount), 0);
    const b = Math.max(Math.min(255, Number(alt.values[2]) + amount), 0);
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

  /**
   * Get a shortened version of the description as preview.
   */
  public getPreviewDescription(description: string): string {
    return description && description.length > 100 ? description.slice(0, 100).concat('...') : description;
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
   * The location of the event.
   */
  location?: string;
  /**
   * A list of URLs of images to show as small avatars.
   */
  avatars?: { id: string; url: string; title: string }[];
  /**
   * A list of ion-icons to show.
   */
  icons?: { name: string; title: string }[];
  /**
   * Whether the event is external; external events are less important UI-wise.
   */
  external?: boolean;
  /**
   * The attendance status to this event, if any.
   */
  attendance?: EventAttendance;
  /**
   * A standard and unique id for the event, valid across multiple sources.
   */
  iCalUID?: string;
}

/**
 * Possible attendance statuses for the event.
 */
export enum EventAttendance {
  DECLINED = -1,
  NEEDS_ACTION = 0,
  TENTATIVE,
  ACCEPTED
}
