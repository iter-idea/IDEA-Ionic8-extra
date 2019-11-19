# IDEA Ionic extra

IDEA's extra components and services built on Ionic (4+).

_The old version, compatible with Ionic 3, [is available here](https://github.com/uatisdeproblem/IDEA-Ionic3-extra)_.

## Components

- IDEA Account
- Address
- Attachments
- Auth flow (sign in, sign up, etc.) through Cognito
- Calendar & DateTime picker
- Checker
- Contacts
- Custom fields
- Downloader
- Duration
- Echo
- Language picker
- List
- Markdown Editor (MDE)
- Offline
- Resource Center
- Select
- Send email
- Signature
- Team & memberships management (IDEA's pool)

## Services

- AWSAPI service
- Error reporting service
- External browser service
- Loading service
- Message service
- Tin can service
- Zebra Reader service (barcode)
- (browser's) Cached resources service

## Requirements

Every component requires the `ngx-translate` module and the `i18n` translation folder, with at least
the `en.json` translation; a sample of the latter is stored in the `assets/i18n` folder.

Each component may **require** one or more folders of the `assets` directory,
including `icons`, `libs` and `configs`; see more in any recent IDEA's project.

## How to use

**To use** by importing the released package in the components folder of the desired project.
Since it's (it should be) a read-only folder, you can safely copy/paste **updated versions**.

_In the future_ it can be thought as an npm package, so far it doesn't look feasible.
