import { Editor, Extension, Extensions, Mark, Node as SchemaNode } from '@tiptap/core';
import { splitBlockAs } from '@tiptap/pm/commands';
import { DOMParser, DOMSerializer } from '@tiptap/pm/model';
import { Selection } from '@tiptap/pm/state';
import Paragraph from '@tiptap/extension-paragraph';
import StarterKit from '@tiptap/starter-kit';
import { BulletList, ListItem } from '@tiptap/extension-list';
import Image from '@tiptap/extension-image';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Placeholder } from '@tiptap/extensions';
import createDOMPurify, { Config, DOMPurify } from 'dompurify';

/**
 * What an editor lets its text hold, and its toolbar (`IDEA_HTML_EDITOR_PROFILE_BUTTONS`):
 * - `basic`: paragraphs, bold, italic, underline and lists, whatever is pasted (the default);
 * - `rich`: also the colours, fonts, sizes, alignments, headings, links, images and tables of the documents written with
 * the editor before it had profiles; a toolbar of the formats in common use;
 * - `full`: the same text as `rich`, with the toolbar of the editor before the profiles.
 */
export type IDEAHTMLEditorProfile = 'basic' | 'rich' | 'full';

/**
 * Whether a profile's text holds the formats of the documents written before the profiles (`rich`, `full`).
 */
export const isRichIDEAHTMLEditorProfile = (profile: IDEAHTMLEditorProfile): boolean =>
  profile === 'rich' || profile === 'full';

/**
 * A button of the editor's toolbar.
 */
export type IDEAHTMLEditorButton =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'subscript'
  | 'superscript'
  | 'heading'
  | 'fontFamily'
  | 'fontSize'
  | 'textColor'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'bulletList'
  | 'orderedList'
  | 'indent'
  | 'outdent'
  | 'link'
  | 'unlink'
  | 'image'
  | 'imageSize';

/**
 * The toolbar of each profile, in its order. An editor can show others (`buttons`), among the buttons of the formats its
 * text holds: a `basic` one, its own; a `rich` one, the `full`'s too.
 */
export const IDEA_HTML_EDITOR_PROFILE_BUTTONS: Record<IDEAHTMLEditorProfile, IDEAHTMLEditorButton[]> = {
  basic: ['undo', 'redo', 'bold', 'italic', 'underline', 'bulletList', 'orderedList'],
  rich: [
    'undo',
    'redo',
    'bold',
    'italic',
    'underline',
    'strike',
    'alignLeft',
    'alignCenter',
    'alignRight',
    'alignJustify',
    'bulletList',
    'orderedList',
    'textColor',
    'link',
    'unlink',
    'image',
    'imageSize'
  ],
  full: [
    'undo',
    'redo',
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
    'indent',
    'outdent',
    'bulletList',
    'orderedList',
    'heading',
    'fontFamily',
    'fontSize',
    'textColor',
    'link',
    'unlink',
    'image',
    'imageSize'
  ]
};

/**
 * The fonts of the toolbar (`fontFamily`): the ones the documents written before were offered.
 */
export const IDEA_HTML_EDITOR_FONTS = ['Arial', 'Times New Roman', 'Calibri', 'Comic Sans MS'];

//
// THE SCHEMA
//

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ideaAlign: {
      /**
       * Align the paragraphs, headings and lines of the selection (`null`: as the text flows).
       */
      setAlign: (align: string | null) => ReturnType;
    };
  }
}

/**
 * An HTML attribute kept as it's written: the documents written before carry the presentation in their attributes.
 */
const keptAttribute = (name: string): any => ({
  default: null,
  parseHTML: (element: HTMLElement): string | null => element.getAttribute(name),
  renderHTML: (attributes: Record<string, any>): Record<string, any> =>
    attributes[name] === null || attributes[name] === undefined ? {} : { [name]: attributes[name] }
});
/**
 * An attribute of `<font>`: a font inside another takes from it what it doesn't set, as the browser shows it.
 */
const fontAttribute = (name: string): any => ({
  ...keptAttribute(name),
  parseHTML: (element: HTMLElement): string | null => element.closest(`font[${name}]`)?.getAttribute(name) ?? null
});

/**
 * `<font color face size>`: the text styles of a `rich` text, written as the documents before wrote them.
 */
const Font = Mark.create({
  name: 'font',
  addAttributes() {
    return { color: fontAttribute('color'), face: fontAttribute('face'), size: fontAttribute('size') };
  },
  parseHTML() {
    return [{ tag: 'font' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['font', HTMLAttributes, 0];
  }
});

const ALIGNED_TYPES = ['paragraph', 'heading', 'div'];
// the values of the `align` attribute, from a CSS alignment too (a paste from a browser writes `start`)
const ALIGNMENTS: Record<string, string | null> = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
  start: null,
  end: 'right',
  '-webkit-left': 'left',
  '-webkit-center': 'center',
  '-webkit-right': 'right'
};
/**
 * The alignment of a paragraph, a heading or a line, as an `align` attribute: what the documents written before use,
 * and what survives a sanitizer that drops the `style` attributes.
 */
const Align = Extension.create({
  name: 'ideaAlign',
  addGlobalAttributes() {
    return [
      {
        types: ALIGNED_TYPES,
        attributes: {
          align: {
            default: null,
            parseHTML: (element: HTMLElement): string | null =>
              ALIGNMENTS[(element.getAttribute('align') || element.style.textAlign || '').toLowerCase()] ?? null,
            renderHTML: (attributes: Record<string, any>): Record<string, any> =>
              attributes['align'] ? { align: attributes['align'] } : {}
          }
        }
      }
    ];
  },
  addCommands() {
    return {
      setAlign:
        align =>
        ({ commands }) =>
          ALIGNED_TYPES.map(type => commands.updateAttributes(type, { align })).some(Boolean)
    };
  }
});

const BLOCKS_IN_A_DIV = ':scope > :is(p, div, table, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, pre, hr)';
/**
 * A line in a `<div>`, as the documents written before have plenty: a paragraph would add its margins. A `<div>` that
 * holds blocks is only their container.
 */
const Div = SchemaNode.create({
  name: 'div',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [
      {
        tag: 'div',
        getAttrs: (element: HTMLElement): false | null => (element.querySelector(BLOCKS_IN_A_DIV) ? false : null)
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },
  addKeyboardShortcuts() {
    return {
      // a new line after a line is a line too, as in the editor the documents were written with; in a list, a new item
      Enter: ({ editor }): boolean => {
        const { $from } = editor.state.selection;
        if ($from.parent.type !== this.type || $from.node(-1).type.name === 'listItem') return false;
        return splitBlockAs(node => (node.type === this.type ? { type: this.type, attrs: node.attrs } : null))(
          editor.state,
          editor.view.dispatch
        );
      }
    };
  }
});

const SAFE_IMAGE_SOURCE = /^data:image\/(?:png|jpe?g|gif|webp);base64,/i;
/**
 * Whether an image's source is one an editor can hold: an image in the text, never one from a server, since showing
 * the text would call it.
 */
export const isSafeIDEAHTMLEditorImage = (source: string | null | undefined): boolean =>
  SAFE_IMAGE_SOURCE.test(source ?? '');
/**
 * An image in the text, kept in it as base64 (as the documents written before have them), with the size it was given.
 */
const InlineImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: keptAttribute('alt'),
      title: keptAttribute('title'),
      width: keptAttribute('width'),
      height: keptAttribute('height'),
      border: keptAttribute('border')
    };
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element: HTMLElement): false | null =>
          isSafeIDEAHTMLEditorImage(element.getAttribute('src')) ? null : false
      }
    ];
  }
}).configure({ inline: true, allowBase64: true });

const KeptTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      border: keptAttribute('border'),
      cellpadding: keptAttribute('cellpadding'),
      cellspacing: keptAttribute('cellspacing'),
      width: keptAttribute('width'),
      align: keptAttribute('align')
    };
  }
}).configure({ resizable: false });
const KeptTableRow = TableRow.extend({
  addAttributes() {
    return { ...this.parent?.(), height: keptAttribute('height') };
  }
});
const cellAttributes = (): Record<string, any> => ({
  width: keptAttribute('width'),
  height: keptAttribute('height'),
  valign: keptAttribute('valign'),
  align: keptAttribute('align'),
  nowrap: keptAttribute('nowrap')
});
const KeptTableCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellAttributes() };
  }
});
const KeptTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellAttributes() };
  }
});

/**
 * The class of a paragraph made by the editor around text that had none (in a cell, in a list item, at the top): the
 * editor needs a paragraph there, the text doesn't, and a paragraph's margins would make it taller. It shows without
 * margins, and the text it gives has no paragraph there again.
 */
export const IDEA_HTML_EDITOR_LOOSE_CLASS = 'ideaHtmlEditorLoose';
/**
 * The class of a paragraph a list item of the text already had: the editor gives a list item's first paragraph back as
 * text, as the texts written before have their items, but this one keeps the paragraph (and its margins) it had.
 */
export const IDEA_HTML_EDITOR_KEPT_CLASS = 'ideaHtmlEditorKept';
const classAttribute = (className: string): any => ({
  default: false,
  parseHTML: (element: HTMLElement): boolean => element.classList.contains(className),
  renderHTML: (): Record<string, any> => ({})
});
const LooseParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      loose: classAttribute(IDEA_HTML_EDITOR_LOOSE_CLASS),
      kept: classAttribute(IDEA_HTML_EDITOR_KEPT_CLASS)
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const className = node.attrs['loose']
      ? IDEA_HTML_EDITOR_LOOSE_CLASS
      : node.attrs['kept']
        ? IDEA_HTML_EDITOR_KEPT_CLASS
        : null;
    return ['p', className ? { class: className, ...HTMLAttributes } : HTMLAttributes, 0];
  }
});

/**
 * The class of a list item that only holds a nested list, without a marker of its own (`prepareIDEAHTMLEditorContent`).
 */
export const IDEA_HTML_EDITOR_BARE_ITEM_CLASS = 'ideaHtmlEditorBareItem';
const BareListItem = ListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bare: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element: HTMLElement): boolean => element.classList.contains(IDEA_HTML_EDITOR_BARE_ITEM_CLASS),
        renderHTML: (attributes: Record<string, any>): Record<string, any> =>
          attributes['bare'] ? { class: IDEA_HTML_EDITOR_BARE_ITEM_CLASS } : {}
      }
    };
  }
});
const TypedBulletList = BulletList.extend({
  addAttributes() {
    return { ...this.parent?.(), type: keptAttribute('type') };
  }
});

/**
 * The extensions of an editor with a profile: what its text can hold, and nothing else, even pasted.
 */
export const getIDEAHTMLEditorExtensions = (profile: IDEAHTMLEditorProfile, placeholder?: string): Extensions => {
  const common: Extensions = [
    LooseParagraph,
    BareListItem,
    Div,
    Placeholder.configure({ placeholder: placeholder ?? '' })
  ];
  if (!isRichIDEAHTMLEditorProfile(profile))
    return [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false,
        paragraph: false,
        listItem: false,
        trailingNode: false
      }),
      ...common
    ];
  return [
    StarterKit.configure({
      code: false,
      bulletList: false,
      listItem: false,
      paragraph: false,
      trailingNode: false,
      link: {
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        isAllowedUri: (url: string): boolean => isSafeIDEAHTMLEditorLink(url)
      }
    }),
    ...common,
    TypedBulletList,
    Subscript,
    Superscript,
    Font,
    Align,
    InlineImage,
    KeptTable,
    KeptTableRow,
    KeptTableCell,
    KeptTableHeader
  ];
};

//
// THE SANITIZER
//

// a link to a shared folder (`file:`) does nothing from a web page, but tells where the document is
const SAFE_LINK = /^(?:https?:|mailto:|file:)/i;
/**
 * Whether a link's address is one an editor can hold: the web, an email, a shared folder.
 */
export const isSafeIDEAHTMLEditorLink = (address: string | null | undefined): boolean => SAFE_LINK.test(address ?? '');

const BASIC_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'div'];
// the blocks a `basic` text can't hold, kept as lines: their text never runs into the next
const BLOCKS_AS_LINES = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'table',
  'caption',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'dl',
  'dt',
  'dd',
  'address',
  'center',
  'section',
  'article',
  'header',
  'footer',
  'figure',
  'figcaption'
];
const SANITIZER_CONFIGS: Record<'basic' | 'rich', Config> = {
  // the class goes through for the editor's own (`IDEA_HTML_EDITOR_BARE_ITEM_CLASS`): any other is taken off after
  basic: {
    ALLOWED_TAGS: [...BASIC_TAGS, ...BLOCKS_AS_LINES],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false
  },
  rich: {
    ALLOWED_TAGS: [
      ...BASIC_TAGS,
      's',
      'strike',
      'del',
      'sub',
      'sup',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
      'code',
      'hr',
      'a',
      'img',
      'font',
      'span',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'colgroup',
      'col'
    ],
    ALLOWED_ATTR: [
      'class',
      'href',
      'target',
      'rel',
      'align',
      'color',
      'face',
      'size',
      'src',
      'alt',
      'title',
      'width',
      'height',
      'border',
      'cellpadding',
      'cellspacing',
      'colspan',
      'rowspan',
      'valign',
      'nowrap',
      'type',
      'start',
      'span'
    ],
    // the attributes that are no address: DOMPurify would hold their values to the addresses' expression below
    ADD_URI_SAFE_ATTR: [
      'align',
      'color',
      'face',
      'size',
      'width',
      'height',
      'border',
      'cellpadding',
      'cellspacing',
      'colspan',
      'rowspan',
      'valign',
      'nowrap',
      'type',
      'start',
      'span',
      'target',
      'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|file:|data:image\/(?:png|jpe?g|gif|webp);base64,)/i,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false
  }
};

let purifier: DOMPurify | null = null;
/**
 * The editor's own DOMPurify: its settings never reach the app's.
 */
const getPurifier = (): DOMPurify => (purifier ??= createDOMPurify(window));

let inertDocument: Document | null = null;
/**
 * A document nobody sees: the HTML handled in it loads no image and runs no handler.
 */
const getInertDocument = (): Document => (inertDocument ??= document.implementation.createHTMLDocument(''));

/**
 * HTML reduced to what an editor with a profile can hold: the tags and attributes of the profile, the links to the web,
 * an email or a shared folder, the images in the text; never a script, an event handler, a style or a call to a server.
 */
export const sanitizeIDEAHTMLEditorContent = (
  html: string | null | undefined,
  profile: IDEAHTMLEditorProfile
): string => (html ? sanitizeIntoElement(html, profile).innerHTML : '');
const sanitizeIntoElement = (html: string, profile: IDEAHTMLEditorProfile): HTMLElement => {
  const rich = isRichIDEAHTMLEditorProfile(profile);
  const fragment = getPurifier().sanitize(html, {
    ...SANITIZER_CONFIGS[rich ? 'rich' : 'basic'],
    RETURN_DOM_FRAGMENT: true
  });
  // one expression holds every address for DOMPurify: an image from a server or a link to anything but the web, an
  // email or a shared folder would get through it
  fragment.querySelectorAll('img').forEach(image => {
    if (!isSafeIDEAHTMLEditorImage(image.getAttribute('src'))) image.remove();
  });
  fragment.querySelectorAll('a').forEach(link => {
    const address = link.getAttribute('href');
    if (!isSafeIDEAHTMLEditorLink(address)) link.removeAttribute('href');
    // a link opens elsewhere, never in place of the app, and can't reach back to the page that opened it
    else if (!/^mailto:/i.test(address)) link.setAttribute('target', '_blank');
    if (link.hasAttribute('target')) link.setAttribute('rel', 'noopener noreferrer');
    else link.removeAttribute('rel');
  });
  // the only class kept is the editor's own
  fragment.querySelectorAll('[class]').forEach(element => {
    if (element.tagName === 'LI' && element.classList.contains(IDEA_HTML_EDITOR_BARE_ITEM_CLASS))
      element.className = IDEA_HTML_EDITOR_BARE_ITEM_CLASS;
    else element.removeAttribute('class');
  });
  if (!rich)
    fragment.querySelectorAll(BLOCKS_AS_LINES.join(', ')).forEach(block => {
      const line = block.ownerDocument.createElement('div');
      line.append(...Array.from(block.childNodes));
      block.replaceWith(line);
    });
  const container = getInertDocument().createElement('div');
  container.appendChild(fragment);
  return container;
};

/**
 * Load a text in an editor, in place of the one it holds (which an undo won't bring back).
 */
export const setIDEAHTMLEditorContent = (
  editor: Editor,
  html: string | null | undefined,
  profile: IDEAHTMLEditorProfile
): void => {
  // parsed here rather than by the editor, which would drop the line breaks between two words of the HTML
  const content = DOMParser.fromSchema(editor.schema).parse(prepareIntoElement(html, profile)).content;
  const { tr } = editor.state;
  tr.replaceWith(0, tr.doc.content.size, content);
  tr.setSelection(Selection.atStart(tr.doc)).setMeta('addToHistory', false).setMeta('preventUpdate', true);
  editor.view.dispatch(tr);
};

/**
 * HTML ready to load in an editor (`setIDEAHTMLEditorContent`): sanitized and with the structure the editor needs,
 * marked so that the text it gives back is the one it was given (`getIDEAHTMLEditorOutput`).
 */
export const prepareIDEAHTMLEditorContent = (html: string | null | undefined, profile: IDEAHTMLEditorProfile): string =>
  prepareIntoElement(html, profile).innerHTML;
const prepareIntoElement = (html: string | null | undefined, profile: IDEAHTMLEditorProfile): HTMLElement => {
  const container = sanitizeIntoElement(html ?? '', profile);
  // a list right inside another list, which a browser shows indented (Outlook and Word write them), goes in the item
  // before it or, if it comes first, in an item without a marker: the editor would make it an empty item
  container.querySelectorAll(':is(ul, ol) > :is(ul, ol)').forEach(list => {
    const previous = list.previousElementSibling;
    if (previous?.tagName === 'LI') previous.appendChild(list);
    else {
      const item = container.ownerDocument.createElement('li');
      item.className = IDEA_HTML_EDITOR_BARE_ITEM_CLASS;
      list.replaceWith(item);
      item.appendChild(list);
    }
  });
  container.querySelectorAll('li > p').forEach(paragraph => paragraph.classList.add(IDEA_HTML_EDITOR_KEPT_CLASS));
  // the editor's list item starts with a paragraph: without one, it would take the item's list out of it
  container.querySelectorAll('li').forEach(item => {
    const first = Array.from(item.childNodes).find(
      node => node.nodeType !== Node.TEXT_NODE || HAS_CONTENT.test(node.textContent ?? '')
    );
    if (isElement(first) && (first.tagName === 'UL' || first.tagName === 'OL'))
      item.prepend(container.ownerDocument.createElement('p'));
  });
  wrapLooseText(container, true);
  container.querySelectorAll('td, th, li, div, blockquote').forEach(block => wrapLooseText(block));
  // an empty cell's paragraph is a loose one too: what is written in it stays without margins, as the cells around
  container.querySelectorAll('td, th').forEach(cell => {
    if (!cell.childNodes.length) cell.appendChild(newLooseParagraph(cell.ownerDocument));
  });
  return container;
};

const isElement = (node: ChildNode | undefined): node is Element => node?.nodeType === Node.ELEMENT_NODE;
const newLooseParagraph = (ownerDocument: Document): HTMLParagraphElement => {
  const paragraph = ownerDocument.createElement('p');
  paragraph.className = IDEA_HTML_EDITOR_LOOSE_CLASS;
  return paragraph;
};
// a no-break space shows: only HTML's own whitespace is no content (`trim()` would take both)
const HAS_CONTENT = /[^ \t\n\r\f]/;
const INLINE_TAGS = new Set([
  'A',
  'B',
  'BR',
  'CODE',
  'DEL',
  'EM',
  'FONT',
  'I',
  'IMG',
  'S',
  'SPAN',
  'STRIKE',
  'STRONG',
  'SUB',
  'SUP',
  'U'
]);
const BLOCK_TAGS_OF_A_DIV = new Set([
  'P',
  'DIV',
  'TABLE',
  'UL',
  'OL',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
  'HR'
]);
/**
 * The text right inside a block that holds other blocks (a cell, a list item, a container), in paragraphs marked as
 * loose; a `<div>` that holds only text is a line of its own (`Div`).
 */
const wrapLooseText = (block: Element, isTheText = false): void => {
  if (
    !isTheText &&
    block.tagName === 'DIV' &&
    !Array.from(block.children).some(child => BLOCK_TAGS_OF_A_DIV.has(child.tagName))
  )
    return;
  let run: ChildNode[] = [];
  const wrapRun = (): void => {
    if (run.some(node => node.nodeType !== Node.TEXT_NODE || HAS_CONTENT.test(node.textContent ?? ''))) {
      const paragraph = newLooseParagraph(block.ownerDocument);
      run[0].before(paragraph);
      run.forEach(node => paragraph.appendChild(node));
    }
    run = [];
  };
  for (const node of Array.from(block.childNodes))
    if (node.nodeType === Node.TEXT_NODE || (isElement(node) && INLINE_TAGS.has(node.tagName))) run.push(node);
    else wrapRun();
  wrapRun();
};

/**
 * Pasted HTML made harmless before the editor reads it into its profile: the styles stay, since bold and italic come
 * from them in a text copied from Google Docs or Word; the lists of Word become lists.
 */
export const cleanIDEAHTMLEditorPastedHTML = (html: string): string => {
  const fragment = getPurifier().sanitize(html, {
    FORBID_TAGS: [
      'style',
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'button',
      'svg',
      'math',
      'meta',
      'link'
    ],
    RETURN_DOM_FRAGMENT: true
  });
  const container = getInertDocument().createElement('div');
  container.appendChild(fragment);
  turnWordListsIntoLists(container);
  return container.innerHTML;
};

const WORD_LIST_ITEM = /mso-list:\s*(l\d+)\s+level(\d+)/i;
const ORDERED_MARKER = /^(?:\d+|[a-z]|[ivxlcdm]+)[.)]$/i;
/**
 * Word (and Outlook) write a list as paragraphs with a `mso-list` style (the list and the level), each with its marker
 * written in front of the text: they go back in a list, nested by level, numbered if the marker is.
 */
const turnWordListsIntoLists = (container: HTMLElement): void => {
  const ownerDocument = container.ownerDocument;
  let levels: { level: number; list: HTMLElement }[] = [];
  let listId: string | null = null;
  for (const paragraph of Array.from(container.querySelectorAll('p'))) {
    const match = WORD_LIST_ITEM.exec(paragraph.getAttribute('style') ?? '');
    if (!match) continue;
    const id = match[1];
    const level = Number(match[2]);
    const marker = paragraph.querySelector('[style*="mso-list:ignore" i]');
    const ordered = ORDERED_MARKER.test((marker?.textContent ?? '').trim());
    // the marker goes, with the spans that held only it
    let markerBlock: Element | null = marker;
    while (
      markerBlock &&
      markerBlock.parentElement !== paragraph &&
      markerBlock.parentElement?.textContent === markerBlock.textContent
    )
      markerBlock = markerBlock.parentElement;
    markerBlock?.remove();
    // a list goes on in the paragraph right after it, of the same list of Word
    if (!levels.length || id !== listId || paragraph.previousElementSibling !== levels[0].list) {
      levels = [];
      listId = id;
    }
    while (levels.length && levels[levels.length - 1].level > level) levels.pop();
    if (!levels.length || levels[levels.length - 1].level < level) {
      const list = ownerDocument.createElement(ordered ? 'ol' : 'ul');
      if (!levels.length) paragraph.before(list);
      else {
        const parent = levels[levels.length - 1].list;
        (parent.lastElementChild ?? parent.appendChild(ownerDocument.createElement('li'))).appendChild(list);
      }
      levels.push({ level, list });
    }
    const item = ownerDocument.createElement('li');
    item.append(...Array.from(paragraph.childNodes));
    levels[levels.length - 1].list.appendChild(item);
    paragraph.remove();
  }
};

const LOOSE_PARAGRAPH = new RegExp(
  `<p class="${IDEA_HTML_EDITOR_LOOSE_CLASS}"([^>]*)>((?:(?!</p>)[\\s\\S])*)</p>`,
  'g'
);
const LOOSE_PARAGRAPHS = new RegExp(
  `(?:<p class="${IDEA_HTML_EDITOR_LOOSE_CLASS}"[^>]*>(?:(?!</p>)[\\s\\S])*</p>)+`,
  'g'
);
/**
 * The HTML of an editor's text as the texts written before have it: nothing for an empty text, the loose paragraphs
 * back to lines of text, a list item's first paragraph as text unless the item already had it, no empty paragraph in a
 * table cell or before the list a list item starts with (the editor needs them, the text doesn't: their margins would
 * make it taller); sanitized again by its profile.
 */
export const getIDEAHTMLEditorOutput = (editor: Editor, profile: IDEAHTMLEditorProfile): string => {
  if (editor.isEmpty) return '';
  // built where it loads nothing: the editor's own `getHTML` builds its images in the page
  const ownerDocument = getInertDocument();
  const text = ownerDocument.createElement('div');
  text.appendChild(
    DOMSerializer.fromSchema(editor.schema).serializeFragment(editor.state.doc.content, { document: ownerDocument })
  );
  // the data of the images stays out of the work on the HTML around them: at every change, it would take most of it
  const images: string[] = [];
  const token = `ideaImage${Math.random().toString(36).slice(2)}n`;
  text.querySelectorAll('img').forEach(image => {
    const source = image.getAttribute('src');
    if (isSafeIDEAHTMLEditorImage(source))
      image.setAttribute('src', `${IMAGE_STAND_IN}${token}${images.push(source) - 1}e`);
  });
  const output = sanitizeIntoElement(compact(text.innerHTML), profile);
  if (images.length) {
    const standIn = new RegExp(`^${IMAGE_STAND_IN}${token}(\\d+)e$`);
    output.querySelectorAll('img').forEach(image => {
      const index = standIn.exec(image.getAttribute('src') ?? '')?.[1];
      if (index !== undefined) image.setAttribute('src', images[Number(index)]);
    });
  }
  return output.innerHTML;
};
const IMAGE_STAND_IN = 'data:image/png;base64,';
const compact = (html: string): string =>
  html
    .replace(LOOSE_PARAGRAPHS, run => {
      const lines = Array.from(run.matchAll(LOOSE_PARAGRAPH), ([, attributes, content]) => ({
        attributes: attributes.trim(),
        content
      }));
      // an aligned line is a line of its own, as the texts written before have it; the others are joined by breaks
      const text = lines
        .map((line, i) =>
          line.attributes
            ? `<div ${line.attributes}>${line.content}</div>`
            : (i && !lines[i - 1].attributes ? '<br>' : '').concat(line.content)
        )
        .join('');
      // a last line left empty shows only if a break ends it
      const last = lines[lines.length - 1];
      return lines.length > 1 && !last.attributes && !last.content ? text.concat('<br>') : text;
    })
    .replace(/<(td|th)\b([^>]*)><p><\/p><\/\1>/g, '<$1$2></$1>')
    .replace(/(<li\b[^>]*>)<p>((?:(?!<\/?p[\s>])[\s\S])*?)<\/p>/g, '$1$2');
