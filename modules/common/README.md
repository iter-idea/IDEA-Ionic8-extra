# IDEA Ionic extra ≫ Common

Core components and services used everywhere in IDEA's apps.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/common).

## To install

```
npm i --save @idea-ionic/common
```

_Be sure to install all the requested peer dependencies._

Then, add this imports into the `global.scss` file, after the import on the top of the page:

```
@import '~@idea-ionic/common/css/global.scss';
```

To make sure the translations are loaded into the project:

- add a reference to this module in the environment variable `idea.ionicExtraModules` (see `environment.ts`);
- copy the `i18n/common` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

Make sure that there is a path (tsconfig file) pointing to `@env` which contains the environment files (Angular standard).
Finally, add in the environments desired the variables you find in the `environment.ts` file of this module.

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
- Sentiment analysis
- Signature
- Time interval
- Translations
- User avatar

## Services

- AWSAPI service
- AWSAPI socket service
- (browser's) Cached resources service
- Error reporting service
- Loading service
- Message service
- Push notifications service
- Storage service
- Tin can service
- Translation service
- Variables highlight (pipe)
