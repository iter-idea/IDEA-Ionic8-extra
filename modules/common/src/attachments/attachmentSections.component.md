# IDEAAttachmentSectionsComponent

## Selector

idea-attachment-sections

## Inputs

- `attachmentSections` (*AttachmentSections*) - The attachment sections to display and manage.
- `entityPath` (*string | string[]*) - The API path to the entity for which we want to manage the attachments.
- `acceptedFormats` (*string[]*) - The list of accepted formats.
- `multiple` (*boolean*) - Whether to accept multiple files as target for the browse function.
- `disabled` (*boolean*) - Whether the component is enabled or not.
- `lines` (*string*) - Lines preferences for the component.
- `color` (*string*) - The background color of the component.

## Outputs

- `download` (*EventEmitter<string>*) - Trigger to download a file by URL.
