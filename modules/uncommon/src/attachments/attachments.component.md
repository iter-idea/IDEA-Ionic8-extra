# IDEAOldAttachmentsComponent

## Selector

idea-old-attachments

## Inputs

- `team` (_string_) - The team from which we want to load the resources. Default: try to guess current team.
- `pathResource` (_string[]_) - The path to the online API resource, as an array. Don't include the team. E.g. `['entities', entityId]`.
- `attachments` (_Attachment[] | null_) - The array in which we want to add/remove attachments.
- `editMode` (_boolean_) - Regulate the mode (view/edit).
- `errors` (_Set<string>_) - Show errors as reported from the parent component.
- `lines` (_string_) - The lines attribute of the item.
