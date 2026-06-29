import { Component, Input, inject, ChangeDetectionStrategy, output, input, model, signal } from '@angular/core';
import { ModalController, IonItem, IonLabel, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEAChecksComponent } from './checks.component';

@Component({
  selector: 'idea-checker',
  imports: [IonLabel, IonItem, IonButton, IonIcon, IonText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-item
      class="checkerItem"
      [color]="color()"
      [lines]="lines()"
      [title]="searchPlaceholder() || null"
      [button]="!disabled"
      [disabled]="isOpening()"
      [class.withLabel]="label"
      (click)="fetchDataAndOpenModal()"
    >
      @if (icon) {
        <ion-button
          fill="clear"
          slot="start"
          [color]="iconColor()"
          [class.marginTop]="label"
          (click)="doIconSelect($event)"
        >
          <ion-icon [icon]="icon" slot="icon-only" />
        </ion-button>
      }
      @if (label) {
        <ion-label position="stacked" [class.selectable]="!disabled || tappableWhenDisabled()">
          {{ label }}
          @if (obligatory() && !disabled) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <ion-label
        class="description"
        [class.selectable]="!disabled || tappableWhenDisabled()"
        [class.placeholder]="getPreview() === allText() || getPreview() === noneText() || noPreviewText()"
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
  readonly data = model<Check[]>([]);
  /**
   * @deprecated Alternative to the case above; function that returns a Promise<Array<Check>>.
   */
  readonly dataProvider = input<any>();
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
  readonly iconColor = input<string>();
  /**
   * A placeholder for the searchbar.
   */
  readonly searchPlaceholder = input<string>();
  /**
   * If true, show the string instead of the preview text.
   */
  readonly noPreviewText = input<string>();
  /**
   * The text to show in case no element is found after a search.
   */
  readonly noElementsFoundText = input<string>();
  /**
   * If true, no elements selected equals all the elements selected.
   */
  readonly noneEqualsAll = input<boolean>();
  /**
   * If no element is selected, set this custom text.
   */
  readonly noneText = input<string>();
  /**
   * If all the elements are selected, set this custom text.
   */
  readonly allText = input<string>();
  /**
   * The translation key to get the preview text; it has a `num` variable available.
   */
  readonly previewTextKey = input('IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED');
  /**
   * Lines preferences for the item.
   */
  readonly lines = input<string>();
  /**
   * The color for the component.
   */
  readonly color = input<string>();
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * If true, the field has a tappable effect when disabled.
   */
  readonly tappableWhenDisabled = input<boolean>();
  /**
   * If true, the obligatory dot is shown.
   */
  readonly obligatory = input<boolean>();
  /**
   * If true, sort alphabetically the data.
   */
  readonly sortData = input<boolean>();
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  readonly numMaxElementsInPreview = input(4);
  /**
   * Whether to show an avatar aside each element.
   */
  readonly showAvatars = input<boolean>();
  /**
   * Limit the number of selectable elements to the value provided.
   * Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
   */
  readonly limitSelectionToNum = input<number>();
  /**
   * Whether to allow the select/deselect-all buttons.
   */
  readonly allowSelectDeselectAll = input<boolean>();
  /**
   * A pre-filter for the category1.
   */
  readonly category1 = input<string>();
  /**
   * A pre-filter for the category2.
   */
  readonly category2 = input<string>();
  /**
   * Whether tho show the categories filters.
   */
  readonly showCategoriesFilters = input<boolean>();
  /**
   * On change event.
   */
  readonly change = output<void>();
  /**
   * Icon select.
   */
  readonly iconSelect = output<void>();

  isOpening = signal<boolean>(false);

  async fetchDataAndOpenModal(): Promise<void> {
    if (this.disabled) return;
    const dataProvider = this.dataProvider();
    if (typeof dataProvider === 'function') {
      try {
        this.data.set(await dataProvider());
        this.openChecker();
      } catch (error) {
        this.data.set([]);
      }
    } else this.openChecker();
  }
  private async openChecker(): Promise<void> {
    if (this.disabled || this.isOpening()) return;
    this.isOpening.set(true);
    const modal = await this._modal.create({
      component: IDEAChecksComponent,
      componentProps: {
        data: this.data(),
        sortData: this.sortData(),
        searchPlaceholder: this.searchPlaceholder(),
        noElementsFoundText: this.noElementsFoundText(),
        showAvatars: this.showAvatars(),
        allowSelectDeselectAll: this.allowSelectDeselectAll(),
        limitSelectionToNum: this.limitSelectionToNum(),
        category1: this.category1(),
        category2: this.category2(),
        showCategoriesFilters: this.showCategoriesFilters(),
        previewTextKey: this.previewTextKey()
      }
    });
    modal.onDidDismiss().then(({ data }): void => {
      if (data) this.change.emit();
      // the modal mutates the checks in place (same array reference), so set a fresh array
      // to notify the signal and let the preview reflect the new selection
      this.data.update(checks => [...checks]);
    });
    modal.present();
    this.isOpening.set(false);
  }

  getPreview(): string {
    const data = this.data();
    if (!data || !data.length) return null;
    const noPreviewText = this.noPreviewText();
    if (noPreviewText) return noPreviewText;
    const allText = this.allText();
    if (allText && (data.every(x => x.checked) || (data.every(x => !x.checked) && this.noneEqualsAll())))
      return allText;
    else {
      const checked = data.filter(x => x.checked);
      const noneText = this.noneText();
      if (noneText && checked.length === 0) return noneText;
      if (checked.length <= this.numMaxElementsInPreview())
        return data
          .filter(x => x.checked)
          .slice(0, this.numMaxElementsInPreview())
          .map(x => x.name)
          .join(', ');
      else return this._translate._(this.previewTextKey(), { num: checked.length });
    }
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
