# IDEASendEmailComponent

## Selector

idea-send-email

## Inputs

- `email` (_EmailData_) - The content and receivers of the email.
- `attachments` (_string[]_) - Visual indicators of the attachments that will be sent.
- `variables` (_StringVariable[]_) - The variables the user can use for subject and content.
- `values` (_{ [variable: string]: string | number; }_) - A map of the values to substitute to the variables.
- `contacts` (_Suggestion[]_) - The suggested contacts for the email composer.
- `lines` (_string_) - Lines preferences for the items.
- `disableChangeOfAddresses` (_boolean_) - Whether we want to prevent the user to change the addresses pre-set.
