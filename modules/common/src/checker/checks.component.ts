import { Component, ViewChild, Input } from '@angular/core';
import { IonSearchbar, ModalController } from '@ionic/angular';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-checks',
  templateUrl: 'checks.component.html',
  styleUrls: ['checks.component.scss']
})
export class IDEAChecksComponent {
  @ViewChild(IonSearchbar, { static: true }) public searchbar: IonSearchbar;
  /**
   * It should be read only until the component closure.
   */
  @Input() public data: Check[];
  /**
   * If true, sort alphabetically the data.
   */
  @Input() public sortData: boolean;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public searchPlaceholder: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() public noElementsFoundText: string;
  /**
   * Whether to show an avatar aside each element.
   */
  @Input() public showAvatars: boolean;
  /**
   * URL to the fallback avatar to show in case the element's avatar isn't found.
   */
  @Input() public fallbackAvatar: string;
  /**
   * Whether to show the select/deselect all buttons.
   */
  @Input() public hideSelectDeselectAll: boolean;
  /**
   * A copy of data, to use until the changes are confirmed.
   */
  public workingData: Check[];

  // SUPPORT
  public filteredChecks: Check[];
  public N_PER_PAGE = 30;
  public page: number;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    this.workingData = JSON.parse(JSON.stringify(this.data || new Array<Check>()));
    this.filteredChecks = new Array<Check>();
    if (this.sortData) this.workingData = this.workingData.sort((a, b) => a.name.localeCompare(b.name));
    this.search();
  }
  public ionViewDidEnter() {
    // set the focus / open the keyboard when entering the component
    setTimeout(() => this.searchbar.setFocus(), 100);
  }

  /**
   * Get checks suggestions while typing into the input.
   */
  public search(toSearch?: string) {
    toSearch = toSearch ? toSearch.toLowerCase() : '';
    // filter the elements based on the search
    this.filteredChecks = this.workingData
      .filter(x => !x.hidden)
      .filter(x =>
        toSearch
          .split(' ')
          .every(searchTerm => [x.name, String(x.value)].filter(f => f).some(f => f.toLowerCase().includes(searchTerm)))
      );
  }

  /**
   * Check/unckeck all the elements.
   */
  public checkAll(check: boolean) {
    this.filteredChecks.forEach(x => (x.checked = check));
  }

  /**
   * Close without confirming the changes.
   */
  public cancel() {
    this.modalCtrl.dismiss(false);
  }
  /**
   * Close applying the changes to the original data structure.
   */
  public confirm() {
    this.workingData.forEach(x => (this.data.find(y => x.value === y.value).checked = x.checked));
    this.modalCtrl.dismiss(true);
  }
}
