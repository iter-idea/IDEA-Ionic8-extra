# IDEAManageAttachmentsSectionComponent

## Selector

idea-manage-attachments-section

## Inputs

- `section` (*AttachmentSection*) - The attachments section to manage.
- `entityPath` (*string | string[]*) - The API path to the entity for which we want to manage the attachments.
- `acceptedFormats` (*string[]*) - The list of accepted formats.
- `multiple` (*boolean*) - Whether to accept multiple files as target for the browse function.
- `lines` (*string*) - Lines preferences for the component.
- `color` (*string*) - The background color of the component.
- `downloadCallback` (*(url: string) => void*) - Trigger a callback in the parent component to download a file by URL.

