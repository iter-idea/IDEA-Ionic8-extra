import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { IDEAChecksComponent } from './checks.component';

/**
 * Data can either be populated directly from the namesake attribute, passing an array of values, or through the
 * _dataProvider_, which is a function that returns a Promise<Array<Check>>, i.e. a promise with an array of
 * Checks fetched from somewhere.
 * Tip: to execute from another context, pass to the `idea-checker` an helper function like the following:
 * ```
    runInContext(methodName: string): any {
      return () => (<any>this)[methodName]();
    }
   ```
 * using it then:
 * ```
    <idea-checker
      [dataProvider]="runInContext('method')"
    ></idea-checker>
 * ```
 */
@Component({
  selector: 'idea-checker',
  templateUrl: 'checker.component.html',
  styleUrls: ['checker.component.scss'],
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
   * The icon (alternative to the label) for the field.
   */
  @Input() public icon: string;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public placeholder: string;
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
   * On change event.
   */
  @Output() public change = new EventEmitter<void>();

  constructor(
    public modalCtrl: ModalController,
    public t: TranslateService
  ) {
    this.data = new Array<Check>();
    this.placeholder = null;
    this.noElementsFoundText = null;
    this.noPreviewText = null;
    this.noneEqualsAll = false;
    this.disabled = false;
    this.sortData = false;
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
    this.modalCtrl.create({
      component: IDEAChecksComponent,
      componentProps: {
        data: this.data, sortData: this.sortData, placeholder: this.placeholder,
        noElementsFoundText: this.noElementsFoundText
      }
    })
    .then(modal => {
      modal.onDidDismiss().then(res => res && res.data ? this.change.emit() : null);
      modal.present();
    });
  }

  /**
   * Calculate the preview
   */
  public getPreview(): string {
    if (!this.data || !this.data.length) return null;
    if (this.noPreviewText) return this.noPreviewText;
    if (this.data.every(x => x.checked) || (this.data.every(x => !x.checked) && this.noneEqualsAll))
      return this.allText || this.t.instant('IDEA.CHECKER.ALL');
    else {
      const checked = this.data.filter(x => x.checked);
      if (checked.length === 0) return this.noneText || this.t.instant('IDEA.CHECKER.NONE');
      if (checked.length <= this.numMaxElementsInPreview)
        return this.data
          .filter(x => x.checked)
          .slice(0, this.numMaxElementsInPreview)
          .map(x => x.name)
          .join(', ');
      else return this.t.instant('IDEA.CHECKER.NUM_ELEMENTS_SELECTED', { num: checked.length });
    }
  }
}

export class Check {
  /**
   * The unique identifier for the check element.
   */
  public value: string | number;
  /**
   * Displayed name (description) of the check element.
   */
  public name: string;
  /**
   * Whether the check is true or false.
   */
  public checked: boolean;
  /**
   * Elements not included in the current search because of other filters.
   */
  public hidden: boolean;

  constructor(x?: any) {
    x = x || <Check> {};
    if (typeof x !== 'object') {
      this.value = x;
      this.name = String(x);
      this.checked = false;
      this.hidden = false;
    } else {
      this.value = x.value;
      this.name = x.name ? String(x.name) : String(this.value);
      this.checked = Boolean(x.checked);
      this.hidden = Boolean(x.hidden);
    }
  }
}