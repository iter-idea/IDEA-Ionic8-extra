import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { ModalController, IonItem, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { Label, Languages, mdToHtml, StringVariable } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEALabelerComponent } from './labeler.component';
import { IDEAHiglightedVariablesPipe } from '../highlightedVariables.pipe';

/**
 * Manage the content of a Label.
 */
@Component({
  selector: 'idea-label',
  standalone: true,
  imports: [CommonModule, IDEAHiglightedVariablesPipe, IonItem, IonLabel, IonButton, IonIcon],
  template: `
    <ion-item
      class="labelItem"
      button
      [disabled]="isOpening"
      [color]="color"
      [lines]="lines"
      [title]="placeholder || ''"
      [class.withLabel]="label"
      (click)="edit()"
    >
      @if (icon) {
        <ion-button
          fill="clear"
          slot="start"
          [color]="iconColor"
          [class.marginTop]="label"
          (click)="doIconSelect($event)"
        >
          <ion-icon [icon]="icon" slot="icon-only" />
        </ion-button>
      }
      @if (label) {
        <ion-label position="stacked">
          {{ label }}
          @if (!disabled && obligatory) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <div class="description">
        @if (!htmlContent) {
          <div class="placeholder">{{ placeholder }}</div>
        }
        @if (htmlContent) {
          <div class="innerContent" [class.md]="markdown" [innerHTML]="htmlContent | highlight: variableCodes"></div>
        }
      </div>
      <ion-icon slot="end" icon="chevron-forward" class="selectIcon" />
    </ion-item>
  `,
  styles: [
    `
      .labelItem {
        min-height: 48px;
        height: auto;
        .description {
          min-height: 20px;
          height: auto;
          line-height: 20px;
          width: 100%;
        }
        .placeholder {
          color: var(--ion-color-medium);
          padding-bottom: 6px;
        }
        .selectIcon {
          color: var(--ion-text-color-step-500);
          font-size: 1.3em;
        }
      }
      .labelItem.withLabel {
        min-height: 58px;
        height: auto;
        .selectIcon {
          padding-top: 4px;
        }
        ion-button[slot='start'] {
          margin-top: 16px;
        }
      }
    `
  ]
})
export class IDEALabelComponent implements OnInit {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The label to manage.
   * Note: the name is set to not overlap with IDEA's components typical use of the attribute `label`.
   */
  @Input() content: Label;
  /**
   * The languages preferences; if not set, it fallbacks to IDEATranslationsService's ones.
   */
  @Input() languages: Languages;
  /**
   * Whether to display the label in textareas instead of text fields.
   */
  @Input() textarea: boolean;
  /**
   * Whether the label supports markdown.
   */
  @Input() markdown: boolean;
  /**
   * The variables the user can use in the label.
   */
  @Input() variables: StringVariable[];
  /**
   * The title (label) for the field.
   */
  @Input() label: string;
  /**
   * The icon for the field.
   */
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  @Input() iconColor: string;
  /**
   * A placeholder for the field.
   */
  @Input() placeholder: string;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * If true, the label is validated on save.
   */
  @Input() obligatory: boolean;

  @Output() change = new EventEmitter<void>();
  @Output() iconSelect = new EventEmitter<void>();

  variableCodes: string[];
  htmlContent: string;

  isOpening = false;

  ngOnInit(): void {
    this.languages = this.languages || this._translate.languages();
    this.variableCodes = (this.variables || []).map(x => x.code);
    this.calcHTMLContent();
  }

  async edit(): Promise<void> {
    if (this.isOpening) return;
    this.isOpening = true;
    const componentProps = {
      label: this.content,
      languages: this.languages,
      textarea: this.textarea,
      markdown: this.markdown,
      variables: this.variables,
      title: this.label,
      obligatory: this.obligatory,
      disabled: this.disabled,
      lines: this.lines
    };
    const modal = await this._modal.create({ component: IDEALabelerComponent, componentProps });
    modal.onDidDismiss().then(({ data }): void => {
      if (!data) return;
      this.calcHTMLContent();
      this.change.emit();
    });
    modal.present();
    this.isOpening = false;
  }

  private calcHTMLContent(): void {
    const str = this.content.translate(this.languages.default, this.languages);
    this.htmlContent = str && this.markdown ? mdToHtml(str) : str;
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
