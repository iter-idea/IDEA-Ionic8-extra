# IDEA Ionic extra ≫ Agenda

Agenda (calendar) based on angular-calendar.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/agenda).

## To install

```
npm i --save @idea-ionic/agenda
```

_Be sure to install all the requested peer dependencies._

Then, add this imports into the `global.scss` file, after the import on the top of the page:

```
@import '../node_modules/angular-calendar/css/angular-calendar.css';
@import '../node_modules/@idea-ionic/agenda/css/global.scss';
```

To make sure the translations are loaded into the project:

- add a reference to this module in the environment variable `idea.ionicExtraModules` (see `environment.ts`);
- copy the `i18n/agenda` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

Make sure that there is a path (tsconfig file) pointing to `@env` which contains the environment files (Angular standard).
Finally, add in the environments desired the variables you find in the `environment.ts` file of this module.

## Components

- Agenda

## Services

- Calendars
