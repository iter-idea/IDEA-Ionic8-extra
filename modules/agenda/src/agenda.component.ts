import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { IonContent, Platform } from '@ionic/angular';
import { finalize, fromEvent, Subject, takeUntil } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventTimesChangedEvent,
  CalendarMonthViewBeforeRenderEvent,
  CalendarView,
  CalendarWeekViewBeforeRenderEvent
} from 'angular-calendar';
import { isFuture, isToday, isSameDay, endOfWeek, addDays, addMinutes } from 'date-fns';
// @ts-ignore
import ColorParse from 'color-parse';
import { IDEATranslationsService } from '@idea-ionic/common';

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
  @Input() events: AgendaEvent[] = [];
  /**
   * An array of day indexes (0 = sunday, 1 = monday, etc.) that will be hidden on the view.
   */
  @Input() excludeDays: number[] = [];
  /**
   * The day start hours in 24 hour time. Must be 0-23
   */
  @Input() dayStartHour = 0;
  /**
   * The day start hours in 24 hour time. Must be 0-23
   */
  @Input() dayEndHour = 23;
  /**
   * The number of segments in an hour. Must divide equally into 60.
   */
  @Input() hourSegments = 2;
  /**
   * Whether to open the current day's details right away in month view.
   */
  @Input() activeDayIsOpen = false;
  /**
   * The view mode for the agenda.
   */
  @Input() view: CalendarView = CalendarView.Week;
  /**
   * The allowed view mode for the agenda.
   */
  @Input() allowedViews = [CalendarView.Day, CalendarView.Week, CalendarView.Month];
  /**
   * Whether to block any day/slot in the past.
   */
  @Input() onlyFuture = false;
  /**
   * Some notes to show underneath the calendar's header.
   */
  @Input() titleNotes: string;
  /**
   * The template for new events created by drag&drop.
   */
  @Input() newEventTemplate: AgendaEvent = { title: 'New', start: null, meta: {} };
  /**
   * Whether (and how) to allow the creation of events by drag&drop.
   * If enabled, on mobile it requires the `parentContent` to be set for a correct execution.
   */
  @Input() allowDragToCreate: DragToCreateOptions = DragToCreateOptions.DISABLED;
  /**
   * The parent ion-content, in case we want to control its scrollability for drag&drop features.
   */
  @Input() parentContent: IonContent;
  /**
   * Trigger when an event is selected.
   */
  @Output() selectEvent = new EventEmitter<AgendaEvent>();
  /**
   * Trigger when a day is selected.
   */
  @Output() selectDay = new EventEmitter<Date>();
  /**
   * Trigger when a time slot is selected.
   */
  @Output() selectSlot = new EventEmitter<Date>();
  /**
   * Trigger when a new event is added by drag and drop.
   */
  @Output() newEventByDrag = new EventEmitter<AgendaEvent>();
  /**
   * Trigger when an event changed date (drag&drop or resize).
   */
  @Output() changeEvent = new EventEmitter<AgendaEvent>();
  /**
   * Trigger when the view date of reference changed (because we moved inside the calendar).
   */
  @Output() changeDate = new EventEmitter<Date>();
  /**
   * Trigger before the rendering of the week or day view.
   */
  @Output() beforeWeekOrDayViewRenderEmitter = new EventEmitter<CalendarWeekViewBeforeRenderEvent>();
  /**
   * Trigger before the rendering of the month view.
   */
  @Output() beforeMonthViewRenderEmitter = new EventEmitter<CalendarMonthViewBeforeRenderEvent>();
  /**
   * Helper to use the enum in the UX.
   */
  CalendarView = CalendarView;
  /**
   * The currently selected date.
   */
  viewDate: Date = new Date();
  /**
   * A controller to refresh the current view.
   */
  refresh: Subject<void> = new Subject();
  /**
   * The locale used to format dates.
   * @hide
   */
  locale: string;
  /**
   * The starting day for the week, according to the locale (0 = sunday).
   * @hide
   */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  Attendance = EventAttendance;

  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor(private cdr: ChangeDetectorRef, private platform: Platform, public t: IDEATranslationsService) {}
  ngOnInit(): void {
    this.locale = this.t.getCurrentLang();
    // in case of Italian locale the starting day for the week is monday (1), otherwise sunday (0)
    this.weekStartsOn = this.locale === 'it' ? 1 : 0;
  }
  isMobile(): boolean {
    return this.platform.is('mobile');
  }

  /**
   * Run some checks before the month view is rendered (e.g. disable invalid days).
   */
  beforeMonthViewRender(event: CalendarMonthViewBeforeRenderEvent): void {
    this.beforeMonthViewRenderEmitter.emit(event);
    const { body } = event;
    body.forEach(day => {
      if (!this.dateIsValid(day.date)) day.cssClass = 'cal-disabled';
    });
  }
  /**
   * Run some checks before the week/day view is rendered (e.g. disable invalid days).
   */
  beforeWeekOrDayViewRender(event: CalendarWeekViewBeforeRenderEvent): void {
    this.beforeWeekOrDayViewRenderEmitter.emit(event);
    const { header, hourColumns } = event;
    header.forEach(day => {
      if (!this.dateIsValid(day.date)) day.cssClass = 'cal-disabled';
    });
    hourColumns.forEach(hourCol => {
      hourCol.hours.forEach(hour => {
        hour.segments.forEach(segment => {
          if (!this.dateIsValid(segment.date)) segment.cssClass = 'cal-disabled';
        });
      });
    });
  }

  /**
   * Check whether a date is valid based on the configured parameters.
   */
  dateIsValid(date: any, sameDayIsValid?: boolean): boolean {
    if (!this.onlyFuture) return true;
    return isFuture(date) || (sameDayIsValid ? isToday(date) : false);
  }

  /**
   * Change the current view for the agenda.
   */
  setView(view: CalendarView): void {
    this.view = view;
  }

  /**
   * Emit the change of the view date and close the detail component of the month view, if needed.
   */
  viewDateChanged(newDate: Date): void {
    if (this.view === CalendarView.Month) this.activeDayIsOpen = false;
    this.changeDate.emit(newDate);
  }

  /**
   * A day was selected: manage the detailed view.
   */
  changeDay({ date, events }: { date: Date; events: AgendaEvent[] }): void {
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
  eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
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
  getAlternateColor(color: string, amount: number, opacity?: number): string | undefined {
    if (!color?.trim()) return undefined;
    const alt = ColorParse(color.trim());
    const r = Math.max(Math.min(255, Number(alt.values[0]) + amount), 0);
    const g = Math.max(Math.min(255, Number(alt.values[1]) + amount), 0);
    const b = Math.max(Math.min(255, Number(alt.values[2]) + amount), 0);
    return `rgba(${r}, ${g}, ${b}, ${opacity || 1})`;
  }

  /**
   * Get the content of the tooltip based on the event.
   */
  getTooltipContent(event: AgendaEvent): string {
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
  getPreviewDescription(description: string): string {
    return description && description.length > 100 ? description.slice(0, 100).concat('...') : description;
  }

  /**
   * Handle the drag&drop to create a new event.
   */
  startDragToCreate(event: Event, segmentDate: Date, segmentElement: HTMLElement): void {
    if (!this.allowDragToCreate) return;

    if (this.parentContent) this.parentContent.scrollY = false;

    const eventByDragAndDrop: AgendaEvent = { ...this.newEventTemplate, start: segmentDate };
    this.events = [...this.events, eventByDragAndDrop];

    const segmentPosition = segmentElement.getBoundingClientRect();
    const endOfView = endOfWeek(this.viewDate, { weekStartsOn: this.weekStartsOn });

    const whileDragging = (draggingEvent: Event): void => {
      const { clientY, clientX } =
        draggingEvent.type === 'touchmove' ? (draggingEvent as TouchEvent).touches[0] : (draggingEvent as MouseEvent);

      const minutesDiff = ceilToNearest(clientY - segmentPosition.top, 30);
      const daysDiff = floorToNearest(clientX - segmentPosition.left, segmentPosition.width) / segmentPosition.width;

      let newEnd: Date;
      if (this.allowDragToCreate === DragToCreateOptions.ONLY_SAME_DAY) newEnd = addMinutes(segmentDate, minutesDiff);
      else newEnd = addDays(addMinutes(segmentDate, minutesDiff), daysDiff);

      if (newEnd > segmentDate && newEnd < endOfView) eventByDragAndDrop.end = newEnd;
      refreshView();
    };

    const endOfDrag = (): void => {
      if (this.parentContent) this.parentContent.scrollY = true;
      eventByDragAndDrop.end = this.getFixedEndDateWithMinimumSegmentDuration(eventByDragAndDrop);
      refreshView();
      this.newEventByDrag.emit(eventByDragAndDrop);
    };

    const refreshView = (): void => {
      this.events = [...this.events];
      this.cdr.detectChanges();
    };

    if (event.type === 'touchstart') {
      fromEvent(document, 'touchmove')
        .pipe(finalize(endOfDrag), takeUntil(fromEvent(document, 'touchend')))
        .subscribe(whileDragging);
    } else {
      fromEvent(document, 'mousemove')
        .pipe(finalize(endOfDrag), takeUntil(fromEvent(document, 'mouseup')))
        .subscribe(whileDragging);
    }
  }
  private getFixedEndDateWithMinimumSegmentDuration(agendaBooking: AgendaEvent): Date {
    const fixedEnd = new Date(agendaBooking.end ?? agendaBooking.start);
    const segmentSizeInMinutes = 60 / this.hourSegments;
    if (fixedEnd.getTime() <= agendaBooking.start.getTime() + segmentSizeInMinutes * 60 * 1000)
      fixedEnd.setMinutes(agendaBooking.start.getMinutes() + segmentSizeInMinutes);
    return fixedEnd;
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
   * The colors of the event displayed.
   */
  color?: { primary: string; secondary?: string } | any;
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

/**
 * The options to allow (or not) drag&drop to create a new event.
 */
export enum DragToCreateOptions {
  DISABLED = 0,
  ONLY_SAME_DAY = 1,
  FREE = 2
}

const floorToNearest = (amount: number, precision: number): number => Math.floor(amount / precision) * precision;
const ceilToNearest = (amount: number, precision: number): number => Math.ceil(amount / precision) * precision;
