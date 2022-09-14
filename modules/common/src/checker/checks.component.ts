import { Component, ViewChild, Input, OnInit } from '@angular/core';
import { IonInfiniteScroll, IonSearchbar, ModalController } from '@ionic/angular';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

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

  workingData: Check[];
  filteredChecks: Check[];
  currentPage: number;

  @ViewChild('searchbar') searchbar: IonSearchbar;

  constructor(private modalCtrl: ModalController, public t: IDEATranslationsService) {}
  ngOnInit(): void {
    this.workingData = JSON.parse(JSON.stringify(this.data ?? new Array<Check>()));
    this.filteredChecks = new Array<Check>();
    if (this.sortData) this.workingData = this.workingData.sort((a, b): number => a.name.localeCompare(b.name));
    this.search();
  }
  ionViewDidEnter(): void {
    // set the focus / open the keyboard when entering the component
    setTimeout((): Promise<void> => this.searchbar.setFocus(), 100);
  }

  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

    this.filteredChecks = this.workingData
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
  trackBy(_: number, check: Check): string | number {
    return check.value;
  }

  getNumChecked(): number {
    return this.workingData.filter(x => x.checked).length;
  }
  checkAll(check: boolean): void {
    this.workingData.forEach(x => (x.checked = check));
  }

  cancel(): void {
    this.modalCtrl.dismiss(false);
  }
  confirm(): void {
    this.workingData.forEach(x => (this.data.find(y => x.value === y.value).checked = x.checked));
    this.modalCtrl.dismiss(true);
  }
}
