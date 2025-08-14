import { FormsModule } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  SecurityContext,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertController, IonIcon } from '@ionic/angular/standalone';
import { AngularEditorComponent, AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
// @ts-ignore
import { docsSoap } from 'docs-soap';
import { IDEAMessageService, IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';

@Component({
  standalone: true,
  imports: [FormsModule, AngularEditorModule, IDEATranslatePipe, IonIcon],
  selector: 'idea-html-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (editMode) {
      <angular-editor
        #editor
        [config]="editorConfig"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event)"
        (paste)="cleanHTMLCode()"
        [(ngModel)]="text"
        (ngModelChange)="onTextChange($event)"
      >
        <ng-template #customButtons>
          <ae-toolbar-set>
            <button
              aeButton
              [title]="'IDEA_EDITOR.SELECT_SIZE_FOR_IMAGE' | translate"
              (click)="askAndApplySizeToSelectedImages()"
            >
              <ion-icon icon="resize" />
            </button>
          </ae-toolbar-set>
        </ng-template>
      </angular-editor>
    } @else {
      <div class="view" [innerHTML]="sanitizedHtml"></div>
    }
  `,
  styles: [
    `
      ::ng-deep :root {
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
    `,
    `
      ::ng-deep {
        .angular-editor-wrapper {
          background-color: transparent !important;
        }
        .angular-editor-toolbar {
          border-color: var(--idea-html-editor-border-color) !important;
          background-color: var(--idea-html-editor-toolbar-background-color) !important;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .ae-picker-options,
        .ae-picker-label,
        .ae-picker-label:before {
          background: var(--idea-html-editor-toolbar-background-color) !important;
          background-color: var(--idea-html-editor-toolbar-background-color) !important;
          border-color: var(--idea-html-editor-toolbar-border-color) !important;
          color: var(--idea-html-editor-toolbar-color) !important;
        }
        .angular-editor-toolbar svg {
          fill: currentColor !important;
        }
        .angular-editor-toolbar #indent-,
        .angular-editor-toolbar #outdent- {
          stroke: currentColor !important;
        }
        .angular-editor-toolbar .ae-picker-options .ae-picker-item.focused,
        .ae-picker-options .ae-picker-item:hover {
          background-color: var(--idea-html-editor-button-focused) !important;
          color: var(--idea-html-editor-toolbar-color) !important;
        }
        .ae-picker-options .ae-picker-item.selected {
          background-color: var(--idea-html-editor-button-selected) !important;
          color: var(--idea-html-editor-toolbar-color) !important;
        }
        .angular-editor-button {
          background-color: var(--idea-html-editor-button-background-color) !important;
          border-color: var(--idea-html-editor-button-border-color) !important;
          color: var(--idea-html-editor-button-color) !important;
        }
        .angular-editor-textarea {
          background-color: var(--idea-html-editor-background-color) !important;
          border-color: var(--idea-html-editor-border-color) !important;
          color: var(--idea-html-editor-color) !important;
        }
      }
      ::ng-deep:has(+ #foregroundColorPicker-),
      ::ng-deep:has(+ #backgroundColorPicker-) {
        display: inline !important;
        position: absolute;
        visibility: hidden;
      }
      div.view {
        margin: var(--idea-html-editor-view-margin);
        padding: var(--idea-html-editor-view-padding);
        background-color: var(--idea-html-editor-view-background-color);
        color: var(--idea-html-editor-view-color);
        box-shadow: var(--idea-html-editor-view-box-shadow);
        border: var(--idea-html-editor-view-border-width) solid var(--idea-html-editor-view-border-color);
        border-radius: var(--idea-html-editor-view-border-radius);
      }
    `
  ]
})
export class IDEAHTMLEditorComponent implements OnInit, OnChanges {
  private _cdr = inject(ChangeDetectorRef);
  private _sanitizer = inject(DomSanitizer);
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);
  private _message = inject(IDEAMessageService);

  /**
   * Whether the parent page is in editMode or not (simplified).
   */
  @Input() editMode = false;
  /**
   * The HTML content.
   */
  @Input() content: string;
  /**
   * Trigger when the HTML content changes.
   */
  @Output() contentChange = new EventEmitter<string>();

  @ViewChild('editor') editor: AngularEditorComponent;

  text: string;

  lastDropPosition: Range | null = null;

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: false,
    sanitize: true,
    rawPaste: false,
    minHeight: '50vh',
    toolbarHiddenButtons: [['customClasses', 'insertVideo', 'insertHorizontalRule', 'removeFormat', 'toggleEditorMode']]
  };

  sanitizedHtml: string;

  ngOnInit(): void {
    this.text = this.content;
    this.sanitizedHtml = this._sanitizer.sanitize(SecurityContext.HTML, this.content);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.content) {
      this.text = this.content;
      this.sanitizedHtml = this._sanitizer.sanitize(SecurityContext.HTML, this.content);
      this._cdr.markForCheck();
    }
    if (changes.editMode) this._cdr.markForCheck();
  }

  onTextChange(text: string): void {
    this.text = text;
    this.contentChange.emit(text);
    this._cdr.markForCheck();
  }

  cleanHTMLCode(): void {
    setTimeout((): void => {
      this.text = docsSoap(this.text);
      this.contentChange.emit(this.text);
      this._cdr.markForCheck();
    }, 100);
  }

  async askAndApplySizeToSelectedImages(): Promise<void> {
    const applyWidth = (width: number): void => {
      const imagesSelected = this.getSelectedImageElementsInEditor();
      if (!imagesSelected.length) return;
      imagesSelected.forEach(img => {
        if (width) img.setAttribute('width', String(width));
        else img.removeAttribute('width');
      });
      this.contentChange.emit(this.editor.textArea.nativeElement.innerHTML);
      this._cdr.markForCheck();
    };
    const header = this._translate._('IDEA_EDITOR.SELECT_SIZE_FOR_IMAGE');
    const inputs: any = [
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.SMALL'), value: 300 },
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.MEDIUM'), value: 800 },
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.LARGE'), value: 1200 },
      { type: 'radio', label: this._translate._('IDEA_EDITOR.SIZES.ORIGINAL'), value: 0 }
    ];
    const buttons = [
      { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
      { text: this._translate._('COMMON.CONFIRM'), handler: applyWidth }
    ];
    const alert = await this._alert.create({ header, inputs, buttons });
    alert.present();
  }
  private getSelectedImageElementsInEditor(selectors = 'img'): Element[] {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return [];
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    let parentElement: Element | null = null;
    if (commonAncestor instanceof Element) parentElement = commonAncestor;
    else if (commonAncestor.parentElement) parentElement = commonAncestor.parentElement;
    if (!parentElement) return [];
    const elements = parentElement.querySelectorAll(selectors);
    const elementsSelected: Element[] = [];
    elements.forEach(element => {
      if (range.intersectsNode(element)) elementsSelected.push(element);
    });
    return elementsSelected;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
          const imgSrc = e.target?.result as string;
          this.moveCursorToDropPosition(event);
          this.insertImageAtLastDropPosition(imgSrc);
        };
        reader.readAsDataURL(file);
      } else this._message.warning('IDEA_EDITOR.FILE_NOT_IMAGE');
    }
  }

  private insertImageAtLastDropPosition(imageUrl: string): void {
    if (this.lastDropPosition) {
      const imgElement = document.createElement('img');
      imgElement.src = imageUrl;
      this.lastDropPosition.insertNode(imgElement);
      this.lastDropPosition = null;

      const editor = this.editor?.textArea?.nativeElement as HTMLElement;
      const imagesSelected = editor.querySelectorAll('img');
      if (imagesSelected.length === 1) imagesSelected[0].removeAttribute('width');
      this.contentChange.emit(this.editor.textArea.nativeElement.innerHTML);
      this._cdr.markForCheck();
    }
  }
  private moveCursorToDropPosition(event: DragEvent): void {
    const root = this.editor?.textArea?.nativeElement as HTMLElement;
    if (!root) return;
    root.focus();
    const range =
      (document as any).caretRangeFromPoint?.(event.clientX, event.clientY) ??
      ((): Range => {
        const pos = (document as any).caretPositionFromPoint?.(event.clientX, event.clientY);
        if (pos) {
          const r = document.createRange();
          r.setStart(pos.offsetNode, pos.offset);
          r.collapse(true);
          return r;
        }
        return null;
      })();
    if (range) this.lastDropPosition = range;
  }
}
