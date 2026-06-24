# IDEADateTimeComponent

## Selector

idea-date-time

## Inputs

- `date` (_epochDateTime | epochISOString_) - The date to show/pick.
- `timePicker` (_boolean_) - Whether to show the time picker (datetime) or not (date).
- `manualTimePicker` (_boolean_) - Whether to show the MANUAL time picker (datetime) or not (date).
- `useISOFormat` (_boolean_) - Whether to use the `epochISOString` format instead of `epochDateTime`.
- `label` (_string_) - The label for the field.
- `icon` (_string_) - The icon for the field.
- `iconColor` (_string_) - The color of the icon.
- `lines` (_string_) - Lines preferences for the item.
- `color` (_string_) - The color for the component.
- `placeholder` (_string_) - A placeholder for the field.
- `disabled` (_boolean_) - If true, the component is disabled.
- `obligatory` (_boolean_) - If true, the obligatory dot is shown.
- `hideClearButton` (_boolean_) - If true, hidew the clear button in the header.
- `min` (_epochDateTime | epochISOString_) - If set, is the minimum date selectable.
- `max` (_epochDateTime | epochISOString_) - If set, is the maximum date selectable.

## Outputs

- `dateChange` (_epochDateTime | epochISOString | null | any_)
- `iconSelect` (_void_)
