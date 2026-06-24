# IDEASuggestionsComponent

## Selector

idea-suggestions

## Inputs

- `data` (_Suggestion[]_) - The suggestions to show.
- `sortData` (_boolean_) - If true, sort the suggestions alphabetically.
- `searchPlaceholder` (_string_) - A placeholder for the searchbar.
- `noElementsFoundText` (_string_) - Text to show when there isn't a result.
- `allowUnlistedValues` (_boolean_) - If true, allows to select a new custom value (outside the suggestions).
- `allowUnlistedValuesPrefix` (_string_) - If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
- `hideIdFromUI` (_boolean_) - If true, doesn't show the id in the UI.
- `hideClearButton` (_boolean_) - If true, doesn't show the clear button in the header.
- `mustChoose` (_boolean_) - If true, the user doesn't have the option to cancel the selection: an option must be chosen.
- `category1` (_string_) - A pre-filter for the category1.
- `category2` (_string_) - A pre-filter for the category2.
- `showCategoriesFilters` (_boolean_) - Whether tho show the categories filters.
- `numPerPage` (_number_) - An arbitrary number of elements to show in each page; suggested: a multiple of 2, 3 and 4 (good for any UI size).
