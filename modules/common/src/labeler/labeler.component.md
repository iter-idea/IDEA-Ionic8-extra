# IDEALabelerComponent

A component for filling in an Label.

## Selector

idea-labeler

## Inputs

- `label` (*Label*) - The detail to highlight.
- `languages` (*Languages*) - The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
- `title` (*string*) - The optional title for the component.
- `textarea` (*boolean*) - Whether to display the label in textareas instead of text fields.
- `markdown` (*boolean*) - Whether the label supports markdown.
- `variables` (*(StringVariable | LabelVariable)[]*) - The variables the user can use for the label content.
- `disabled` (*boolean*) - If true, the component is disabled.
- `obligatory` (*boolean*) - If true, the label is validated on save.

