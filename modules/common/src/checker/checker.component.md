# IDEACheckerComponent

## Selector

idea-checker

## Inputs

- `data` (*Check[]*) - The checks to show.
- `dataProvider` (*any*) 
- `label` (*string*) - The label for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `searchPlaceholder` (*string*) - A placeholder for the searchbar.
- `noPreviewText` (*string*) - If true, show the string instead of the preview text.
- `noElementsFoundText` (*string*) - The text to show in case no element is found after a search.
- `noneEqualsAll` (*boolean*) - If true, no elements selected equals all the elements selected.
- `noneText` (*string*) - If no element is selected, set this custom text.
- `allText` (*string*) - If all the elements are selected, set this custom text.
- `previewTextKey` (*string*) - The translation key to get the preview text; it has a `num` variable available.
- `lines` (*string*) - Lines preferences for the item.
- `color` (*string*) - The color for the component.
- `disabled` (*boolean*) - If true, the component is disabled.
- `tappableWhenDisabled` (*boolean*) - If true, the field has a tappable effect when disabled.
- `obligatory` (*boolean*) - If true, the obligatory dot is shown.
- `sortData` (*boolean*) - If true, sort alphabetically the data.
- `numMaxElementsInPreview` (*number*) - How many elements to show in the preview before to generalize on the number.
- `showAvatars` (*boolean*) - Whether to show an avatar aside each element.
- `limitSelectionToNum` (*number*) - Limit the number of selectable elements to the value provided.
Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
- `allowSelectDeselectAll` (*boolean*) - Whether to allow the select/deselect-all buttons.
- `category1` (*string*) - A pre-filter for the category1.
- `category2` (*string*) - A pre-filter for the category2.
- `showCategoriesFilters` (*boolean*) - Whether tho show the categories filters.

## Outputs

- `change` (*EventEmitter<void>*) - On change event.
- `iconSelect` (*EventEmitter<void>*) - Icon select.
