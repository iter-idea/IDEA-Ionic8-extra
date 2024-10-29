# IDEACalendarItemComponent

## Selector

idea-calendar-item

## Inputs

- `calendar` (*Calendar*) - The calendar to show.
- `disabled` (*boolean*) - Whether the component is disabled.
- `advancedPermissions` (*boolean*) - Whether we want to enable advanced permissions (based on the memberships) on the calendar.
- `hideColor` (*boolean*) - Whether the calendar color is an important detail or it shouldn't be shown.
- `baseURL` (*string*) - The URL to be used on the redirect calls.

## Outputs

- `somethingChanged` (*EventEmitter<Calendar>*) - Report to parent components a change.
