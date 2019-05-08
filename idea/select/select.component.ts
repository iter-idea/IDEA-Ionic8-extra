import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { IDEASuggestionsComponent, Suggestion } from './suggestions.component';

/**
 * Useful configurations
 *    1. Picker:             [data], (select), [clearValueAfterSelection]
 *    2. Strict:             [data], (select), [description]
 *    3. Allow loose values: [data], (select), [description], [allowUnlistedValues]
 *
 * Data can either be populated directly from the namesake attribute, passing an array of values, or through the
 * _dataProvider_, which is a function that returns a Promise<Array<Suggestion>>, i.e. a promise with an array of
 * Suggestions fetched from somewhere.
 * Tip: to execute from another context, pass to the `idea-select` an helper function like the following:
 * ```
    runInContext(methodName: string): any {
      return () => (<any>this)[methodName]();
    }
   ```
 * using it then:
 * ```
    <idea-select
      [dataProvider]="runInContext('method')"
    ></idea-select>
 * ```
 */
@Component({
  selector: 'idea-select',
  templateUrl: 'select.component.html',
  styleUrls: ['select.component.scss']
})
export class IDEASelectComponent {
  /**
   * The description to show in the field.
   * Set the property so it detects changes.
   */
  private _description: string;
  get description(): string { return this._description; }
  @Input() set description(description: string) { this._description = description; }

  /**
   * The suggestions to show.
   */
  @Input() protected data: Array<Suggestion>;
  /**
   *  Alternative to the case above; function that returns a Promise<Array<Suggestion>>.
   */
  @Input() protected dataProvider: any;
  @Input() protected label: string;
  @Input() protected icon: string;
  @Input() protected placeholder: string;
  @Input() protected searchPlaceholder: string;
  @Input() protected noElementsFoundText: string;
  @Input() protected disabled: boolean;
  @Input() protected tappableWhenDisabled: boolean;
  @Input() protected obligatory: boolean;
  @Input() protected lines: string;
  @Input() protected allowUnlistedValues: boolean;
  @Input() protected sortData: boolean;
  @Input() protected clearValueAfterSelection: boolean;
  @Input() protected hideIdFromUI: boolean;
  @Input() protected hideClearButton: boolean;
  @Output() protected select = new EventEmitter<Suggestion>();
  @Output() protected selectWhenDisabled = new EventEmitter<void>();

  constructor(protected modalCtrl: ModalController) {
    this.data = new Array<Suggestion>();
  }

  /**
   * Fetch the promised data from a function and set it before to open the suggestions.
   */
  protected fetchDataAndOpenModal() {
    if (this.disabled) return;
    if (typeof this.dataProvider === 'function') {
      this.dataProvider()
      .then((data: Array<Suggestion>) => {
        this.data = data;
        this.openSuggestions();
      })
      .catch(() => {}); // data will be empty
    } else this.openSuggestions();
  }
  /**
   * Automatically convers data into Suggestions (from plain strings, numbers, etc.).
   */
  private convertDataInSuggestions() {
    this.data = this.data.map((x: any) => x.value ? x : new Suggestion(x));
  }
  /**
   * Open the suggestions modal and later fetch the selection (plain value).
   */
  private openSuggestions() {
    if (this.disabled) return;
    // convert optional plain values in Suggestions
    this.convertDataInSuggestions();
    // open the modal to let the user pick a suggestion
    this.modalCtrl.create({
      component: IDEASuggestionsComponent,
      componentProps: {
        data: this.data, sortData: this.sortData, searchPlaceholder: this.searchPlaceholder,
        noElementsFoundText: this.noElementsFoundText, allowUnlistedValues: this.allowUnlistedValues,
        clearValueAfterSelection: this.clearValueAfterSelection, hideIdFromUI: this.hideIdFromUI,
        hideClearButton: this.hideClearButton
      }
    })
    .then(modal => {
      modal.onDidDismiss()
      .then((selection: any) => {
        // manage a cancel option (modal dismission or cancel button)
        if (selection.data === undefined || selection.data === null) return;
        // manage a reset ('') or a selection
        this.select.emit(selection.data.value ? selection.data : new Suggestion());
        // render the suggestion selected
        if (this.clearValueAfterSelection) this.description = '';
        else if (selection.data.value) this.description = selection.data.value;
        else this.description = selection.data.value;
      });
      modal.present();
    });
  }

  /**
   * Emit the selection while the component is in viewMode.
   */
  protected doSelectWhenDisabled() {
    if (this.disabled) this.selectWhenDisabled.emit();
  }
}
