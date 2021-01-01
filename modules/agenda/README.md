# IDEA Ionic extra ≫ Agenda

Agenda (calendar) based on angular-calendar.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/agenda).

## To install

```
npm i --save @idea-ionic/agenda
```

_Be sure to install all the requested peer dependencies._

Then, add this import into the `global.scss` file, after the import on the top of the page:

```
/* Agenda (IDEA) */
@import '../node_modules/angular-calendar/css/angular-calendar.css';
```

To make sure the translations are loaded into the project:

- in the project's `assets/configs/idea-config.js` file, add the string `'agenda'` to the array `window.IDEA_IONIC_MODULES`;
- copy the `i18n/agenda` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

## Components

- Agenda

## Services

- Calendars
