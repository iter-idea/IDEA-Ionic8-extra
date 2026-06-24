# IDEAChecksComponent

## Selector

idea-checks

## Inputs

- `data` (_Check[]_) - It should be read only until the component closure.
- `sortData` (_boolean_) - If true, sort alphabetically the data (by name or, fallback, by value).
- `searchPlaceholder` (_string_) - A placeholder for the searchbar.
- `noElementsFoundText` (_string_) - The text to show in case no element is found after a search.
- `showAvatars` (_boolean_) - Whether to show an avatar aside each element.
- `limitSelectionToNum` (_number_) - Limit the number of selectable elements to the value provided.
  Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
- `allowSelectDeselectAll` (_boolean_) - Whether to allow the select/deselect-all buttons.
- `category1` (_string_) - A pre-filter for the category1.
- `category2` (_string_) - A pre-filter for the category2.
- `showCategoriesFilters` (_boolean_) - Whether tho show the categories filters.
- `previewTextKey` (_string_) - The translation key to get the preview text; it has a `num` variable available.
