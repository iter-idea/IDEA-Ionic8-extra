# IDEAInlineCheckerComponent

## Selector

idea-inline-checker

## Inputs

- `data` (*Check[]*) - The options to show and sort.
- `label` (*string*) - The label for the component.
- `labelPlacement` (*string*) - The label placement.
- `placeholder` (*string*) - The placeholder for the component.
- `searchPlaceholder` (*string*) - A placeholder for the searchbar.
- `noElementsFoundText` (*string*) - The text to show in case no element is found after a search.
- `lines` (*string*) - The lines of the component.
- `color` (*string*) - The color of the component.
- `disabled` (*boolean*) - Whether the component is disabled.
- `reorder` (*boolean*) - Whether the checklist is reorderable or not.
- `sortData` (*boolean*) - If true, sort the checklist alphabetically.
- `numMaxElementsInPreview` (*number*) - How many elements to show in the preview before to generalize on the number.
- `previewTextKey` (*string*) - The translation key to get the preview text; it has a `num` variable available.
- `limitSelectionToNum` (*number*) - Limit the number of selectable elements to the value provided.
If this number is forced to `1`, the component turns into a single selection.
- `withSearchbar` (*boolean*) - If true, render the child component centered in the screen and show a header with a searchbar.

## Outputs

- `change` (*EventEmitter<void>*) - On change event.
