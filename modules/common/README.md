# IDEA Ionic extra ≫ Common

Core components and services used everywhere in IDEA's apps.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/common).

## To install

```
npm i --save @idea-ionic/common
```

_Be sure to install all the requested peer dependencies._

To make sure the translations are loaded into the project:

- in the project's `assets/configs/idea-config.js` file, add the string `'common'` to the array `window.IDEA_IONIC_MODULES`;
- copy the `i18n/common` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

## Components

- Action Sheet
- Address
- Announcements
- Checker
- Colors picker
- Contacts
- Custom fields (block, sections, fields)
- DateTime picker
- Duration
- Echo
- Email (configure & send)
- Icons (Ionicons)
- Labeler
- List
- Markdown Editor (MDE)
- Offline (delta)
- PDF Template
- Select
- Signature
- Time interval
- Translations

## Services

- AWSAPI service
- (browser's) Cached resources service
- DataWedge-compatible devices' reader service (barcode)
- Error reporting service
- Loading service
- Message service
- Push notifications service
- Tin can service
- Translation service
- Variables highlight (pipe)
