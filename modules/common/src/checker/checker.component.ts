import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ModalController, IonItem, IonLabel, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEAChecksComponent } from './checks.component';

@Component({
  selector: 'idea-checker',
  imports: [CommonModule, IonLabel, IonItem, IonButton, IonIcon, IonText],
  template: `
    <ion-item
      class="checkerItem"
      [color]="color"
      [lines]="lines"
      [title]="searchPlaceholder || null"
      [button]="!disabled"
      [disabled]="isOpening"
      [class.withLabel]="label"
      (click)="fetchDataAndOpenModal()"
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
        <ion-label position="stacked" [class.selectable]="!disabled || tappableWhenDisabled">
          {{ label }}
          @if (obligatory && !disabled) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <ion-label
        class="description"
        [class.selectable]="!disabled || tappableWhenDisabled"
        [class.placeholder]="getPreview() === allText || getPreview() === noneText || noPreviewText"
      >
        {{ getPreview() }}
      </ion-label>
      @if (!disabled) {
        <ion-icon slot="end" icon="caret-down" class="selectIcon" [class.selectable]="!disabled" />
      }
    </ion-item>
  `,
  styles: [
    `
      .checkerItem {
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
      .checkerItem.withLabel {
        min-height: 58px;
        height: auto;
        .selectIcon {
          padding-top: 25px;
        }
        ion-button[slot='start'] {
          margin-top: 16px;
        }
      }
      .selectable {
        cursor: pointer;
      }
    `
  ]
})
export class IDEACheckerComponent {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The checks to show.
   */
  @Input() data: Check[] = [];
  /**
   * @deprecated Alternative to the case above; function that returns a Promise<Array<Check>>.
   */
  @Input() dataProvider: any;
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
   * If true, show the string instead of the preview text.
   */
  @Input() noPreviewText: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() noElementsFoundText: string;
  /**
   * If true, no elements selected equals all the elements selected.
   */
  @Input() noneEqualsAll: boolean;
  /**
   * If no element is selected, set this custom text.
   */
  @Input() noneText: string;
  /**
   * If all the elements are selected, set this custom text.
   */
  @Input() allText: string;
  /**
   * The translation key to get the preview text; it has a `num` variable available.
   */
  @Input() previewTextKey = 'IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED';
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
   * If true, the field has a tappable effect when disabled.
   */
  @Input() tappableWhenDisabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() obligatory: boolean;
  /**
   * If true, sort alphabetically the data.
   */
  @Input() sortData: boolean;
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  @Input() numMaxElementsInPreview = 4;
  /**
   * Whether to show an avatar aside each element.
   */
  @Input() showAvatars: boolean;
  /**
   * Limit the number of selectable elements to the value provided.
   * Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
   */
  @Input() limitSelectionToNum: number;
  /**
   * Whether to allow the select/deselect-all buttons.
   */
  @Input() allowSelectDeselectAll: boolean;
  /**
   * A pre-filter for the category1.
   */
  @Input() category1: string;
  /**
   * A pre-filter for the category2.
   */
  @Input() category2: string;
  /**
   * Whether tho show the categories filters.
   */
  @Input() showCategoriesFilters: boolean;
  /**
   * On change event.
   */
  @Output() change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();

  isOpening = false;

  async fetchDataAndOpenModal(): Promise<void> {
    if (this.disabled) return;
    if (typeof this.dataProvider === 'function') {
      try {
        this.data = await this.dataProvider();
        this.openChecker();
      } catch (error) {
        this.data = [];
      }
    } else this.openChecker();
  }
  private async openChecker(): Promise<void> {
    if (this.disabled || this.isOpening) return;
    this.isOpening = true;
    const modal = await this._modal.create({
      component: IDEAChecksComponent,
      componentProps: {
        data: this.data,
        sortData: this.sortData,
        searchPlaceholder: this.searchPlaceholder,
        noElementsFoundText: this.noElementsFoundText,
        showAvatars: this.showAvatars,
        allowSelectDeselectAll: this.allowSelectDeselectAll,
        limitSelectionToNum: this.limitSelectionToNum,
        category1: this.category1,
        category2: this.category2,
        showCategoriesFilters: this.showCategoriesFilters,
        previewTextKey: this.previewTextKey
      }
    });
    modal.onDidDismiss().then(({ data }): void => (data ? this.change.emit() : null));
    modal.present();
    this.isOpening = false;
  }

  getPreview(): string {
    if (!this.data || !this.data.length) return null;
    if (this.noPreviewText) return this.noPreviewText;
    if (this.allText && (this.data.every(x => x.checked) || (this.data.every(x => !x.checked) && this.noneEqualsAll)))
      return this.allText;
    else {
      const checked = this.data.filter(x => x.checked);
      if (this.noneText && checked.length === 0) return this.noneText;
      if (checked.length <= this.numMaxElementsInPreview)
        return this.data
          .filter(x => x.checked)
          .slice(0, this.numMaxElementsInPreview)
          .map(x => x.name)
          .join(', ');
      else return this._translate._(this.previewTextKey, { num: checked.length });
    }
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
