# IDEAListComponent

## Selector

idea-list

## Inputs

- `data` (*(string | Label)[]*) - The list to manage.
- `labelElements` (*boolean*) - Whether the elements are labels or simple strings.
- `label` (*string*) - The label for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `searchPlaceholder` (*string*) - A placeholder for the searchbar.
- `noElementsFoundText` (*string*) - Text to show when there isn't a result.
- `noPreviewText` (*string*) - If true, show the string instead of the preview text.
- `placeholder` (*string*) - A placeholder for the field.
- `lines` (*string*) - Lines preferences for the item.
- `disabled` (*boolean*) - If true, the component is disabled.
- `obligatory` (*boolean*) - If true, the obligatory dot is shown.
- `numMaxElementsInPreview` (*number*) - How many elements to show in the preview before to generalize on the number.

## Outputs

- `change` (*EventEmitter<void>*) - On change event.
- `iconSelect` (*EventEmitter<void>*) - Icon select.
