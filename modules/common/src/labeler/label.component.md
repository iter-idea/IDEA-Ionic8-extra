# IDEALabelComponent

Manage the content of a Label.

## Selector

idea-label

## Inputs

- `content` (*Label*) - The label to manage.
Note: the name is set to not overlap with IDEA's components typical use of the attribute `label`.
- `languages` (*Languages*) - The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
- `textarea` (*boolean*) - Whether to display the label in textareas instead of text fields.
- `markdown` (*boolean*) - Whether the label supports markdown.
- `variables` (*StringVariable[]*) - The variables the user can use in the label.
- `label` (*string*) - The title (label) for the field.
- `icon` (*string*) - The icon for the field.
- `iconColor` (*string*) - The color of the icon.
- `placeholder` (*string*) - A placeholder for the field.
- `lines` (*string*) - Lines preferences for the item.
- `color` (*string*) - The color for the component.
- `disabled` (*boolean*) - If true, the component is disabled.
- `obligatory` (*boolean*) - If true, the label is validated on save.

## Outputs

- `change` (*EventEmitter<void>*) 
- `iconSelect` (*EventEmitter<void>*) 
