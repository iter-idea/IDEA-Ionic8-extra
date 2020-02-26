import { Component, HostListener, Input, ViewChild } from '@angular/core';
import { ModalController, IonSearchbar, IonInfiniteScroll } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import IdeaX = require('idea-toolbox');

@Component({
  selector: 'idea-suggestions',
  templateUrl: 'suggestions.component.html',
  styleUrls: ['suggestions.component.scss']
})
export class IDEASuggestionsComponent {
  /**
   * The suggestions to show.
   */
  @Input() public data: Array<IdeaX.Suggestion>;
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
  /**
   * An arbitrary number of elements to show in each page; suggested: a multiple of 2, 3 and 4 (good for any UI size).
   */
  @Input() public numPerPage: number;
  /**
   * Paginated suggestions (from the data).
   */
  public suggestions: Array<IdeaX.Suggestion>;
  /**
   * The current page for the paginated suggestions.
   */
  public page: number;
  /**
   * The category1 extracted from the suggestions.
   */
  public activeCategories1: Set<string>;
  /**
   * The category2 extracted from the suggestions.
   */
  public activeCategories2: Set<string>;

  @ViewChild(IonSearchbar, { static: true }) public searchbar: IonSearchbar;

  constructor(public modalCtrl: ModalController, public t: TranslateService) {
    this.data = this.data || new Array<IdeaX.Suggestion>();
    this.suggestions = new Array<IdeaX.Suggestion>();
    this.page = 1;
    this.numPerPage = 48;
  }
  public ngOnInit() {
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
  public mapIntoSuggestions(set: Set<string>): Array<IdeaX.Suggestion> {
    return Array.from(set)
      .sort()
      .map(x => new IdeaX.Suggestion({ value: x }));
  }
  /**
   * Get suggestions while typing into the input.
   */
  public getSuggestions(ev?: any) {
    // acquire and clean the searchTerm
    let toSearch = ev && ev.target ? ev.target.value.toLowerCase() || '' : '';
    if (toSearch.trim() === '') toSearch = '';
    // load the suggestions
    const list = (this.data || [])
      .filter(x => !this.category1 || x.category1 === this.category1)
      .filter(x => !this.category2 || x.category2 === this.category2)
      .filter(x =>
        toSearch
          .split(' ')
          .every(searchTerm =>
            [x.value, x.name, x.category1, x.category2].filter(f => f).some(f => f.toLowerCase().includes(searchTerm))
          )
      );
    this.suggestions = list.slice(0, this.page * this.numPerPage);
  }
  /**
   * Load more elements of the pagination.
   */
  public doInfinite(infiniteScroll: IonInfiniteScroll) {
    setTimeout(() => {
      this.page += 1;
      this.getSuggestions(this.searchbar ? this.searchbar.value.toString() : '');
      infiniteScroll.complete();
    }, 300); // the timeout is needed
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
  public select(selection?: IdeaX.Suggestion | any) {
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
