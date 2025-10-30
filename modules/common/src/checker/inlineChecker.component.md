# IDEAInlineCheckerComponent

## Selector

idea-inline-checker

## Inputs

- `data` (*Check[]*) - The options to show.
- `label` (*string*) - The label for the component.
- `labelPlacement` (*string*) - The label placement.
- `placeholder` (*string*) - The placeholder for the component.
- `lines` (*string*) - The lines of the component.
- `color` (*string*) - The color of the component.
- `disabled` (*boolean*) - Whether the component is disabled.
- `reorder` (*boolean*) - Whether the checklist is reorderable or not.
- `sortData` (*boolean*) - If true, sort the checklist alphabetically.
- `numMaxElementsInPreview` (*number*) - How many elements to show in the preview before to generalize on the number.
- `previewTextKey` (*string*) - The translation key to get the preview text; it has a `num` variable available.

## Outputs

- `change` (*EventEmitter<void>*) - On change event.
