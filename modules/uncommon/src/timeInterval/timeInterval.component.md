# IDEATimeIntervalComponent

## Selector

idea-time-interval

## Inputs

- `timeInterval` (*TimeInterval*) - The time interval to set.
- `period` (*Periods*) - Whether we should start picking the time displaying the afternoon (PM) or the morning (AM, default).
- `notEarlierThan` (*number*) - A time to use as lower limit for the possible choices.
- `notLaterThan` (*number*) - A time to use as upper limit for the possible choices.
- `label` (*string*) - The label for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `placeholder` (*string*) - A placeholder for the field.
- `disabled` (*boolean*) - If true, the component is disabled.
- `tappableWhenDisabled` (*boolean*) - If true, the field has a tappable effect when disabled.
- `obligatory` (*boolean*) - If true, the obligatory dot is shown.
- `lines` (*string*) - Lines preferences for the item.
- `color` (*string*) - The color for the component.

## Outputs

- `select` (*EventEmitter<void>*) - On select event.
- `iconSelect` (*EventEmitter<void>*) - Icon select.
- `selectWhenDisabled` (*EventEmitter<void>*) - On select (with the field disabled) event.
