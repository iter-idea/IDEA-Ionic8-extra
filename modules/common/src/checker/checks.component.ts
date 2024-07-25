import { Component, ViewChild, Input, OnInit, inject } from '@angular/core';
import { IonInfiniteScroll, IonSearchbar, ModalController } from '@ionic/angular';
import { Check, Suggestion } from 'idea-toolbox';

import { IDEASuggestionsComponent } from '../select/suggestions.component';

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-checks',
  templateUrl: 'checks.component.html',
  styleUrls: ['checks.component.scss']
})
export class IDEAChecksComponent implements OnInit {
  /**
   * It should be read only until the component closure.
   */
  @Input() data: Check[];
  /**
   * If true, sort alphabetically the data (by name or, fallback, by value).
   */
  @Input() sortData: boolean;
  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() noElementsFoundText: string;
  /**
   * Whether to show an avatar aside each element.
   */
  @Input() showAvatars: boolean;
  /**
   * Limit the number of selectable elements to the value provided.
   * Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
   */
  @Input() limitSelectionToNum: number;
  /**
   * Whether to allow the select/deselect-all buttons.
   */
  @Input() allowSelectDeselectAll: boolean;
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
  @Input() showCategoriesFilters: boolean = false;

  workingData: Check[];
  filteredChecks: Check[];
  currentPage: number;
  activeCategories1: Set<string>;
  activeCategories2: Set<string>;

  @ViewChild('searchbar') searchbar: IonSearchbar;

  private _modal = inject(ModalController);

  ngOnInit(): void {
    this.workingData = JSON.parse(JSON.stringify(this.data ?? new Array<Check>()));
    this.filteredChecks = new Array<Check>();
    if (this.sortData) this.workingData = this.workingData.sort((a, b): number => a.name.localeCompare(b.name));
    this.loadActiveCategories();
    this.search();
  }
  ionViewDidEnter(): void {
    // set the focus / open the keyboard when entering the component
    setTimeout((): Promise<void> => this.searchbar.setFocus(), 100);
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

    this.filteredChecks = this.workingData
      .filter(x => !this.category1 || x.category1 === this.category1)
      .filter(x => !this.category2 || x.category2 === this.category2)
      .filter(x => !x.hidden)
      .filter(x =>
        toSearch
          .split(' ')
          .every(searchTerm =>
            [x.name, String(x.value), x.description].filter(f => f).some(f => f.toLowerCase().includes(searchTerm))
          )
      );

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.filteredChecks = this.filteredChecks.slice(0, (this.currentPage + 1) * MAX_PAGE_SIZE);

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

  getNumChecked(): number {
    return this.workingData.filter(x => x.checked).length;
  }
  checkAll(check: boolean): void {
    this.workingData.forEach(x => (x.checked = check));
  }

  cancel(): void {
    this._modal.dismiss(false);
  }
  confirm(): void {
    this.workingData.forEach(x => (this.data.find(y => x.value === y.value).checked = x.checked));
    this._modal.dismiss(true);
  }
}
