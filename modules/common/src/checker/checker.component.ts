import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEAChecksComponent } from './checks.component';

@Component({
  selector: 'idea-checker',
  templateUrl: 'checker.component.html',
  styleUrls: ['checker.component.scss']
})
export class IDEACheckerComponent {
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
   * Lines preferences for the item.
   */
  @Input() lines: string;
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

  constructor(private modalCtrl: ModalController, public t: IDEATranslationsService) {}
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
    if (this.disabled) return;
    const modal = await this.modalCtrl.create({
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
        showCategoriesFilters: this.showCategoriesFilters
      }
    });
    modal.onDidDismiss().then(({ data }): void => (data ? this.change.emit() : null));
    modal.present();
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
      else return this.t._('IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED', { num: checked.length });
    }
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
