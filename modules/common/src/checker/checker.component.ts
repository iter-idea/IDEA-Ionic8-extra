import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Check } from 'idea-toolbox';

import { IDEAChecksComponent } from './checks.component';
import { IDEATranslationsService } from '../translations/translations.service';

/**
 * Data can either be populated directly from the namesake attribute, passing an array of values, or through the
 * _dataProvider_, which is a function that returns a Promise<Array<Check>>, i.e. a promise with an array of
 * Checks fetched from somewhere.
 * Tip: to execute from another context, pass to the `idea-checker` an helper function like the following:
 * ```
 *   runInContext(methodName: string): any {
 *     return () => (<any>this)[methodName]();
 *   }
 * ```
 * using it then:
 * ```
 *   <idea-checker
 *     [dataProvider]="runInContext('method')"
 *   ></idea-checker>
 * ```
 */
@Component({
  selector: 'idea-checker',
  templateUrl: 'checker.component.html',
  styleUrls: ['checker.component.scss']
})
export class IDEACheckerComponent {
  /**
   * The checks to show.
   */
  @Input() public data: Array<Check>;
  /**
   *  Alternative to the case above; function that returns a Promise<Array<Check>>.
   */
  @Input() public dataProvider: any;
  /**
   * The label for the field.
   */
  @Input() public label: string;
  /**
   * The icon for the field.
   */
  @Input() public icon: string;
  /**
   * The color of the icon.
   */
  @Input() public iconColor: string;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public searchPlaceholder: string;
  /**
   * If true, show the string instead of the preview text.
   */
  @Input() public noPreviewText: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() public noElementsFoundText: string;
  /**
   * If true, no elements selected equals all the elements selected.
   */
  @Input() public noneEqualsAll: boolean;
  /**
   * If no element is selected, set this custom text.
   */
  @Input() public noneText: string;
  /**
   * If all the elements are selected, set this custom text.
   */
  @Input() public allText: string;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * If true, the field has a tappable effect when disabled.
   */
  @Input() public tappableWhenDisabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() public obligatory: boolean;
  /**
   * If true, sort alphabetically the data.
   */
  @Input() public sortData: boolean;
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  @Input() public numMaxElementsInPreview: number;
  /**
   * Whether to show an avatar aside each element.
   */
  @Input() public showAvatars: boolean;
  /**
   * URL to the fallback avatar to show in case the element's avatar isn't found.
   */
  @Input() public fallbackAvatar: string;
  /**
   * Whether to show the select/deselect all buttons.
   */
  @Input() public hideSelectDeselectAll: boolean;
  /**
   * On change event.
   */
  @Output() public change = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() public iconSelect = new EventEmitter<void>();

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {
    this.data = new Array<Check>();
    this.numMaxElementsInPreview = 4;
  }
  /**
   * Fetch the promised data from a function and set it before to open the checks.
   */
  public fetchDataAndOpenModal() {
    if (this.disabled) return;
    if (typeof this.dataProvider === 'function') {
      this.dataProvider()
        .then((data: Array<Check>) => {
          this.data = data;
          this.openChecker();
        })
        .catch(() => {}); // data will be empty
    } else this.openChecker();
  }
  /**
   * Open the checks modal and later fetch the selection (plain value).
   */
  protected openChecker() {
    if (this.disabled) return;
    // open the modal to let the user to check the desired items
    this.modalCtrl
      .create({
        component: IDEAChecksComponent,
        componentProps: {
          data: this.data,
          sortData: this.sortData,
          searchPlaceholder: this.searchPlaceholder,
          noElementsFoundText: this.noElementsFoundText,
          showAvatars: this.showAvatars,
          fallbackAvatar: this.fallbackAvatar,
          hideSelectDeselectAll: this.hideSelectDeselectAll
        }
      })
      .then(modal => {
        modal.onDidDismiss().then(res => (res && res.data ? this.change.emit() : null));
        modal.present();
      });
  }

  /**
   * Calculate the preview.
   */
  public getPreview(): string {
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
      else return this.t._('IDEA.CHECKER.NUM_ELEMENTS_SELECTED', { num: checked.length });
    }
  }

  /**
   * The icon was selected.
   */
  public doIconSelect(event: any) {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
