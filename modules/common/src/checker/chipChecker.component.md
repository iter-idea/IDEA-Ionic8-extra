# IDEAChipCheckerComponent

## Selector

idea-chip-checker

## Inputs

- `data` (_Check[]_) - The checks to show.
- `label` (_string_) - The label for the field.
- `icon` (_string_) - The icon for the field.
- `iconColor` (_string_) - The color of the icon.
- `searchPlaceholder` (_string_) - A placeholder for the searchbar.
- `noPreviewText` (_string_) - If true, show the string instead of the preview text.
- `noElementsFoundText` (_string_) - The text to show in case no element is found after a search.
- `noneEqualsAll` (_boolean_) - If true, no elements selected equals all the elements selected.
- `noneText` (_string_) - If no element is selected, set this custom text.
- `allText` (_string_) - If all the elements are selected, set this custom text.
- `previewTextKey` (_string_) - The translation key to get the preview text; it has a `num` variable available.
- `color` (_string_) - The color for the component.
- `inactiveColor` (_string_) - The color for the inactive component.
- `disabled` (_boolean_) - If true, the component is disabled.
- `sortData` (_boolean_) - If true, sort alphabetically the data.
- `alwaysShowValue` (_boolean_) - Whether to always show the `value`, even when the `name` is set.
- `numMaxElementsInPreview` (_number_) - How many elements to show in the preview before to generalize on the number.
- `limitSelectionToNum` (_number_) - Limit the number of selectable elements to the value provided.
- `allowSelectDeselectAll` (_boolean_) - Whether to allow the select/deselect-all buttons.
- `resetButton` (_boolean_) - Whether to show the reset button.
- `showAsPopover` (_boolean_) - Whether to show the check list as a popover.
  If false, we show a centered modal.

## Outputs

- `change` (_string[]_) - On change event.
