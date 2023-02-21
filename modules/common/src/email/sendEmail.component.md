# IDEASendEmailComponent

## Selector

idea-send-email

## Inputs

- `email` (*EmailData*) - The content and receivers of the email.
- `attachments` (*string[]*) - Visual indicators of the attachments that will be sent.
- `variables` (*StringVariable[]*) - The variables the user can use for subject and content.
- `values` (*{ [variable: string]: string | number; }*) - A map of the values to substitute to the variables.
- `contacts` (*Suggestion[]*) - The suggested contacts for the email composer.
- `lines` (*string*) - Lines preferences for the items.

