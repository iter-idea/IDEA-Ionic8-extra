# IDEADurationComponent

## Selector

idea-duration

## Inputs

- `default` (*number*) - The default number of seconds, to build the duration.
- `label` (*string*) - The label for the field.
- `icon` (*string*) - The icon (alternative to the label) for the field.
- `title` (*string*) - The title (hint) for the field.
- `disabled` (*boolean*) - If true, the component is disabled.
- `obligatory` (*boolean*) - If true, the obligatory dot is shown.
- `lines` (*string*) - Lines preferences for the item.
- `hideSeconds` (*boolean*) - Whether to show or hide the seconds input.
- `shortLabels` (*boolean*) - Whether to show a shortened version of the labels.

## Outputs

- `set` (*EventEmitter<number>*) - On change event. It emits a number of seconds representing the duration.
