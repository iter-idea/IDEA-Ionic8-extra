# IDEA Ionic extra

IDEA's extra components and services built on Ionic (5+).

_The old version, compatible with Ionic 3, [is available here](https://github.com/uatisdeproblem/IDEA-Ionic3-extra)_.

## Components

- IDEA Account
- Address
- Announcements
- Attachments
- Auth flow (sign in, sign up, etc.) through Cognito
- Calendar & DateTime picker
- Checker
- Contacts
- Custom fields (block, sections, fields)
- Downloader
- Duration
- Echo
- Email (configure & send)
- Icons (Ionicons)
- Labeler
- List
- Map (Google Maps)
- Markdown Editor (MDE)
- Offline (delta)
- Resource Center
- Select
- Signature
- Subscriptions, Plans & Limits
- Team & memberships management (IDEA's pool)
- Time interval
- Translations

## Services

- AWSAPI service
- (browser's) Cached resources service
- DataWedge-compatible devices' reader service (barcode)
- Error reporting service
- External browser service
- Loading service
- Message service
- Push notifications service
- Tin can service
- Translation service

## Requirements

Every component requires the `IDEATranslationsService` module and the `i18n` translations folder (with subfolders),
with at least the `en.json` translation; a sample of the latter is stored in the `assets/i18n` folder.

Each component may **require** one or more folders of the `assets` directory,
including `icons`, `images` and `configs`; see more in any recent IDEA's project.

## How to use

**To use** by importing the released package in the components folder of the desired project.
Since it's (it should be) a read-only folder, you can safely copy/paste **updated versions**.

_In the future_ it can be thought as an npm package, so far it doesn't look feasible.
