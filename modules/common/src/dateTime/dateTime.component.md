# IDEADateTimeComponent

## Selector

idea-date-time

## Inputs

- `date` (*string | number*) - The date to show/pick.
- `timePicker` (*boolean*) - Whether to show the time picker (datetime) or not (date).
- `useISOFormat` (*boolean*) - Whether to use the `epochISOString` format instead of `epochDateTime`.
- `label` (*string*) - The label for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `lines` (*string*) - Lines preferences for the item.
- `color` (*string*) - The color for the component.
- `placeholder` (*string*) - A placeholder for the field.
- `disabled` (*boolean*) - If true, the component is disabled.
- `obligatory` (*boolean*) - If true, the obligatory dot is shown.
- `hideClearButton` (*boolean*) - If true, hidew the clear button in the header.

## Outputs

- `dateChange` (*EventEmitter<any>*) 
- `iconSelect` (*EventEmitter<void>*) 
