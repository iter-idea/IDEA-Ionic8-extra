# IDEALabelerComponent

A component for filling in an Label.

## Selector

idea-labeler

## Inputs

- `label` (_Label_) - The detail to highlight.
- `languages` (_Languages_) - The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
- `title` (_string_) - The optional title for the component.
- `textarea` (_boolean_) - Whether to display the label in textareas instead of text fields.
- `markdown` (_boolean_) - Whether the label supports markdown.
- `variables` (_(StringVariable | LabelVariable)[]_) - The variables the user can use for the label content.
- `disabled` (_boolean_) - If true, the component is disabled.
- `obligatory` (_boolean_) - If true, the label is validated on save.
