import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ModalController, IonItem, IonButton, IonIcon, IonLabel, IonText } from '@ionic/angular/standalone';
import { Label } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';

import { IDEAListElementsComponent } from './listElements.component';

@Component({
  selector: 'idea-list',
  standalone: true,
  imports: [CommonModule, IDEATranslatePipe, IonItem, IonButton, IonIcon, IonLabel, IonText],
  template: `
    <ion-item
      class="listItem"
      [color]="color"
      [lines]="lines"
      [button]="!disabled"
      [disabled]="isOpening"
      [title]="placeholder || ''"
      [class.withLabel]="label"
      (click)="openList()"
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
        <ion-label position="stacked" [class.selectable]="!disabled">
          {{ label }}
          @if (obligatory && !disabled) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <ion-label
        class="description"
        [class.selectable]="!disabled"
        [class.placeholder]="!getPreview() || noPreviewText"
      >
        {{ getPreview() || placeholder }}
      </ion-label>
      @if (!disabled) {
        <ion-icon slot="end" icon="caret-down" class="selectIcon" [class.selectable]="!disabled" />
      }
    </ion-item>
  `,
  styles: [
    `
      .listItem {
        min-height: 48px;
        height: auto;
        .description {
          margin: 10px 0;
          height: 20px;
          line-height: 20px;
          width: 100%;
        }
        .placeholder {
          color: var(--ion-color-medium);
        }
        .selectIcon {
          margin: 0;
          padding-left: 4px;
          font-size: 0.8em;
          color: var(--ion-color-medium);
        }
      }
      .listItem.withLabel {
        min-height: 58px;
        height: auto;
        .selectIcon {
          padding-top: 25px;
        }
        ion-icon[slot='start'] {
          margin-top: 16px;
        }
      }
      .selectable {
        cursor: pointer;
      }
    `
  ]
})
export class IDEAListComponent {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The list to manage.
   */
  @Input() data: (Label | string)[] = [];
  /**
   * Whether the elements are labels or simple strings.
   */
  @Input() labelElements: boolean;
  /**
   * The label for the field.
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
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * Text to show when there isn't a result.
   */
  @Input() noElementsFoundText: string;
  /**
   * If true, show the string instead of the preview text.
   */
  @Input() noPreviewText: string;
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
   * If true, the obligatory dot is shown.
   */
  @Input() obligatory: boolean;
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  @Input() numMaxElementsInPreview = 4;
  /**
   * On change event.
   */
  @Output() change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();

  isOpening = false;

  async openList(): Promise<void> {
    if (this.disabled || this.isOpening) return;
    this.isOpening = true;
    const modal = await this._modal.create({
      component: IDEAListElementsComponent,
      componentProps: {
        data: this.data,
        labelElements: this.labelElements,
        searchPlaceholder: this.searchPlaceholder,
        noElementsFoundText: this.noElementsFoundText
      }
    });
    modal.onDidDismiss().then(({ data }): void => (data ? this.change.emit() : null));
    modal.present();
    this.isOpening = false;
  }

  getPreview(): string {
    if (!this.data || !this.data.length) return null;
    if (this.noPreviewText) return this.noPreviewText;
    if (this.data.length <= this.numMaxElementsInPreview)
      return this.data
        .slice(0, this.numMaxElementsInPreview)
        .map(x => this.getElementName(x))
        .join(', ');
    else return this._translate._('IDEA_COMMON.LIST.NUM_ELEMENTS_', { num: this.data.length });
  }
  getElementName(x: Label | string): any {
    return this.labelElements
      ? (x as Label).translate(this._translate.getCurrentLang(), this._translate.languages())
      : x;
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
