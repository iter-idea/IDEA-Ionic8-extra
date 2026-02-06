import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges, inject } from '@angular/core';
import { ModalController, IonItem, IonLabel, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { Suggestion } from 'idea-toolbox';

import { IDEASuggestionsComponent } from './suggestions.component';

@Component({
  selector: 'idea-select',
  imports: [CommonModule, IonLabel, IonItem, IonButton, IonLabel, IonText, IonIcon],
  templateUrl: 'select.component.html',
  styleUrls: ['select.component.scss']
})
export class IDEASelectComponent implements OnChanges {
  private _modal = inject(ModalController);

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
  @Input() data: Suggestion[] = [];
  /**
   * @deprecated Alternative to the case above; function that returns a Promise<Array<Suggestion>>.
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
   * A placeholder for the field.
   */
  @Input() placeholder: string;
  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * Text to show when there isn't a result.
   */
  @Input() noElementsFoundText: string;
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
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * If true, allows to select a new custom value (outside the suggestions).
   */
  @Input() allowUnlistedValues: boolean;
  /**
   * If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
   */
  @Input() allowUnlistedValuesPrefix: string;
  /**
   * If true, sort the suggestions alphabetically.
   */
  @Input() sortData: boolean;
  /**
   * If true, clear the value of the field after a selection.
   */
  @Input() clearValueAfterSelection: boolean;
  /**
   * If true, doesn't show the id in the UI.
   */
  @Input() hideIdFromUI: boolean;
  /**
   * If true, doesn't show the clear button in the header.
   */
  @Input() hideClearButton: boolean;
  /**
   * If true, the user doesn't have the option to cancel the selection: an option must be chosen.
   */
  @Input() mustChoose: boolean;
  /**
   * A pre-filter for the category1.
   */
  @Input() category1: string;
  /**
   * A pre-filter for the category2.
   */
  @Input() category2: string;
  /**
   * Whether tho show the categories filters in the suggestions component.
   */
  @Input() showCategoriesFilters: boolean;
  /**
   * If true, doesn't let the auto-selection in case there's only one element as possible selection.
   */
  @Input() avoidAutoSelection: boolean;
  /**
   * On select event.
   */
  @Output() select = new EventEmitter<Suggestion>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();
  /**
   * On select (with the field disabled) event.
   */
  @Output() selectWhenDisabled = new EventEmitter<void>();

  isOpening = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.avoidAutoSelection && (changes['data'] || changes['category1'] || changes['category2'])) {
      const filteredData = (this.data || [])
        .filter(x => !this.category1 || x.category1 === this.category1)
        .filter(x => !this.category2 || x.category2 === this.category2);
      if (filteredData.length === 1) {
        setTimeout((): void => {
          this.select.emit(filteredData[0].value ? filteredData[0] : new Suggestion());
        }, 500);
      }
    }
  }

  async fetchDataAndOpenModal(): Promise<void> {
    if (this.disabled) return;
    if (typeof this.dataProvider === 'function') {
      try {
        this.data = await this.dataProvider();
        this.openSuggestions();
      } catch (error) {
        this.data = [];
      }
    } else this.openSuggestions();
  }
  private convertDataInSuggestions(): void {
    this.data = this.data.map((x: any): any =>
      x.value !== undefined && x.value !== null ? x : new Suggestion({ value: x })
    );
  }
  private async openSuggestions(): Promise<void> {
    if (this.disabled || this.isOpening) return;
    this.isOpening = true;
    this.convertDataInSuggestions();
    const modal = await this._modal.create({
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
    });
    modal.onDidDismiss().then(({ data }): void => {
      // manage a cancel option (modal dismission or cancel button)
      if (data === undefined || data === null) return;
      // manage a reset ('') or a selection
      this.select.emit(String(data.value) ? data : new Suggestion());
      // render the suggestion selected
      if (this.clearValueAfterSelection) this.description = '';
      else if (data.name) this.description = data.name;
      else this.description = data.value;
    });
    modal.present();
    this.isOpening = false;
  }

  doSelectWhenDisabled(): void {
    if (this.disabled) this.selectWhenDisabled.emit();
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
