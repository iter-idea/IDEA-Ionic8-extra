# IDEA Ionic extra ≫ Editor

HTML Editor, on [Tiptap](https://tiptap.dev): formatted text that holds only what its profile allows (`basic`, the default,
`rich` or `full`), whatever is loaded or pasted. Its inputs: [the component](src/htmlEditor.component.md).

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

## Security

What is loaded, pasted, given back and shown goes through the editor's own sanitizer (DOMPurify, with an allow-list per
profile): no script, event handler, style, form, frame or SVG; links only to the web, an email or a shared folder
(`https:`, `http:`, `mailto:`, `file:`), opening in a new tab with `rel="noopener noreferrer"`; images only in the text
(PNG, JPEG, GIF or WebP as base64), never from a server. `sanitizeIDEAHTMLEditorContent(html, profile)` gives the same
result for a text shown elsewhere.

## Styles

The component has no styles of its own: they're in `css/global.scss`, which the app imports. Each app themes it with
the `--idea-html-editor-*` variables (below), and can go further with CSS on its classes:
`.ideaHtmlEditorToolbar`, `.ideaHtmlEditorGroup`, `.ideaHtmlEditorButton` (`.active` when pressed),
`.ideaHtmlEditorSelect`, `.ideaHtmlEditorContent` (the box of the text), `.ProseMirror` (the text being edited) and
`div.view` (the text shown). The text takes its font from the page: a page that shows it elsewhere gives `.ProseMirror`
the same typography, so that it's edited as it will show.

## Migrating from 8.15

- The default profile is `basic`: an editor that should keep the colours, fonts, alignments, images, tables or links of
  its texts needs `profile="rich"`, or `profile="full"` for the whole toolbar it had.
- `@kolkov/angular-editor` and `docs-soap` are no longer dependencies: remove their `overrides` from the app's
  `package.json`.
- The toolbar and the content have new classes: the app's CSS on `.angular-editor-*` no longer applies. The size of the
  text area is `--idea-html-editor-min-height` (default `50vh`) and `--idea-html-editor-max-height` (the text scrolls
  under the toolbar).
- Copy the new texts of `i18n/editor` into the app.

## List of available SCSS variables for customisation

```scss
:root {
  --idea-html-editor-background-color: var(--ion-color-light);
  --idea-html-editor-border-color: var(--ion-color-light-shade);
  --idea-html-editor-color: var(--ion-color-light-contrast);
  --idea-html-editor-focus-color: var(--ion-color-primary);
  --idea-html-editor-placeholder-color: var(--ion-color-medium);
  --idea-html-editor-min-height: 50vh;
  --idea-html-editor-max-height: none;
  --idea-html-editor-padding: 8px 12px 16px;
  --idea-html-editor-border-radius: 0;
  --idea-html-editor-toolbar-background-color: var(--ion-color-light);
  --idea-html-editor-toolbar-color: var(--ion-color-light-contrast);
  --idea-html-editor-toolbar-border-color: var(--ion-color-light);
  --idea-html-editor-button-background-color: var(--ion-color-light);
  --idea-html-editor-button-border-color: var(--ion-color-light);
  --idea-html-editor-button-color: var(--ion-color-light-contrast);
  --idea-html-editor-button-focused: var(--ion-color-medium);
  --idea-html-editor-button-selected: var(--ion-color-medium-tint);
  --idea-html-editor-button-selected-color: var(--idea-html-editor-button-color);

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
