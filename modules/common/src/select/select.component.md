# IDEASelectComponent

## Selector

idea-select

## Inputs

- `data` (_Suggestion[]_) - The suggestions to show.
- `dataProvider` (_any_)
- `label` (_string_) - The label for the field.
- `icon` (_string_) - The icon for the field.
- `iconColor` (_string_) - The color of the icon.
- `placeholder` (_string_) - A placeholder for the field.
- `searchPlaceholder` (_string_) - A placeholder for the searchbar.
- `noElementsFoundText` (_string_) - Text to show when there isn't a result.
- `disabled` (_boolean_) - If true, the component is disabled.
- `tappableWhenDisabled` (_boolean_) - If true, the field has a tappable effect when disabled.
- `obligatory` (_boolean_) - If true, the obligatory dot is shown.
- `lines` (_string_) - Lines preferences for the item.
- `color` (_string_) - The color for the component.
- `allowUnlistedValues` (_boolean_) - If true, allows to select a new custom value (outside the suggestions).
- `allowUnlistedValuesPrefix` (_string_) - If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
- `sortData` (_boolean_) - If true, sort the suggestions alphabetically.
- `clearValueAfterSelection` (_boolean_) - If true, clear the value of the field after a selection.
- `hideIdFromUI` (_boolean_) - If true, doesn't show the id in the UI.
- `hideClearButton` (_boolean_) - If true, doesn't show the clear button in the header.
- `mustChoose` (_boolean_) - If true, the user doesn't have the option to cancel the selection: an option must be chosen.
- `category1` (_string_) - A pre-filter for the category1.
- `category2` (_string_) - A pre-filter for the category2.
- `showCategoriesFilters` (_boolean_) - Whether tho show the categories filters in the suggestions component.
- `avoidAutoSelection` (_boolean_) - If true, doesn't let the auto-selection in case there's only one element as possible selection.

## Outputs

- `select` (_Suggestion_) - On select event.
- `iconSelect` (_void_) - Icon select.
- `selectWhenDisabled` (_void_) - On select (with the field disabled) event.
