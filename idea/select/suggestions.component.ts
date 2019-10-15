import { Component, HostListener, Input, ViewChild, SimpleChanges } from '@angular/core';
import { ModalController, IonSearchbar } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'idea-suggestions',
  templateUrl: 'suggestions.component.html',
  styleUrls: ['suggestions.component.scss']
})
export class IDEASuggestionsComponent {
  /**
   * The suggestions to show.
   */
  @Input() public data: Array<Suggestion>;
  /**
   * If true, sort the suggestions alphabetically.
   */
  @Input() public sortData: boolean;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public searchPlaceholder: string;
  /**
   * Text to show when there isn't a result.
   */
  @Input() public noElementsFoundText: string;
  /**
   * If true, allows to select a new custom value (outside the suggestions).
   */
  @Input() public allowUnlistedValues: boolean;
  /**
   * If true, doesn't show the id in the UI.
   */
  @Input() public hideIdFromUI: boolean;
  /**
   * If true, doesn't show the clear button in the header.
   */
  @Input() public hideClearButton: boolean;
  /**
   * A pre-filter for the category1.
   */
  @Input() public category1: string;
  /**
   * A pre-filter for the category2.
   */
  @Input() public category2: string;

  public suggestions: Array<Suggestion>;
  public activeCategories1: Set<string>;
  public activeCategories2: Set<string>;

  @ViewChild(IonSearchbar, { static: true }) public searchbar: IonSearchbar;

  constructor(public modalCtrl: ModalController, public t: TranslateService) {}
  public ngOnInit() {
    this.data = this.data || new Array<Suggestion>();
    this.suggestions = new Array<any>();
    // sort the data, if requested
    if (this.sortData)
      this.data = this.data.sort((a, b) =>
        a.name && b.name ? a.name.localeCompare(b.name) : a.value.localeCompare(b.value)
      );
    // define categories based on the data
    this.loadActiveCategories();
    // show the suggestions based on the data
    this.getSuggestions();
  }
  public ionViewDidEnter() {
    // focus on the searchbar
    this.searchbar.setFocus();
  }
  /**
   * Load the active categories (i.e. the ones that are at least in one activity).
   */
  public loadActiveCategories() {
    this.activeCategories1 = new Set<string>();
    this.activeCategories2 = new Set<string>();
    this.data.forEach(a => {
      if (a.category1) this.activeCategories1.add(a.category1);
      if (a.category2) this.activeCategories2.add(a.category2);
    });
  }
  /**
   * Helper to get in the template a sorted array of suggestions out of a set
   */
  public mapIntoSuggestions(set: Set<string>): Array<Suggestion> {
    return Array.from(set)
      .sort()
      .map(x => new Suggestion(x));
  }
  /**
   * Get suggestions while typing into the input.
   */
  public getSuggestions(ev?: any) {
    // acquire and clean the searchTerm
    let searchTerm = ev && ev.target ? ev.target.value || '' : '';
    if (searchTerm.trim() === '') searchTerm = '';
    // load the suggestions
    this.suggestions = (this.data || [])
      .filter(x => !this.category1 || x.category1 === this.category1)
      .filter(x => !this.category2 || x.category2 === this.category2)
      .filter(
        (x: Suggestion) =>
          x.value
            .concat(x.name || '')
            .concat(x.category1 || '')
            .concat(x.category2 || '')
            .toLowerCase()
            .indexOf(searchTerm.toLowerCase()) >= 0
      );
  }
  /**
   * Set a filter for the categoryN acquiring the autoComplete suggestion selected.
   * Note: setting a filter with the same value will reset it (toggle function).
   */
  public setFilterCategoryN(whichCategory: number, value: string, event?: any) {
    // stop the event propagation, to avoid the "click" on the main item
    if (event) event.stopPropagation();
    // set the right category
    if (whichCategory === 2) this.category2 = value === this.category2 ? null : value;
    else this.category1 = value === this.category1 ? null : value;
    // get the suggestions
    this.getSuggestions();
  }

  /**
   * Close the component propagating the choice:
   *    - selection === undefined -> cancel
   *    - selection === null -> clear
   *    - otherwise, a suggestion was selected
   */
  public select(selection?: Suggestion | any) {
    this.modalCtrl.dismiss(selection);
  }

  /**
   * Manage the component with the keyboard.
   */
  @HostListener('window:keydown', ['$event'])
  public navigateComponent(event: KeyboardEvent) {
    // identify the suggestions list
    let suggestionsList: any;
    if (document.getElementsByClassName('suggestionsList').length)
      suggestionsList = document.getElementsByClassName('suggestionsList')[0];
    // identify the action to execute based on the key pressed
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        // quick confirm of the selection, based on what is on in the component
        if (suggestionsList && suggestionsList.getElementsByClassName('selected').length) {
          if (suggestionsList.getElementsByClassName('selected')[0].getElementsByClassName('key').length)
            this.select(
              this.data.find(
                x =>
                  x.value ===
                  suggestionsList
                    .getElementsByClassName('selected')[0]
                    .getElementsByClassName('key')[0]
                    .innerHTML.trim()
              )
            ); // selected || loose value
        } else if (this.suggestions.length === 0) this.select();
        // cancel
        else this.select(this.suggestions[0]); // first element
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        if (!suggestionsList) return;
        // identify the currently selected suggestion or select the first one
        let selected = null;
        let elements = suggestionsList.getElementsByClassName('selected');
        if (elements.length) {
          // a suggestion was already selected: go to the next/previous one
          selected = elements[0];
          if (selected) {
            selected.classList.remove('selected');
            if (event.key === 'ArrowDown') selected = selected.nextElementSibling;
            else selected = selected.previousElementSibling;
          }
        } else {
          // no suggestions selected yet: select the first one
          elements = suggestionsList.getElementsByClassName('suggestion');
          if (elements.length) selected = elements[0];
        }
        // execute the selection
        if (selected) selected.classList.add('selected');
        break;
    }
  }
}

/**
 * A suggestion made to appear as value to select.
 */
export class Suggestion {
  public value: any;
  public name: any;
  public category1: any;
  public category2: any;

  constructor(value?: any, name?: any, category1?: any, category2?: any) {
    this.value = value || null;
    this.name = name || null;
    this.category1 = category1 || null;
    this.category2 = category2 || null;
  }

  /**
   * Clear the suggestion.
   */
  public clear() {
    this.value = null;
    this.name = null;
    this.category1 = null;
    this.category2 = null;
  }
  /**
   * Set the suggestion with new values.
   */
  public set(value: any, name?: any, category1?: any, category2?: any) {
    this.value = value;
    this.name = name || null;
    this.category1 = category1 || null;
    this.category2 = category2 || null;
  }
  /**
   * Copy the attributes from another suggestion.
   */
  public copy(suggestion: Suggestion) {
    this.value = suggestion.value;
    this.name = suggestion.name;
    this.category1 = suggestion.category1;
    this.category2 = suggestion.category2;
  }
}
