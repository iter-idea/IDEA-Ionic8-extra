import { Component, ViewChild, Input, OnInit } from '@angular/core';
import { IonSearchbar, ModalController } from '@ionic/angular';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-checks',
  templateUrl: 'checks.component.html',
  styleUrls: ['checks.component.scss']
})
export class IDEAChecksComponent implements OnInit {
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
   * Limit the number of selectable elements to the value provided.
   * Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
   */
  @Input() public limitSelectionToNum: number;
  /**
   * Whether to allow the select/deselect-all buttons.
   */
  @Input() public allowSelectDeselectAll: boolean;
  /**
   * A copy of data, to use until the changes are confirmed.
   */
  public workingData: Check[];
  /**
   * The filtered working data, based on the content of the searchbox.
   */
  public filteredChecks: Check[];

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
          .every(searchTerm =>
            [x.name, String(x.value), x.description].filter(f => f).some(f => f.toLowerCase().includes(searchTerm))
          )
      );
  }

  /**
   * Get the count of the elements currently checked.
   */
  public getNumChecked(): number {
    return this.workingData.filter(x => x.checked).length;
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
