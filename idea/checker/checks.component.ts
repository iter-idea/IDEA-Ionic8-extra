import { Component, ViewChild, Input } from '@angular/core';
import { NavParams, IonSearchbar, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

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
  @Input() public data: Array<Check>;
  /**
   * A copy of data, to use until the changes are confirmed.
   */
  @Input() public workingData: Array<Check>;
  /**
   * If true, sort alphabetically the data.
   */
  @Input() public sortData: boolean;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public placeholder: string;
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

  // SUPPORT
  public filteredChecks: Array<Check>;
  public N_PER_PAGE = 30;
  public page: number;

  constructor(public modalCtrl: ModalController, public navParams: NavParams, public t: TranslateService) {}
  public ngOnInit() {
    this.workingData = JSON.parse(JSON.stringify(this.data || new Array<Check>()));
    this.filteredChecks = new Array<Check>();
    if (this.sortData) this.workingData = this.workingData.sort((a, b) => a.name.localeCompare(b.name));
    this.filterChecks();
  }
  public ionViewDidEnter() {
    // set the focus / open the keyboard when entering the component
    setTimeout(() => this.searchbar.setFocus(), 100);
  }

  /**
   * Get checks suggestions while typing into the input.
   */
  public filterChecks(ev?: any) {
    // acquire and clean the search term
    let searchTerm = ev && ev.target ? ev.target.value || '' : '';
    if (!searchTerm.trim().length) searchTerm = '';
    searchTerm = searchTerm.toLowerCase();
    // filter the elements based on the search
    this.filteredChecks = this.workingData
      .filter(x => !x.hidden)
      .filter(x => `${x.name} ${x.value}`.toLowerCase().indexOf(searchTerm) >= 0);
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

export class Check {
  /**
   * The unique identifier for the check element.
   */
  public value: string | number;
  /**
   * Displayed name (description) of the check element.
   */
  public name: string;
  /**
   * Whether the check is true or false.
   */
  public checked: boolean;
  /**
   * Elements not included in the current search because of other filters.
   */
  public hidden: boolean;

  constructor(x?: any) {
    x = (x || {}) as Check;
    if (typeof x !== 'object') {
      this.value = x;
      this.name = String(x);
      this.checked = false;
      this.hidden = false;
    } else {
      this.value = x.value;
      this.name = x.name ? String(x.name) : String(this.value);
      this.checked = Boolean(x.checked);
      this.hidden = Boolean(x.hidden);
    }
  }
}
