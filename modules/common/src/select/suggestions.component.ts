import { Component, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { ModalController, IonSearchbar, Platform, IonVirtualScroll } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import { Suggestion } from 'idea-toolbox';

import { IDEAStorageService } from '../storage.service';
import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';

const SHOULD_SHOW_DETAILS_STORAGE_KEY = 'ideaSelectShouldShowDetails';

@Component({
  selector: 'idea-suggestions',
  templateUrl: 'suggestions.component.html',
  styleUrls: ['suggestions.component.scss']
})
export class IDEASuggestionsComponent implements OnInit {
  /**
   * The suggestions to show.
   */
  @Input() public data: Suggestion[];
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
   * If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
   */
  @Input() public allowUnlistedValuesPrefix: string;
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
   * Whether tho show the categories filters.
   */
  @Input() public showCategoriesFilters: boolean;
  /**
   * An arbitrary number of elements to show in each page; suggested: a multiple of 2, 3 and 4 (good for any UI size).
   */
  @Input() public numPerPage: number;
  /**
   * Paginated suggestions (from the data).
   */
  public suggestions: Suggestion[];
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
  /**
   * The searchbar to filter items.
   */
  @ViewChild(IonSearchbar, { static: true }) public searchbar: IonSearchbar;
  /**
   * Whether we should show or not the suggestions details, based on the device preference.
   */
  public shouldShowDetails: boolean;
  /**
   * Whether there are details available at least in one suggestion of this data set.
   */
  public detailsAreAvailable: boolean;
  /**
   * The virtualScroll element to control, for forcing a refresh when needed.
   */
  @ViewChild('virtualScroll', { read: IonVirtualScroll }) public virtualScroll: IonVirtualScroll;

  constructor(
    public platform: Platform,
    public modalCtrl: ModalController,
    public storage: IDEAStorageService,
    public tc: IDEATinCanService,
    public t: IDEATranslationsService
  ) {
    this.data = this.data || new Array<Suggestion>();
    this.suggestions = new Array<Suggestion>();
    this.page = 1;
    this.numPerPage = 48;
  }
  public ngOnInit() {
    // sort the data, if requested
    if (this.sortData)
      this.data = this.data.sort((a, b) =>
        a.name && b.name ? a.name.localeCompare(b.name) : String(a.value).localeCompare(String(b.value))
      );
    // define categories based on the data
    this.loadActiveCategories();
    // define whether there are details to show for some of the rows (apart from the name/id)
    this.detailsAreAvailable = this.data.some(
      x => (x.name && !this.hideIdFromUI) || x.category1 || x.category2 || x.description
    );
    // if the data set has details, load the device preference on their visibility (from cache, fallback to storage)
    if (!this.detailsAreAvailable) this.shouldShowDetails = false;
    else {
      if (this.tc.get(SHOULD_SHOW_DETAILS_STORAGE_KEY) !== undefined)
        this.shouldShowDetails = this.tc.get(SHOULD_SHOW_DETAILS_STORAGE_KEY);
      else
        this.storage
          .get(SHOULD_SHOW_DETAILS_STORAGE_KEY)
          .then(pref => {
            this.shouldShowDetails = Boolean(pref);
            this.tc.set(SHOULD_SHOW_DETAILS_STORAGE_KEY, this.shouldShowDetails);
          })
          .catch(() => (this.shouldShowDetails = false));
    }
    // show the suggestions based on the data
    this.search();
  }
  public ionViewDidEnter() {
    // focus on the searchbar (desktops); on mobile devices it moves the UI too much
    if (this.platform.is('desktop')) this.searchbar.setFocus();
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
  public mapIntoSuggestions(set: Set<string>): Suggestion[] {
    return Array.from(set)
      .sort()
      .map(x => new Suggestion({ value: x }));
  }
  /**
   * Get suggestions while typing into the input.
   */
  public search(toSearch?: string) {
    // acquire and clean the searchTerm
    toSearch = toSearch ? toSearch.toLowerCase() : '';
    // load the suggestions
    this.suggestions = (this.data || [])
      .filter(x => !this.category1 || x.category1 === this.category1)
      .filter(x => !this.category2 || x.category2 === this.category2)
      .filter(x =>
        toSearch
          .split(' ')
          .every(searchTerm =>
            [String(x.value), x.name, x.description, x.category1, x.category2]
              .filter(f => f)
              .some(f => f.toLowerCase().includes(searchTerm))
          )
      );
  }

  /**
   * Set a filter for the categoryN.
   */
  public setFilterCategoryN(whichCategory: number) {
    // identify the category to manage
    const categories = whichCategory === 2 ? this.activeCategories2 : this.activeCategories1;
    // open a modal to select the category with which to filter the suggestions
    this.modalCtrl
      .create({
        component: IDEASuggestionsComponent,
        componentProps: { data: this.mapIntoSuggestions(categories) }
      })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          if (res.data) {
            // set the right category
            if (whichCategory === 2) this.category2 = res.data.value;
            else this.category1 = res.data.value;
            // get the suggestions
            this.search(this.searchbar ? this.searchbar.value : null);
          }
        });
        modal.present();
      });
  }
  /**
   * Reset the filter for the categoryN.
   */
  public resetFilterCategoryN(whichCategory: number) {
    // resset the right category
    if (whichCategory === 2) this.category2 = null;
    else this.category1 = null;
    // get the suggestions
    this.search(this.searchbar ? this.searchbar.value : null);
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
                  String(x.value) ===
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
        let selected = null,
          elements = suggestionsList.getElementsByClassName('selected');
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

  /**
   * Toggle the details visibility preference.
   */
  public toggleDetailsVisibilityPreference() {
    if (!this.detailsAreAvailable) return;
    // update the preference in cache e storage
    this.shouldShowDetails = !this.shouldShowDetails;
    this.tc.set(SHOULD_SHOW_DETAILS_STORAGE_KEY, this.shouldShowDetails);
    this.storage.set(SHOULD_SHOW_DETAILS_STORAGE_KEY, this.shouldShowDetails).catch(() => {}); // ignore err
    // refresh the (entire) list to reflect the changes in the UI
    this.virtualScroll.checkRange(0, this.virtualScroll.items.length);
  }
}
