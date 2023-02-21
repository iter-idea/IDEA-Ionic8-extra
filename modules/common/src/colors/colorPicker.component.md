# IDEAColorPickerComponent

Pick a color from a defined set.

## Selector

idea-color-picker

## Inputs

- `colors` (*Color[]*) - The pickable colors.
- `current` (*string*) - The current color.
- `label` (*string*) - The label for the field.
- `placeholder` (*string*) - A placeholder for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `disabled` (*boolean*) - If true, the component is disabled.
- `obligatory` (*boolean*) - If true, the obligatory dot is shown.
- `lines` (*string*) - Lines preferences for the item.

## Outputs

- `select` (*EventEmitter<string>*) - On select event.
- `iconSelect` (*EventEmitter<void>*) - Icon select.
