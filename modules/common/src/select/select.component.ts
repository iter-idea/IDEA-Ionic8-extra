import {
  Component,
  Input,
  SimpleChanges,
  OnChanges,
  inject,
  ChangeDetectionStrategy,
  output,
  input
} from '@angular/core';
import { ModalController, IonItem, IonLabel, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { Suggestion } from 'idea-toolbox';

import { IDEASuggestionsComponent } from './suggestions.component';

@Component({
  selector: 'idea-select',
  imports: [IonLabel, IonItem, IonButton, IonLabel, IonText, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input() set description(description: string) {
    this._description = description;
  }

  /**
   * The suggestions to show.
   */
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() data: Suggestion[] = [];
  /**
   * @deprecated Alternative to the case above; function that returns a Promise<Array<Suggestion>>.
   */
  readonly dataProvider = input<any>();
  /**
   * The label for the field.
   */
  // TODO: Skipped for migration because: This input is used in a control flow expression (e.g. `@if` or `*ngIf`) and migrating would break narrowing currently.
  @Input() label: string;
  /**
   * The icon for the field.
   */
  // TODO: Skipped for migration because: This input is used in a control flow expression (e.g. `@if` or `*ngIf`) and migrating would break narrowing currently.
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  readonly iconColor = input<string>();
  /**
   * A placeholder for the field.
   */
  readonly placeholder = input<string>();
  /**
   * A placeholder for the searchbar.
   */
  readonly searchPlaceholder = input<string>();
  /**
   * Text to show when there isn't a result.
   */
  readonly noElementsFoundText = input<string>();
  /**
   * If true, the component is disabled.
   */
  // TODO: Skipped for migration because: This input is used in a control flow expression (e.g. `@if` or `*ngIf`) and migrating would break narrowing currently.
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
   * Lines preferences for the item.
   */
  readonly lines = input<string>();
  /**
   * The color for the component.
   */
  readonly color = input<string>();
  /**
   * If true, allows to select a new custom value (outside the suggestions).
   */
  readonly allowUnlistedValues = input<boolean>();
  /**
   * If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
   */
  readonly allowUnlistedValuesPrefix = input<string>();
  /**
   * If true, sort the suggestions alphabetically.
   */
  readonly sortData = input<boolean>();
  /**
   * If true, clear the value of the field after a selection.
   */
  readonly clearValueAfterSelection = input<boolean>();
  /**
   * If true, doesn't show the id in the UI.
   */
  readonly hideIdFromUI = input<boolean>();
  /**
   * If true, doesn't show the clear button in the header.
   */
  readonly hideClearButton = input<boolean>();
  /**
   * If true, the user doesn't have the option to cancel the selection: an option must be chosen.
   */
  readonly mustChoose = input<boolean>();
  /**
   * A pre-filter for the category1.
   */
  readonly category1 = input<string>();
  /**
   * A pre-filter for the category2.
   */
  readonly category2 = input<string>();
  /**
   * Whether tho show the categories filters in the suggestions component.
   */
  readonly showCategoriesFilters = input<boolean>();
  /**
   * If true, doesn't let the auto-selection in case there's only one element as possible selection.
   */
  readonly avoidAutoSelection = input<boolean>();
  /**
   * On select event.
   */
  readonly select = output<Suggestion>();
  /**
   * Icon select.
   */
  readonly iconSelect = output<void>();
  /**
   * On select (with the field disabled) event.
   */
  readonly selectWhenDisabled = output<void>();

  isOpening = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.avoidAutoSelection() && (changes['data'] || changes['category1'] || changes['category2'])) {
      const filteredData = (this.data || [])
        .filter(x => {
          const category1 = this.category1();
          return !category1 || x.category1 === category1;
        })
        .filter(x => {
          const category2 = this.category2();
          return !category2 || x.category2 === category2;
        });
      if (filteredData.length === 1) {
        setTimeout((): void => {
          this.select.emit(filteredData[0].value ? filteredData[0] : new Suggestion());
        }, 500);
      }
    }
  }

  async fetchDataAndOpenModal(): Promise<void> {
    if (this.disabled) return;
    const dataProvider = this.dataProvider();
    if (typeof dataProvider === 'function') {
      try {
        this.data = await dataProvider();
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
        sortData: this.sortData(),
        searchPlaceholder: this.searchPlaceholder(),
        noElementsFoundText: this.noElementsFoundText(),
        allowUnlistedValues: this.allowUnlistedValues(),
        allowUnlistedValuesPrefix: this.allowUnlistedValuesPrefix(),
        clearValueAfterSelection: this.clearValueAfterSelection(),
        hideIdFromUI: this.hideIdFromUI(),
        hideClearButton: this.hideClearButton(),
        mustChoose: this.mustChoose(),
        category1: this.category1(),
        category2: this.category2(),
        showCategoriesFilters: this.showCategoriesFilters()
      },
      backdropDismiss: !this.mustChoose()
    });
    modal.onDidDismiss().then(({ data }): void => {
      // manage a cancel option (modal dismission or cancel button)
      if (data === undefined || data === null) return;
      // manage a reset ('') or a selection
      this.select.emit(String(data.value) ? data : new Suggestion());
      // render the suggestion selected
      if (this.clearValueAfterSelection()) this.description = '';
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
