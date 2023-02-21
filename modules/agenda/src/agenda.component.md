# IDEAAgendaComponent

## Selector

idea-agenda

## Inputs

- `events` (*AgendaEvent[]*) - The events to display in the calendar.
- `excludeDays` (*number[]*) - An array of day indexes (0 = sunday, 1 = monday, etc.) that will be hidden on the view.
- `dayStartHour` (*number*) - The day start hours in 24 hour time. Must be 0-23
- `dayEndHour` (*number*) - The day start hours in 24 hour time. Must be 0-23
- `hourSegments` (*number*) - The number of segments in an hour. Must divide equally into 60.
- `activeDayIsOpen` (*boolean*) - Whether to open the current day's details right away in month view.
- `view` (*CalendarView*) - The view mode for the agenda.
- `allowedViews` (*CalendarView[]*) - The allowed view mode for the agenda.
- `onlyFuture` (*boolean*) - Whether to block any day/slot in the past.
- `titleNotes` (*string*) - Some notes to show underneath the calendar's header.
- `newEventTemplate` (*AgendaEvent*) - The template for new events created by drag&drop.
- `allowDragToCreate` (*DragToCreateOptions*) - Whether (and how) to allow the creation of events by drag&drop.
If enabled, on mobile it requires the `parentContent` to be set for a correct execution.
- `parentContent` (*IonContent*) - The parent ion-content, in case we want to control its scrollability for drag&drop features.

## Outputs

- `selectEvent` (*EventEmitter<AgendaEvent>*) - Trigger when an event is selected.
- `selectDay` (*EventEmitter<Date>*) - Trigger when a day is selected.
- `selectSlot` (*EventEmitter<Date>*) - Trigger when a time slot is selected.
- `newEventByDrag` (*EventEmitter<AgendaEvent>*) - Trigger when a new event is added by drag and drop.
- `changeEvent` (*EventEmitter<AgendaEvent>*) - Trigger when an event changed date (drag&drop or resize).
- `changeDate` (*EventEmitter<Date>*) - Trigger when the view date of reference changed (because we moved inside the calendar).
- `beforeWeekOrDayViewRenderEmitter` (*EventEmitter<CalendarWeekViewBeforeRenderEvent>*) - Trigger before the rendering of the week or day view.
- `beforeMonthViewRenderEmitter` (*EventEmitter<CalendarMonthViewBeforeRenderEvent>*) - Trigger before the rendering of the month view.
