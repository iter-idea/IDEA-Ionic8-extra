# IDEAAttachmentsComponent

## Selector

idea-attachments

## Inputs

- `attachments` (_Attachment[]_) - The array of attachments to display and manage.
- `entityPath` (_string | string[]_) - The API path to the entity for which we want to manage the attachments.
- `acceptedFormats` (_string[]_) - The list of accepted formats.
- `multiple` (_boolean_) - Whether to accept multiple files as target for the browse function.
- `disabled` (_boolean_) - Whether we are viewing or editing the attachments.
- `color` (_string_) - The background color of the component.

## Outputs

- `download` (_string_) - Trigger to download a file by URL.
