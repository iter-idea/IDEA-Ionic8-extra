# IDEACheckerComponent

## Selector

idea-checker

## Inputs

- `data` (_Check[]_) - The checks to show.
- `dataProvider` (_any_)
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
- `lines` (_string_) - Lines preferences for the item.
- `color` (_string_) - The color for the component.
- `disabled` (_boolean_) - If true, the component is disabled.
- `tappableWhenDisabled` (_boolean_) - If true, the field has a tappable effect when disabled.
- `obligatory` (_boolean_) - If true, the obligatory dot is shown.
- `sortData` (_boolean_) - If true, sort alphabetically the data.
- `numMaxElementsInPreview` (_number_) - How many elements to show in the preview before to generalize on the number.
- `showAvatars` (_boolean_) - Whether to show an avatar aside each element.
- `limitSelectionToNum` (_number_) - Limit the number of selectable elements to the value provided.
  Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
- `allowSelectDeselectAll` (_boolean_) - Whether to allow the select/deselect-all buttons.
- `category1` (_string_) - A pre-filter for the category1.
- `category2` (_string_) - A pre-filter for the category2.
- `showCategoriesFilters` (_boolean_) - Whether tho show the categories filters.

## Outputs

- `change` (_void_) - On change event.
- `iconSelect` (_void_) - Icon select.
