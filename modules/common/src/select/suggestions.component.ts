import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit, ViewChild, inject } from '@angular/core';
import {
  IonInfiniteScroll,
  ModalController,
  IonSearchbar,
  Platform,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonContent,
  IonList,
  IonInfiniteScrollContent,
  IonText,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonBadge
} from '@ionic/angular/standalone';
import { Suggestion } from 'idea-toolbox';

import { IDEAStorageService } from '../storage.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEABoldPrefix } from '../boldPrefix.pipe';

const SHOULD_HIDE_DETAILS_STORAGE_KEY = 'ideaSelectShouldHideDetails';

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-suggestions',
  imports: [
    CommonModule,
    IonBadge,
    IonLabel,
    IonItem,
    IonIcon,
    IonButton,
    IonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonList,
    IonContent,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonSearchbar,
    IDEATranslatePipe,
    IDEABoldPrefix
  ],
  templateUrl: 'suggestions.component.html',
  styleUrls: ['suggestions.component.scss']
})
export class IDEASuggestionsComponent implements OnInit {
  private _platform = inject(Platform);
  private _modal = inject(ModalController);
  private _storage = inject(IDEAStorageService);

  /**
   * The suggestions to show.
   */
  @Input() data: Suggestion[] = [];
  /**
   * If true, sort the suggestions alphabetically.
   */
  @Input() sortData: boolean;
  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * Text to show when there isn't a result.
   */
  @Input() noElementsFoundText: string;
  /**
   * If true, allows to select a new custom value (outside the suggestions).
   */
  @Input() allowUnlistedValues: boolean;
  /**
   * If `allowUnlistedValues` is set, show this to help users understanding what happens by selecting the unlisted val.
   */
  @Input() allowUnlistedValuesPrefix: string;
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
   * Whether tho show the categories filters.
   */
  @Input() showCategoriesFilters: boolean;
  /**
   * An arbitrary number of elements to show in each page; suggested: a multiple of 2, 3 and 4 (good for any UI size).
   */
  @Input() numPerPage: number;

  suggestions: Suggestion[] = [];
  currentPage: number;
  activeCategories1: Set<string>;
  activeCategories2: Set<string>;
  @ViewChild(IonSearchbar) searchbar: IonSearchbar;
  shouldShowDetails: boolean;
  detailsAreAvailable: boolean;

  async ngOnInit(): Promise<void> {
    if (this.sortData)
      this.data = this.data.sort((a, b): number =>
        a.name && b.name ? a.name.localeCompare(b.name) : String(a.value).localeCompare(String(b.value))
      );

    this.loadActiveCategories();
    this.detailsAreAvailable = this.data.some(
      x => (x.name && !this.hideIdFromUI) || x.category1 || x.category2 || x.description
    );

    if (!this.detailsAreAvailable) this.shouldShowDetails = false;
    else {
      try {
        this.shouldShowDetails = !(await this._storage.get(SHOULD_HIDE_DETAILS_STORAGE_KEY));
      } catch (error) {
        this.shouldShowDetails = false;
      }
    }
    this.search();
  }
  ionViewDidEnter(): void {
    if (this._platform.is('desktop')) this.searchbar.setFocus();
  }

  private loadActiveCategories(): void {
    this.activeCategories1 = new Set<string>();
    this.activeCategories2 = new Set<string>();
    this.data.forEach(a => {
      if (a.category1) this.activeCategories1.add(a.category1);
      if (a.category2) this.activeCategories2.add(a.category2);
    });
  }
  private mapIntoSuggestions(set: Set<string>): Suggestion[] {
    return Array.from(set)
      .sort()
      .map(x => new Suggestion({ value: x }));
  }
  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

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

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.suggestions = this.suggestions.slice(0, (this.currentPage + 1) * MAX_PAGE_SIZE);

    if (scrollToNextPage) setTimeout((): Promise<void> => scrollToNextPage.complete(), 100);
  }

  async setFilterCategoryN(whichCategory: number): Promise<void> {
    const categories = whichCategory === 2 ? this.activeCategories2 : this.activeCategories1;
    const modal = await this._modal.create({
      component: IDEASuggestionsComponent,
      componentProps: { data: this.mapIntoSuggestions(categories) }
    });
    modal.onDidDismiss().then(({ data }): void => {
      if (data) {
        if (whichCategory === 2) this.category2 = data.value;
        else this.category1 = data.value;
        this.search(this.searchbar ? this.searchbar.value : null);
      }
    });
    modal.present();
  }
  resetFilterCategoryN(whichCategory: number): void {
    if (whichCategory === 2) this.category2 = null;
    else this.category1 = null;
    this.search(this.searchbar ? this.searchbar.value : null);
  }

  /**
   * Close the component propagating the choice:
   *    - selection === undefined -> cancel
   *    - selection === null -> clear
   *    - otherwise, a suggestion was selected
   */
  select(selection?: Suggestion | any): void {
    this._modal.dismiss(selection);
  }

  @HostListener('window:keydown', ['$event'])
  navigateComponent(event: KeyboardEvent): void {
    let suggestionsList: any;
    if (document.getElementsByClassName('suggestionsList').length)
      suggestionsList = document.getElementsByClassName('suggestionsList')[0];

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

  toggleDetailsVisibilityPreference(): void {
    if (!this.detailsAreAvailable) return;
    this.shouldShowDetails = !this.shouldShowDetails;
    this._storage.set(SHOULD_HIDE_DETAILS_STORAGE_KEY, !this.shouldShowDetails);
  }
}
