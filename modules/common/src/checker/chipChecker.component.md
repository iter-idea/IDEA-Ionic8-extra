# IDEAChipCheckerComponent

## Selector

idea-chip-checker

## Inputs

- `data` (*Check[]*) - The checks to show.
- `label` (*string*) - The label for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `searchPlaceholder` (*string*) - A placeholder for the searchbar.
- `noPreviewText` (*string*) - If true, show the string instead of the preview text.
- `noElementsFoundText` (*string*) - The text to show in case no element is found after a search.
- `noneEqualsAll` (*boolean*) - If true, no elements selected equals all the elements selected.
- `noneText` (*string*) - If no element is selected, set this custom text.
- `allText` (*string*) - If all the elements are selected, set this custom text.
- `color` (*string*) - The color for the component.
- `inactiveColor` (*string*) - The color for the inactive component.
- `disabled` (*boolean*) - If true, the component is disabled.
- `sortData` (*boolean*) - If true, sort alphabetically the data.
- `numMaxElementsInPreview` (*number*) - How many elements to show in the preview before to generalize on the number.
- `limitSelectionToNum` (*number*) - Limit the number of selectable elements to the value provided.
- `allowSelectDeselectAll` (*boolean*) - Whether to allow the select/deselect-all buttons.
- `resetButton` (*boolean*) - Whether to show the reset button.
- `showAsPopover` (*boolean*) - Whether to show the check list as a popover.
If false, we show a centered modal.

## Outputs

- `change` (*EventEmitter<void>*) - On change event.
