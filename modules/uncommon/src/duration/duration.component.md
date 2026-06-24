# IDEADurationComponent

## Selector

idea-duration

## Inputs

- `default` (_number_) - The default number of seconds, to build the duration.
- `label` (_string_) - The label for the field.
- `icon` (_string_) - The icon (alternative to the label) for the field.
- `title` (_string_) - The title (hint) for the field.
- `disabled` (_boolean_) - If true, the component is disabled.
- `obligatory` (_boolean_) - If true, the obligatory dot is shown.
- `lines` (_string_) - Lines preferences for the item.
- `color` (_string_) - The color for the component.
- `hideSeconds` (_boolean_) - Whether to show or hide the seconds input.
- `shortLabels` (_boolean_) - Whether to show a shortened version of the labels.

## Outputs

- `set` (_number_) - On change event. It emits a number of seconds representing the duration.
