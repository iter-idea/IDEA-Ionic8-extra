# IDEAAuthPasswordFieldComponent

A password field of the pages of `IDEAAuthRoutes`, with the button to show or hide what's typed.
Its label is the page's own, tied through `labelledBy`.

## Selector

idea-auth-password-field

## Inputs

- `labelledBy` (_string_) - The id of the element labelling the field.
- `describedBy` (_string_) - The ids of the elements describing the field (e.g. its requirements), if any.
- `autocomplete` (_'current-password' | 'new-password'_) - Whether the browser should suggest the saved password, or a new one.
- `value` (_string_) - The password typed.

## Outputs

- `enter` (_void_) - Trigger when the user presses Enter in the field.
