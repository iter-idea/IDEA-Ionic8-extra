# IDEAHTMLEditorComponent

An editor of formatted text, on Tiptap (ProseMirror): it edits and shows HTML, and holds only what its profile
allows, whatever is loaded or pasted. Security, styles and the migration from 8.15 are in the module's README.

## Selector

idea-html-editor

## Inputs

- `editMode` (_boolean_) - Whether the parent page is in editMode or not (simplified).
- `content` (_string_) - The HTML content, two-way (`[(content)]`): `contentChange` comes only when the user changes the text, never when
  it's loaded; an empty text is `''`.
- `profile` (_IDEAHTMLEditorProfile_) - What the text can hold, and the toolbar. `basic` (the default): paragraphs, bold, italic, underline, bulleted and
  numbered lists, and nothing else even pasted; 7 buttons. `rich`: also strikethrough, subscript and superscript,
  alignments, indents, headings, fonts, sizes, text colours, links, images (in the text) and tables, as the texts
  written before the profiles hold them; 17 buttons, the formats in common use. `full`: the same text as `rich`, with
  the 24 buttons of the editor before the profiles.
- `buttons` (_IDEAHTMLEditorButton[]_) - A toolbar of one's own, in place of the profile's: any of the buttons of the formats the text holds (a `basic`
  text: `basic`'s; a `rich` or `full` one: `full`'s), in the toolbar's order. The buttons change only what can be
  added: a text keeps the formats it holds.
- `placeholder` (_string_) - The text shown while the editor is empty.
- `ariaLabel` (_string_) - What the editor is called by a screen reader.
