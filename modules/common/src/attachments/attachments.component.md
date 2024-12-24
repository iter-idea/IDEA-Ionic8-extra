# IDEAAttachmentsComponent

## Selector

idea-attachments

## Inputs

- `attachments` (*Attachment[]*) - The array of attachments to display and manage.
- `entityPath` (*string | string[]*) - The API path to the entity for which we want to manage the attachments.
- `acceptedFormats` (*string[]*) - The list of accepted formats.
- `multiple` (*boolean*) - Whether to accept multiple files as target for the browse function.
- `disabled` (*boolean*) - Whether we are viewing or editing the attachments.
- `color` (*string*) - The background color of the component.

## Outputs

- `download` (*EventEmitter<string>*) - Trigger to download a file by URL.
