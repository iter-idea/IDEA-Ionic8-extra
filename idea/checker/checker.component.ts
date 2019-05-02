import { Component, Input } from '@angular/core';
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
  @Input() protected data: Array<Check>;
  /**
   *  Function that returns a Promise<Array<IDEACheck>>.
   */
  @Input() protected dataProvider: any;
  /**
   * A placeholder for the searchbar.
   */
  @Input() protected placeholder: string;
  /**
   * If true, show the string instead of the preview text.
   */
  @Input() protected noPreviewText: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() protected noElementsFoundText: string;
  /**
   * If true, no elements selected equals all the elements selected.
   */
  @Input() protected noneEqualsAll: boolean;
  /**
   * If true, the component is disabled.
   */
  @Input() protected disabled: boolean;
  /**
   * If true, sort alphabetically the data.
   */
  @Input() protected sortData: boolean;
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  @Input() protected numMaxElementsInPreview: number;

  constructor(
    protected modalCtrl: ModalController,
    protected t: TranslateService
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
  protected fetchDataAndOpenModal() {
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
  private openChecker() {
    if (this.disabled) return;
    // open the modal to let the user to check the desired items
    this.modalCtrl.create({
      component: IDEAChecksComponent,
      componentProps: {
        data: this.data, sortData: this.sortData, placeholder: this.placeholder,
        noElementsFoundText: this.noElementsFoundText
      }
    })
    .then(modal => modal.present());
  }

  /**
   * Calculate the preview
   */
  protected getPreview(): string {
    if (!this.data || !this.data.length) return null;
    if (this.noPreviewText) return this.noPreviewText;
    if (this.data.every(x => x.checked) || (this.data.every(x => !x.checked) && this.noneEqualsAll))
      return this.t.instant('IDEA.CHECKER.ALL');
    else {
      const checked = this.data.filter(x => x.checked);
      if (checked.length === 0) return this.t.instant('IDEA.CHECKER.NONE');
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