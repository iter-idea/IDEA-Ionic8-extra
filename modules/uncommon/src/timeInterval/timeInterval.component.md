# IDEATimeIntervalComponent

## Selector

idea-time-interval

## Inputs

- `timeInterval` (_TimeInterval_) - The time interval to set.
- `period` (_Periods_) - Whether we should start picking the time displaying the afternoon (PM) or the morning (AM, default).
- `notEarlierThan` (_number_) - A time to use as lower limit for the possible choices.
- `notLaterThan` (_number_) - A time to use as upper limit for the possible choices.
- `label` (_string_) - The label for the field.
- `icon` (_string_) - The icon for the field.
- `iconColor` (_string_) - The color of the icon.
- `placeholder` (_string_) - A placeholder for the field.
- `disabled` (_boolean_) - If true, the component is disabled.
- `tappableWhenDisabled` (_boolean_) - If true, the field has a tappable effect when disabled.
- `obligatory` (_boolean_) - If true, the obligatory dot is shown.
- `lines` (_string_) - Lines preferences for the item.
- `color` (_string_) - The color for the component.

## Outputs

- `select` (_void_) - On select event.
- `iconSelect` (_void_) - Icon select.
- `selectWhenDisabled` (_void_) - On select (with the field disabled) event.
