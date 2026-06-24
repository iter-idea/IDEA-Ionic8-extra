# IDEAAgendaComponent

## Selector

idea-agenda

## Inputs

- `events` (_AgendaEvent[]_) - The events to display in the calendar.
- `excludeDays` (_number[]_) - An array of day indexes (0 = sunday, 1 = monday, etc.) that will be hidden on the view.
- `dayStartHour` (_number_) - The day start hours in 24 hour time. Must be 0-23
- `dayEndHour` (_number_) - The day start hours in 24 hour time. Must be 0-23
- `hourSegments` (_number_) - The number of segments in an hour. Must divide equally into 60.
- `activeDayIsOpen` (_boolean_) - Whether to open the current day's details right away in month view.
- `view` (_CalendarView_) - The view mode for the agenda.
- `allowedViews` (_CalendarView[]_) - The allowed view mode for the agenda.
- `onlyFuture` (_boolean_) - Whether to block any day/slot in the past.
- `titleNotes` (_string_) - Some notes to show underneath the calendar's header.
- `newEventTemplate` (_AgendaEvent_) - The template for new events created by drag&drop.
- `allowDragToCreate` (_DragToCreateOptions_) - Whether (and how) to allow the creation of events by drag&drop.
  If enabled, on mobile it requires the `parentContent` to be set for a correct execution.
- `parentContent` (_IonContent_) - The parent ion-content, in case we want to control its scrollability for drag&drop features.

## Outputs

- `selectEvent` (_AgendaEvent_) - Trigger when an event is selected.
- `selectDay` (_Date_) - Trigger when a day is selected.
- `selectSlot` (_Date_) - Trigger when a time slot is selected.
- `newEventByDrag` (_AgendaEvent_) - Trigger when a new event is added by drag and drop.
- `changeEvent` (_AgendaEvent_) - Trigger when an event changed date (drag&drop or resize).
- `changeDate` (_Date_) - Trigger when the view date of reference changed (because we moved inside the calendar).
- `beforeWeekOrDayViewRenderEmitter` (_CalendarWeekViewBeforeRenderEvent_) - Trigger before the rendering of the week or day view.
- `beforeMonthViewRenderEmitter` (_CalendarMonthViewBeforeRenderEvent_) - Trigger before the rendering of the month view.
