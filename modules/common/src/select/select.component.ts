import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Suggestion } from 'idea-toolbox';

import { IDEASuggestionsComponent } from './suggestions.component';

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
 *  runInContext(methodName: string): any {
 *     return () => (<any>this)[methodName]();
 *   }
 *  ```
 * using it then:
 * ```
 *   <idea-select
 *     [dataProvider]="runInContext('method')"
 *   ></idea-select>
 * ```
 */
@Component({
  selector: 'idea-select',
  templateUrl: 'select.component.html',
  styleUrls: ['select.component.scss']
})
export class IDEASelectComponent implements OnChanges {
  /**
   * The description to show in the field.
   * Set the property so it detects changes.
   */
  protected _description: string;
  get description(): string {
    return this._description;
  }
  @Input() set description(description: string) {
    this._description = description;
  }

  /**
   * The suggestions to show.
   */
  @Input() public data: Suggestion[];
  /**
   *  Alternative to the case above; function that returns a Promise<Array<Suggestion>>.
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
   * A placeholder for the field.
   */
  @Input() public placeholder: string;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public searchPlaceholder: string;
  /**
   * Text to show when there isn't a result.
   */
  @Input() public noElementsFoundText: string;
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
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * If true, allows to select a new custom value (outside the suggestions).
   */
  @Input() public allowUnlistedValues: boolean;
  /**
   * If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
   */
  @Input() public allowUnlistedValuesPrefix: string;
  /**
   * If true, sort the suggestions alphabetically.
   */
  @Input() public sortData: boolean;
  /**
   * If true, clear the value of the field after a selection.
   */
  @Input() public clearValueAfterSelection: boolean;
  /**
   * If true, doesn't show the id in the UI.
   */
  @Input() public hideIdFromUI: boolean;
  /**
   * If true, doesn't show the clear button in the header.
   */
  @Input() public hideClearButton: boolean;
  /**
   * If true, the user doesn't have the option to cancel the selection: an option must be chosen.
   */
  @Input() public mustChoose: boolean;
  /**
   * A pre-filter for the category1.
   */
  @Input() public category1: string;
  /**
   * A pre-filter for the category2.
   */
  @Input() public category2: string;
  /**
   * Whether tho show the categories filters in the suggestions component.
   */
  @Input() public showCategoriesFilters: boolean;
  /**
   * If true, doesn't let the auto-selection in case there's only one element as possible selection.
   */
  @Input() public avoidAutoSelection: boolean;
  /**
   * On select event.
   */
  @Output() public select = new EventEmitter<Suggestion>();
  /**
   * Icon select.
   */
  @Output() public iconSelect = new EventEmitter<void>();
  /**
   * On select (with the field disabled) event.
   */
  @Output() public selectWhenDisabled = new EventEmitter<void>();

  constructor(public modalCtrl: ModalController) {
    this.data = new Array<Suggestion>();
  }

  /**
   * Check changes and apply auto-selection if available.
   */
  public ngOnChanges(changes: SimpleChanges) {
    // load the resources and prepare the suggestions
    if (!this.avoidAutoSelection && (changes['data'] || changes['category1'] || changes['category2'])) {
      const filteredData = (this.data || [])
        .filter(x => !this.category1 || x.category1 === this.category1)
        .filter(x => !this.category2 || x.category2 === this.category2);
      if (filteredData.length === 1) {
        setTimeout(() => {
          this.select.emit(filteredData[0].value ? filteredData[0] : new Suggestion());
        }, 500);
      }
    }
  }

  /**
   * Fetch the promised data from a function and set it before to open the suggestions.
   */
  public fetchDataAndOpenModal() {
    if (this.disabled) return;
    if (typeof this.dataProvider === 'function') {
      this.dataProvider()
        .then((data: Suggestion[]) => {
          this.data = data;
          this.openSuggestions();
        })
        .catch(() => {}); // data will be empty
    } else this.openSuggestions();
  }
  /**
   * Automatically convers data into Suggestions (from plain strings, numbers, etc.).
   */
  protected convertDataInSuggestions() {
    this.data = this.data.map((x: any) =>
      x.value !== undefined && x.value !== null ? x : new Suggestion({ value: x })
    );
  }
  /**
   * Open the suggestions modal and later fetch the selection (plain value).
   */
  protected openSuggestions() {
    if (this.disabled) return;
    // convert optional plain values in Suggestions
    this.convertDataInSuggestions();
    // open the modal to let the user pick a suggestion
    this.modalCtrl
      .create({
        component: IDEASuggestionsComponent,
        componentProps: {
          data: this.data,
          sortData: this.sortData,
          searchPlaceholder: this.searchPlaceholder,
          noElementsFoundText: this.noElementsFoundText,
          allowUnlistedValues: this.allowUnlistedValues,
          allowUnlistedValuesPrefix: this.allowUnlistedValuesPrefix,
          clearValueAfterSelection: this.clearValueAfterSelection,
          hideIdFromUI: this.hideIdFromUI,
          hideClearButton: this.hideClearButton,
          mustChoose: this.mustChoose,
          category1: this.category1,
          category2: this.category2,
          showCategoriesFilters: this.showCategoriesFilters
        },
        backdropDismiss: !this.mustChoose
      })
      .then(modal => {
        modal.onDidDismiss().then((selection: any) => {
          // manage a cancel option (modal dismission or cancel button)
          if (selection.data === undefined || selection.data === null) return;
          // manage a reset ('') or a selection
          this.select.emit(String(selection.data.value) ? selection.data : new Suggestion());
          // render the suggestion selected
          if (this.clearValueAfterSelection) this.description = '';
          else if (selection.data.name) this.description = selection.data.name;
          else this.description = selection.data.value;
        });
        modal.present();
      });
  }

  /**
   * Emit the selection while the component is in viewMode.
   */
  public doSelectWhenDisabled() {
    if (this.disabled) this.selectWhenDisabled.emit();
  }

  /**
   * The icon was selected.
   */
  public doIconSelect(event: any) {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
