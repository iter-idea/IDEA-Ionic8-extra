# IDEALabelComponent

Manage the content of a Label.

## Selector

idea-label

## Inputs

- `content` (_Label_) - The label to manage.
  Note: the name is set to not overlap with IDEA's components typical use of the attribute `label`.
- `languages` (_Languages_) - The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
- `textarea` (_boolean_) - Whether to display the label in textareas instead of text fields.
- `markdown` (_boolean_) - Whether the label supports markdown.
- `variables` (_StringVariable[]_) - The variables the user can use in the label.
- `label` (_string_) - The title (label) for the field.
- `icon` (_string_) - The icon for the field.
- `iconColor` (_string_) - The color of the icon.
- `placeholder` (_string_) - A placeholder for the field.
- `lines` (_string_) - Lines preferences for the item.
- `color` (_string_) - The color for the component.
- `disabled` (_boolean_) - If true, the component is disabled.
- `obligatory` (_boolean_) - If true, the label is validated on save.

## Outputs

- `change` (_void_)
- `iconSelect` (_void_)
