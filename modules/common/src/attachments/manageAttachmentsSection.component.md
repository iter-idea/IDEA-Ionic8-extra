# IDEAManageAttachmentsSectionComponent

## Selector

idea-manage-attachments-section

## Inputs

- `section` (_AttachmentSection_) - The attachments section to manage.
- `entityPath` (_string | string[]_) - The API path to the entity for which we want to manage the attachments.
- `acceptedFormats` (_string[]_) - The list of accepted formats.
- `multiple` (_boolean_) - Whether to accept multiple files as target for the browse function.
- `lines` (_string_) - Lines preferences for the component.
- `color` (_string_) - The background color of the component.
- `downloadCallback` (_(url: string) => void_) - Trigger a callback in the parent component to download a file by URL.
