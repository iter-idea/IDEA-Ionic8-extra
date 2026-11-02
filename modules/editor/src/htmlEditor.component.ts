import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertController } from '@ionic/angular/standalone';
import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import { IDEAMessageService, IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';

import {
  IDEA_HTML_EDITOR_FONTS,
  IDEA_HTML_EDITOR_PROFILE_BUTTONS,
  IDEAHTMLEditorButton,
  IDEAHTMLEditorProfile,
  cleanIDEAHTMLEditorPastedHTML,
  getIDEAHTMLEditorExtensions,
  getIDEAHTMLEditorOutput,
  isRichIDEAHTMLEditorProfile,
  isSafeIDEAHTMLEditorImage,
  isSafeIDEAHTMLEditorLink,
  sanitizeIDEAHTMLEditorContent,
  setIDEAHTMLEditorContent
} from './htmlEditorContent';

/**
 * An editor of formatted text, on Tiptap (ProseMirror): it edits and shows HTML, and holds only what its profile
 * allows, whatever is loaded or pasted. Security, styles and the migration from 8.15 are in the module's README.
 */
@Component({
  selector: 'idea-html-editor',
  imports: [IDEATranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (editMode()) {
      <div class="ideaHtmlEditor">
        @if (toolbar().length) {
          <div class="ideaHtmlEditorToolbar" role="toolbar" [attr.aria-label]="'IDEA_EDITOR.TOOLBAR' | translate">
            @for (group of toolbar(); track $index) {
              <div class="ideaHtmlEditorGroup">
                @for (button of group; track button) {
                  @switch (button) {
                    @case ('heading') {
                      <select
                        class="ideaHtmlEditorSelect"
                        [title]="'IDEA_EDITOR.HEADING' | translate"
                        [attr.aria-label]="'IDEA_EDITOR.HEADING' | translate"
                        (change)="setHeading($any($event.target).value)"
                      >
                        <option value="0" [selected]="!state().heading">
                          {{ 'IDEA_EDITOR.PARAGRAPH' | translate }}
                        </option>
                        @for (level of headingLevels; track level) {
                          <option [value]="level" [selected]="state().heading === level">
                            {{ 'IDEA_EDITOR.HEADING_LEVEL' | translate: { level } }}
                          </option>
                        }
                      </select>
                    }
                    @case ('fontFamily') {
                      <select
                        class="ideaHtmlEditorSelect"
                        [title]="'IDEA_EDITOR.FONT_FAMILY' | translate"
                        [attr.aria-label]="'IDEA_EDITOR.FONT_FAMILY' | translate"
                        (change)="setFont({ face: $any($event.target).value || null })"
                      >
                        <option value="" [selected]="!state().fontFamily">
                          {{ 'IDEA_EDITOR.FONT_FAMILY' | translate }}
                        </option>
                        @for (font of fonts; track font) {
                          <option [value]="font" [selected]="state().fontFamily === font">{{ font }}</option>
                        }
                      </select>
                    }
                    @case ('fontSize') {
                      <select
                        class="ideaHtmlEditorSelect"
                        [title]="'IDEA_EDITOR.FONT_SIZE' | translate"
                        [attr.aria-label]="'IDEA_EDITOR.FONT_SIZE' | translate"
                        (change)="setFont({ size: $any($event.target).value || null })"
                      >
                        <option value="" [selected]="!state().fontSize">
                          {{ 'IDEA_EDITOR.FONT_SIZE' | translate }}
                        </option>
                        @for (size of fontSizes; track size) {
                          <option [value]="size" [selected]="state().fontSize === size">{{ size }}</option>
                        }
                      </select>
                    }
                    @case ('textColor') {
                      <label class="ideaHtmlEditorButton" [title]="'IDEA_EDITOR.TEXT_COLOR' | translate">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path [attr.d]="icons.textColor" />
                          <rect
                            class="swatch"
                            x="4"
                            y="18"
                            width="16"
                            height="3.5"
                            rx="1"
                            [attr.fill]="state().textColor || 'currentColor'"
                          />
                        </svg>
                        <input
                          type="color"
                          [attr.aria-label]="'IDEA_EDITOR.TEXT_COLOR' | translate"
                          [value]="state().textColor || '#000000'"
                          (change)="setFont({ color: $any($event.target).value })"
                        />
                      </label>
                    }
                    @default {
                      <button
                        type="button"
                        class="ideaHtmlEditorButton"
                        [class.active]="state().active[button]"
                        [attr.aria-pressed]="isToggle(button) ? !!state().active[button] : null"
                        [disabled]="state().disabled[button]"
                        [title]="titles[button] | translate"
                        [attr.aria-label]="titles[button] | translate"
                        (mousedown)="$event.preventDefault()"
                        (click)="press(button)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="icons[button]" /></svg>
                      </button>
                    }
                  }
                }
              </div>
            }
          </div>
        }
        <div class="ideaHtmlEditorContent" #host></div>
        @if (shows('image')) {
          <input #imagePicker type="file" hidden multiple [accept]="imageTypes" (change)="addPickedImages($event)" />
        }
      </div>
    } @else {
      <div class="view" [innerHTML]="view()"></div>
    }
  `
})
export class IDEAHTMLEditorComponent {
  private _sanitizer = inject(DomSanitizer);
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);
  private _message = inject(IDEAMessageService);

  /**
   * Whether the parent page is in editMode or not (simplified).
   */
  readonly editMode = input(false);
  /**
   * The HTML content, two-way (`[(content)]`): `contentChange` comes only when the user changes the text, never when
   * it's loaded; an empty text is `''`.
   */
  readonly content = model<string>();
  /**
   * What the text can hold, and the toolbar. `basic` (the default): paragraphs, bold, italic, underline, bulleted and
   * numbered lists, and nothing else even pasted; 7 buttons. `rich`: also strikethrough, subscript and superscript,
   * alignments, indents, headings, fonts, sizes, text colours, links, images (in the text) and tables, as the texts
   * written before the profiles hold them; 17 buttons, the formats in common use. `full`: the same text as `rich`, with
   * the 24 buttons of the editor before the profiles.
   */
  readonly profile = input<IDEAHTMLEditorProfile>('basic');
  /**
   * A toolbar of one's own, in place of the profile's: any of the buttons of the formats the text holds (a `basic`
   * text: `basic`'s; a `rich` or `full` one: `full`'s), in the toolbar's order. The buttons change only what can be
   * added: a text keeps the formats it holds.
   */
  readonly buttons = input<IDEAHTMLEditorButton[]>();
  /**
   * The text shown while the editor is empty.
   */
  readonly placeholder = input<string>();
  /**
   * What the editor is called by a screen reader.
   */
  readonly ariaLabel = input<string>();

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  private readonly imagePicker = viewChild<ElementRef<HTMLInputElement>>('imagePicker');

  private editor: Editor | null = null;
  private editorProfile: IDEAHTMLEditorProfile = 'basic';
  /**
   * The text the editor holds, as given or as it last gave it: the same value coming back isn't loaded again.
   */
  private lastContent = '';
  private readonly revision = signal(0);

  readonly shownButtons = computed((): IDEAHTMLEditorButton[] => {
    const profile = this.profile();
    const chosen = this.buttons();
    if (!chosen) return IDEA_HTML_EDITOR_PROFILE_BUTTONS[profile] ?? IDEA_HTML_EDITOR_PROFILE_BUTTONS.basic;
    const possible = IDEA_HTML_EDITOR_PROFILE_BUTTONS[isRichIDEAHTMLEditorProfile(profile) ? 'full' : 'basic'];
    return possible.filter(button => chosen.includes(button));
  });
  readonly toolbar = computed((): IDEAHTMLEditorButton[][] =>
    TOOLBAR_GROUPS.map(group => group.filter(button => this.shownButtons().includes(button))).filter(g => g.length)
  );
  readonly state = computed((): ToolbarState => {
    this.revision();
    const state: ToolbarState = { active: {}, disabled: {}, heading: 0, fontFamily: '', fontSize: '', textColor: '' };
    const editor = this.editor;
    if (!editor) return state;
    for (const button of this.shownButtons()) {
      state.active[button] = IS_ACTIVE[button]?.(editor) ?? false;
      state.disabled[button] = IS_DISABLED[button]?.(editor) ?? false;
    }
    if (this.shows('imageSize')) state.disabled.imageSize = !this.getSelectedImages().length;
    if (this.shows('heading'))
      state.heading = this.headingLevels.find(level => editor.isActive('heading', { level })) ?? 0;
    if (this.shows('fontFamily') || this.shows('fontSize') || this.shows('textColor')) {
      const font = editor.getAttributes('font');
      state.fontFamily = font['face'] ?? '';
      state.fontSize = font['size'] ?? '';
      state.textColor = toHexColor(font['color']);
    }
    return state;
  });
  readonly view = computed(
    (): SafeHtml =>
      // sanitized by the editor's own rules, stricter than Angular's
      this._sanitizer.bypassSecurityTrustHtml(sanitizeIDEAHTMLEditorContent(this.content(), this.profile()))
  );

  readonly titles = BUTTON_TITLES;
  readonly icons = ICONS;
  readonly fonts = IDEA_HTML_EDITOR_FONTS;
  readonly fontSizes = ['1', '2', '3', '4', '5', '6', '7'];
  readonly headingLevels = [1, 2, 3, 4, 5, 6] as const;
  readonly imageTypes = IMAGE_TYPES.join(',');

  constructor() {
    afterRenderEffect(() => {
      const host = this.host()?.nativeElement;
      const profile = this.profile();
      const placeholder = this.placeholder();
      const ariaLabel = this.ariaLabel();
      untracked(() => this.mount(host, profile, placeholder, ariaLabel));
    });
    effect(() => {
      const content = this.content() ?? '';
      untracked(() => {
        if (!this.editor || content === this.lastContent) return;
        this.lastContent = content;
        setIDEAHTMLEditorContent(this.editor, content, this.editorProfile);
      });
    });
    inject(DestroyRef).onDestroy(() => this.unmount());
  }

  private mount(
    host: HTMLElement | undefined,
    profile: IDEAHTMLEditorProfile,
    placeholder: string | undefined,
    ariaLabel: string | undefined
  ): void {
    this.unmount();
    if (!host) return;
    this.editorProfile = profile;
    this.lastContent = this.content() ?? '';
    this.editor = new Editor({
      element: host,
      extensions: getIDEAHTMLEditorExtensions(profile, placeholder),
      // the styles are the library's (`css/global.scss`): none is added to the page
      injectCSS: false,
      // the shortcuts of Docs and Word for a list; no other Markdown
      enableInputRules: ['bulletList', 'orderedList'],
      enablePasteRules: false,
      editorProps: {
        attributes: {
          spellcheck: 'true',
          role: 'textbox',
          'aria-multiline': 'true',
          ...(ariaLabel ? { 'aria-label': ariaLabel } : {})
        },
        transformPastedHTML: (html: string): string => cleanIDEAHTMLEditorPastedHTML(html),
        handlePaste: (_: EditorView, event: ClipboardEvent): boolean => this.onPaste(event),
        handleDrop: (view: EditorView, event: DragEvent, _: unknown, moved: boolean): boolean =>
          this.onDrop(view, event, moved)
      },
      onUpdate: (): void => this.emitContent(),
      onTransaction: (): void => this.revision.update(revision => revision + 1)
    });
    setIDEAHTMLEditorContent(this.editor, this.lastContent, profile);
  }
  private unmount(): void {
    if (!this.editor) return;
    this.editor.destroy();
    this.editor = null;
    this.revision.update(revision => revision + 1);
  }

  private emitContent(): void {
    const html = getIDEAHTMLEditorOutput(this.editor, this.editorProfile);
    if (html === this.lastContent) return;
    this.lastContent = html;
    this.content.set(html);
  }

  shows(button: IDEAHTMLEditorButton): boolean {
    return this.shownButtons().includes(button);
  }
  isToggle(button: IDEAHTMLEditorButton): boolean {
    return TOGGLES.includes(button);
  }

  press(button: IDEAHTMLEditorButton): void {
    if (!this.editor) return;
    if (button === 'link') this.askAndSetLink();
    else if (button === 'image') this.imagePicker()?.nativeElement.click();
    else if (button === 'imageSize') this.askAndSetImagesSize();
    else COMMANDS[button]?.(this.editor);
  }
  setHeading(level: string): void {
    const chain = this.editor?.chain().focus();
    if (!chain) return;
    if (Number(level)) chain.setHeading({ level: Number(level) as any }).run();
    // a line stays a line: a paragraph would add its margins
    else if (!this.editor.isActive('div')) chain.setParagraph().run();
  }
  setFont(attributes: Record<string, string | null>): void {
    if (!this.editor) return;
    const font = { ...this.editor.getAttributes('font'), ...attributes };
    if (Object.values(font).some(Boolean)) this.editor.chain().focus().setMark('font', attributes).run();
    else this.editor.chain().focus().unsetMark('font').run();
  }

  private async askAndSetLink(): Promise<void> {
    const current: string = this.editor.getAttributes('link')['href'] ?? '';
    const alert = await this._alert.create({
      header: this._translate._('IDEA_EDITOR.LINK'),
      inputs: [
        {
          name: 'address',
          type: 'url',
          value: current || 'https://',
          placeholder: this._translate._('IDEA_EDITOR.LINK_ADDRESS')
        }
      ],
      buttons: [
        { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
        { text: this._translate._('COMMON.CONFIRM'), handler: ({ address }): boolean => this.setLink(address) }
      ]
    });
    await alert.present();
  }
  private setLink(address: string): boolean {
    if (!this.editor) return true;
    let href = (address ?? '').trim();
    const chain = this.editor.chain().focus().extendMarkRange('link');
    if (!href || href === 'https://') {
      chain.unsetLink().run();
      return true;
    }
    if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) href = 'https://'.concat(href);
    if (!isSafeIDEAHTMLEditorLink(href)) {
      this._message.warning('IDEA_EDITOR.LINK_NOT_VALID');
      return false;
    }
    if (this.editor.state.selection.empty && !this.editor.isActive('link'))
      chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
    else chain.setLink({ href }).run();
    return true;
  }

  async addPickedImages(event: Event): Promise<void> {
    const picker = event.target as HTMLInputElement;
    const files = Array.from(picker.files ?? []);
    // the same file can be picked again
    picker.value = '';
    await this.addImages(files);
  }
  private onPaste(event: ClipboardEvent): boolean {
    const clipboard = event.clipboardData;
    // a text comes with a picture of itself from some apps (Word, Excel): the text wins
    if (!clipboard?.files?.length || clipboard.types.includes('text/html') || clipboard.types.includes('text/plain'))
      return false;
    this.addImages(Array.from(clipboard.files));
    return true;
  }
  private onDrop(view: EditorView, event: DragEvent, moved: boolean): boolean {
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (moved || !files.length) return false;
    this.addImages(files, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos);
    return true;
  }
  private async addImages(files: File[], position?: number): Promise<void> {
    if (files.some(file => !file.type.startsWith('image/'))) return this._message.warning('IDEA_EDITOR.FILE_NOT_IMAGE');
    if (!isRichIDEAHTMLEditorProfile(this.editorProfile) || !this.shows('image'))
      return this._message.warning('IDEA_EDITOR.IMAGES_NOT_ALLOWED');
    for (const file of files) {
      const source = await readAsDataURL(file);
      if (!this.editor) return;
      if (!IMAGE_TYPES.includes(file.type) || !isSafeIDEAHTMLEditorImage(source)) {
        this._message.warning('IDEA_EDITOR.IMAGE_TYPE_NOT_ALLOWED');
        continue;
      }
      const image = { type: 'image', attrs: { src: source } };
      const chain = this.editor.chain().focus();
      if (position === undefined) chain.insertContent(image).run();
      else chain.insertContentAt(Math.min(position, this.editor.state.doc.content.size), image).run();
    }
  }

  private async askAndSetImagesSize(): Promise<void> {
    const header = this._translate._('IDEA_EDITOR.SELECT_SIZE_FOR_IMAGE');
    const inputs: any = [
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.SMALL'), value: 300 },
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.MEDIUM'), value: 800 },
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.LARGE'), value: 1200 },
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.ORIGINAL'), value: 0 }
    ];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: (width: number): void => this.setImagesWidth(width) }
    ];
    const alert = await this._alert.create({ header, inputs, buttons });
    await alert.present();
  }
  private setImagesWidth(width: number): void {
    if (!this.editor) return;
    const { tr } = this.editor.state;
    // the height goes with the width: the image keeps its proportions
    for (const { node, position } of this.getSelectedImages())
      tr.setNodeMarkup(position, undefined, { ...node.attrs, width: width ? String(width) : null, height: null });
    if (tr.docChanged) this.editor.view.dispatch(tr);
  }
  private getSelectedImages(): { node: ProseMirrorNode; position: number }[] {
    const { selection, doc } = this.editor.state;
    if (selection instanceof NodeSelection)
      return selection.node.type.name === 'image' ? [{ node: selection.node, position: selection.from }] : [];
    const images: { node: ProseMirrorNode; position: number }[] = [];
    doc.nodesBetween(selection.from, selection.to, (node, position) => {
      if (node.type.name === 'image') images.push({ node, position });
    });
    return images;
  }
}

interface ToolbarState {
  active: Partial<Record<IDEAHTMLEditorButton, boolean>>;
  disabled: Partial<Record<IDEAHTMLEditorButton, boolean>>;
  heading: number;
  fontFamily: string;
  fontSize: string;
  textColor: string;
}

const TOOLBAR_GROUPS: IDEAHTMLEditorButton[][] = [
  ['undo', 'redo'],
  ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript'],
  ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
  ['indent', 'outdent'],
  ['bulletList', 'orderedList'],
  ['heading', 'fontFamily', 'fontSize', 'textColor'],
  ['link', 'unlink', 'image', 'imageSize']
];
const TOGGLES: IDEAHTMLEditorButton[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'subscript',
  'superscript',
  'alignLeft',
  'alignCenter',
  'alignRight',
  'alignJustify',
  'bulletList',
  'orderedList'
];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const isAligned = (editor: Editor, align: string): boolean => editor.isActive({ align });
const IS_ACTIVE: Partial<Record<IDEAHTMLEditorButton, (editor: Editor) => boolean>> = {
  bold: editor => editor.isActive('bold'),
  italic: editor => editor.isActive('italic'),
  underline: editor => editor.isActive('underline'),
  strike: editor => editor.isActive('strike'),
  subscript: editor => editor.isActive('subscript'),
  superscript: editor => editor.isActive('superscript'),
  alignLeft: editor => !['center', 'right', 'justify'].some(align => isAligned(editor, align)),
  alignCenter: editor => isAligned(editor, 'center'),
  alignRight: editor => isAligned(editor, 'right'),
  alignJustify: editor => isAligned(editor, 'justify'),
  bulletList: editor => editor.isActive('bulletList'),
  orderedList: editor => editor.isActive('orderedList'),
  link: editor => editor.isActive('link')
};
const IS_DISABLED: Partial<Record<IDEAHTMLEditorButton, (editor: Editor) => boolean>> = {
  undo: editor => !editor.can().undo(),
  redo: editor => !editor.can().redo(),
  indent: editor => !editor.can().sinkListItem('listItem') && !editor.can().wrapIn('blockquote'),
  outdent: editor => !editor.can().liftListItem('listItem') && !editor.can().lift('blockquote'),
  unlink: editor => !editor.isActive('link')
};
const COMMANDS: Partial<Record<IDEAHTMLEditorButton, (editor: Editor) => void>> = {
  undo: editor => editor.chain().focus().undo().run(),
  redo: editor => editor.chain().focus().redo().run(),
  bold: editor => editor.chain().focus().toggleBold().run(),
  italic: editor => editor.chain().focus().toggleItalic().run(),
  underline: editor => editor.chain().focus().toggleUnderline().run(),
  strike: editor => editor.chain().focus().toggleStrike().run(),
  subscript: editor => editor.chain().focus().unsetSuperscript().toggleSubscript().run(),
  superscript: editor => editor.chain().focus().unsetSubscript().toggleSuperscript().run(),
  alignLeft: editor => editor.chain().focus().setAlign(null).run(),
  alignCenter: editor => editor.chain().focus().setAlign('center').run(),
  alignRight: editor => editor.chain().focus().setAlign('right').run(),
  alignJustify: editor => editor.chain().focus().setAlign('justify').run(),
  bulletList: editor => editor.chain().focus().toggleBulletList().run(),
  orderedList: editor => editor.chain().focus().toggleOrderedList().run(),
  // in a list, a level deeper; elsewhere, as the editor before did, a quote
  indent: editor =>
    editor.can().sinkListItem('listItem')
      ? editor.chain().focus().sinkListItem('listItem').run()
      : editor.chain().focus().wrapIn('blockquote').run(),
  outdent: editor =>
    editor.can().liftListItem('listItem')
      ? editor.chain().focus().liftListItem('listItem').run()
      : editor.chain().focus().lift('blockquote').run(),
  unlink: editor => editor.chain().focus().extendMarkRange('link').unsetLink().run()
};

const BUTTON_TITLES: Record<IDEAHTMLEditorButton, string> = {
  undo: 'IDEA_EDITOR.UNDO',
  redo: 'IDEA_EDITOR.REDO',
  bold: 'IDEA_EDITOR.BOLD',
  italic: 'IDEA_EDITOR.ITALIC',
  underline: 'IDEA_EDITOR.UNDERLINE',
  strike: 'IDEA_EDITOR.STRIKE',
  subscript: 'IDEA_EDITOR.SUBSCRIPT',
  superscript: 'IDEA_EDITOR.SUPERSCRIPT',
  heading: 'IDEA_EDITOR.HEADING',
  fontFamily: 'IDEA_EDITOR.FONT_FAMILY',
  fontSize: 'IDEA_EDITOR.FONT_SIZE',
  textColor: 'IDEA_EDITOR.TEXT_COLOR',
  alignLeft: 'IDEA_EDITOR.ALIGN_LEFT',
  alignCenter: 'IDEA_EDITOR.ALIGN_CENTER',
  alignRight: 'IDEA_EDITOR.ALIGN_RIGHT',
  alignJustify: 'IDEA_EDITOR.ALIGN_JUSTIFY',
  bulletList: 'IDEA_EDITOR.BULLET_LIST',
  orderedList: 'IDEA_EDITOR.ORDERED_LIST',
  indent: 'IDEA_EDITOR.INDENT',
  outdent: 'IDEA_EDITOR.OUTDENT',
  link: 'IDEA_EDITOR.LINK',
  unlink: 'IDEA_EDITOR.UNLINK',
  image: 'IDEA_EDITOR.IMAGE',
  imageSize: 'IDEA_EDITOR.SELECT_SIZE_FOR_IMAGE'
};
// drawn on a 24×24 grid, with a stroke of 2 (`css/global.scss`)
const ICONS: Partial<Record<IDEAHTMLEditorButton, string>> = {
  undo: 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3',
  bold: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z',
  italic: 'M11 5h7M6 19h7M14.5 5l-5 14',
  underline: 'M7 4v7a5 5 0 0 0 10 0V4M5 20h14',
  strike:
    'M4 12h16M16.5 8c0-2-2-3.5-4.5-3.5S7.5 6 7.5 8c0 1.4 1 2.4 2.6 3M8 16c0 2 2 3.5 4.5 3.5S17 18 17 16c0-.9-.4-1.7-1.1-2.3',
  subscript: 'M4 5l7 9M11 5l-7 9M20 20h-4c0-1.6 4-2.4 4-4.3 0-.9-.8-1.6-1.9-1.6-.9 0-1.6.4-2 1.1',
  superscript: 'M4 10l7 9M11 10l-7 9M20 11h-4c0-1.6 4-2.4 4-4.3 0-.9-.8-1.6-1.9-1.6-.9 0-1.6.4-2 1.1',
  alignLeft: 'M4 6h16M4 10h10M4 14h16M4 18h10',
  alignCenter: 'M4 6h16M7 10h10M4 14h16M7 18h10',
  alignRight: 'M4 6h16M10 10h10M4 14h16M10 18h10',
  alignJustify: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  indent: 'M11 6h9M11 10h9M11 14h9M4 18h16M4 7.5l3.5 2.5L4 12.5',
  outdent: 'M11 6h9M11 10h9M11 14h9M4 18h16M7.5 7.5 4 10l3.5 2.5',
  bulletList:
    'M9 6h11M9 12h11M9 18h11M4.5 5a1 1 0 1 0 0 2 1 1 0 1 0 0-2M4.5 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2M4.5 17a1 1 0 1 0 0 2 1 1 0 1 0 0-2',
  orderedList:
    'M10 6h10M10 12h10M10 18h10M4 4.5l1.5-1v5M3.6 10.8c.3-.5.8-.8 1.4-.8.8 0 1.4.5 1.4 1.2 0 1.2-2.8 1.7-2.8 3.3h2.9M3.7 16.4c.3-.4.8-.6 1.3-.6.8 0 1.3.4 1.3 1.1s-.6 1.1-1.3 1.1c.8 0 1.4.4 1.4 1.1 0 .7-.6 1.2-1.4 1.2-.6 0-1.1-.2-1.4-.7',
  textColor: 'M6.5 15.5 12 3.5l5.5 12M8.3 11.5h7.4',
  link: 'M10 13.5a4.5 4.5 0 0 0 6.5.5l2.7-2.7a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5M14 10.5a4.5 4.5 0 0 0-6.5-.5l-2.7 2.7a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5',
  unlink: 'M16.5 14l2.7-2.7a4.5 4.5 0 0 0-6.4-6.4l-1.5 1.5M7.5 10l-2.7 2.7a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5M4 4l16 16',
  image: 'M4 5h16v14H4zM4 15.5l4.5-4.5 4 4 2.5-2.5 5 5M15.5 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3',
  imageSize: 'M14 4h6v6M20 4l-6.5 6.5M10 20H4v-6M4 20l6.5-6.5'
};

/**
 * A colour as the colour picker takes it (`#rrggbb`), or nothing: the documents written before name some (`red`).
 */
const toHexColor = (color: string | null | undefined): string => {
  if (!color) return '';
  colorReader ??= document.createElement('canvas').getContext('2d');
  // a colour the canvas doesn't know leaves the one before
  colorReader.fillStyle = '#000001';
  colorReader.fillStyle = color;
  const hex = String(colorReader.fillStyle);
  return /^#[0-9a-f]{6}$/i.test(hex) && (hex !== '#000001' || /^#000001$/i.test(color)) ? hex.toLowerCase() : '';
};
let colorReader: CanvasRenderingContext2D | null = null;
const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject): void => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(reader.result as string);
    reader.onerror = (): void => reject(reader.error);
    reader.readAsDataURL(file);
  });
