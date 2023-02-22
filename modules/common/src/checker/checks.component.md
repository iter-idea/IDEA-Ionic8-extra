# IDEAChecksComponent

## Selector

idea-checks

## Inputs

- `data` (*Check[]*) - It should be read only until the component closure.
- `sortData` (*boolean*) - If true, sort alphabetically the data (by name or, fallback, by value).
- `searchPlaceholder` (*string*) - A placeholder for the searchbar.
- `noElementsFoundText` (*string*) - The text to show in case no element is found after a search.
- `showAvatars` (*boolean*) - Whether to show an avatar aside each element.
- `limitSelectionToNum` (*number*) - Limit the number of selectable elements to the value provided.
Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
- `allowSelectDeselectAll` (*boolean*) - Whether to allow the select/deselect-all buttons.
- `category1` (*string*) - A pre-filter for the category1.
- `category2` (*string*) - A pre-filter for the category2.
- `showCategoriesFilters` (*boolean*) - Whether tho show the categories filters.

