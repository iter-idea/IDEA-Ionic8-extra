# IDEA Ionic extra ≫ Editor

HTML Editor.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/editor).

## To install

```
npm i --save @idea-ionic/editor
```

_Be sure to install all the requested peer dependencies._

Then, add this imports into the `global.scss` file, after the import on the top of the page:

```
@use '@idea-ionic/editor/css/global.scss' as idea-ionic-editor;
```

To make sure the translations are loaded into the project:

- add a reference to this module in the environment variable `idea.ionicExtraModules` (see `environment.ts`);
- copy the `i18n/editor` folder (you can filter the languages you need) of the module in the project's `assets/i18n` folder.

## List of available SCSS variables for customisation

```scss
:root {
  --idea-html-editor-background-color: var(--ion-color-light);
  --idea-html-editor-border-color: var(--ion-color-light-shade);
  --idea-html-editor-color: var(--ion-color-light-contrast);
  --idea-html-editor-toolbar-background-color: var(--ion-color-light);
  --idea-html-editor-toolbar-color: var(--ion-color-light-contrast);
  --idea-html-editor-toolbar-border-color: var(--ion-color-light);
  --idea-html-editor-button-background-color: var(--ion-color-light);
  --idea-html-editor-button-border-color: var(--ion-color-light);
  --idea-html-editor-button-color: var(--ion-color-light-contrast);
  --idea-html-editor-button-focused: var(--ion-color-medium);
  --idea-html-editor-button-selected: var(--ion-color-medium-tint);

  --idea-html-editor-view-margin: 0;
  --idea-html-editor-view-padding: 20px;
  --idea-html-editor-view-background-color: var(--ion-color-white);
  --idea-html-editor-view-color: var(--ion-color-white-contrast);
  --idea-html-editor-view-box-shadow: none;
  --idea-html-editor-view-border-width: 1px;
  --idea-html-editor-view-border-color: var(--ion-border-color);
  --idea-html-editor-view-border-radius: 0;
}
```
