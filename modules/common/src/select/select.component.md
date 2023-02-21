# IDEASelectComponent

## Selector

idea-select

## Inputs

- `data` (*Suggestion[]*) - The suggestions to show.
- `dataProvider` (*any*) 
- `label` (*string*) - The label for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `placeholder` (*string*) - A placeholder for the field.
- `searchPlaceholder` (*string*) - A placeholder for the searchbar.
- `noElementsFoundText` (*string*) - Text to show when there isn't a result.
- `disabled` (*boolean*) - If true, the component is disabled.
- `tappableWhenDisabled` (*boolean*) - If true, the field has a tappable effect when disabled.
- `obligatory` (*boolean*) - If true, the obligatory dot is shown.
- `lines` (*string*) - Lines preferences for the item.
- `allowUnlistedValues` (*boolean*) - If true, allows to select a new custom value (outside the suggestions).
- `allowUnlistedValuesPrefix` (*string*) - If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
- `sortData` (*boolean*) - If true, sort the suggestions alphabetically.
- `clearValueAfterSelection` (*boolean*) - If true, clear the value of the field after a selection.
- `hideIdFromUI` (*boolean*) - If true, doesn't show the id in the UI.
- `hideClearButton` (*boolean*) - If true, doesn't show the clear button in the header.
- `mustChoose` (*boolean*) - If true, the user doesn't have the option to cancel the selection: an option must be chosen.
- `category1` (*string*) - A pre-filter for the category1.
- `category2` (*string*) - A pre-filter for the category2.
- `showCategoriesFilters` (*boolean*) - Whether tho show the categories filters in the suggestions component.
- `avoidAutoSelection` (*boolean*) - If true, doesn't let the auto-selection in case there's only one element as possible selection.

## Outputs

- `select` (*EventEmitter<Suggestion>*) - On select event.
- `iconSelect` (*EventEmitter<void>*) - Icon select.
- `selectWhenDisabled` (*EventEmitter<void>*) - On select (with the field disabled) event.
