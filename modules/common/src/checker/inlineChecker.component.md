# IDEAInlineCheckerComponent

## Selector

idea-inline-checker

## Inputs

- `data` (_Check[]_) - The options to show and sort.
- `label` (_string_) - The label for the component.
- `labelPlacement` (_string_) - The label placement.
- `placeholder` (_string_) - The placeholder for the component.
- `searchPlaceholder` (_string_) - A placeholder for the searchbar.
- `noElementsFoundText` (_string_) - The text to show in case no element is found after a search.
- `lines` (_string_) - The lines of the component.
- `color` (_string_) - The color of the component.
- `disabled` (_boolean_) - Whether the component is disabled.
- `reorder` (_boolean_) - Whether the checklist is reorderable or not.
- `sortData` (_boolean_) - If true, sort the checklist alphabetically.
- `numMaxElementsInPreview` (_number_) - How many elements to show in the preview before to generalize on the number.
- `previewTextKey` (_string_) - The translation key to get the preview text; it has a `num` variable available.
- `limitSelectionToNum` (_number_) - Limit the number of selectable elements to the value provided.
  If this number is forced to `1`, the component turns into a single selection.
- `withSearchbar` (_boolean_) - If true, render the child component centered in the screen and show a header with a searchbar.

## Outputs

- `change` (_void_) - On change event.
