# IDEASuggestionsComponent

## Selector

idea-suggestions

## Inputs

- `data` (*Suggestion[]*) - The suggestions to show.
- `sortData` (*boolean*) - If true, sort the suggestions alphabetically.
- `searchPlaceholder` (*string*) - A placeholder for the searchbar.
- `noElementsFoundText` (*string*) - Text to show when there isn't a result.
- `allowUnlistedValues` (*boolean*) - If true, allows to select a new custom value (outside the suggestions).
- `allowUnlistedValuesPrefix` (*string*) - If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
- `hideIdFromUI` (*boolean*) - If true, doesn't show the id in the UI.
- `hideClearButton` (*boolean*) - If true, doesn't show the clear button in the header.
- `mustChoose` (*boolean*) - If true, the user doesn't have the option to cancel the selection: an option must be chosen.
- `category1` (*string*) - A pre-filter for the category1.
- `category2` (*string*) - A pre-filter for the category2.
- `showCategoriesFilters` (*boolean*) - Whether tho show the categories filters.
- `numPerPage` (*number*) - An arbitrary number of elements to show in each page; suggested: a multiple of 2, 3 and 4 (good for any UI size).

