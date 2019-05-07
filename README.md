# IDEA Ionic extra

IDEA's extra components and services built on Ionic (4+).

*The old version, compatible with Ionic 3, [is available here](https://github.com/uatisdeproblem/IDEA-Ionic3-extra)*.

## Includes

- Auth flow (sign in, sign up, etc.) through Cognito
- Select
- Checker
- Custom fields
- Tin can service
- External browser service
- AWSAPI service
- Loading service
- Message service
- Error reporting service

## Requirements

Every component requires the `ngx-translate` module and the `i18n` translation folder, with at least 
the `en.json` translation; a sample of the latter is stored in the `assets/i18n` folder.

Each component may **require** one or more folders of the `assets` directory, 
including `icons`, `libs` and `configs`; see more in a random recent IDEA's project.

## How to use

**To use** by importing the released package in the components folder of the desired project.  
Since it's (it should be) a read-only folder, you can safely copy/paste **updated versions**.

*In the future* it can be thought as an npm package, so far it doesn't look feasible.