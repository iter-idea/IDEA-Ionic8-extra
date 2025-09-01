# IDEOldAttachmentsComponent

## Selector

idea-old-attachments

## Inputs

- `team` (*string*) - The team from which we want to load the resources. Default: try to guess current team.
- `pathResource` (*string[]*) - The path to the online API resource, as an array. Don't include the team. E.g. `['entities', entityId]`.
- `attachments` (*Attachment[]*) - The array in which we want to add/remove attachments.
- `editMode` (*boolean*) - Regulate the mode (view/edit).
- `errors` (*Set<string>*) - Show errors as reported from the parent component.
- `lines` (*string*) - The lines attribute of the item.

