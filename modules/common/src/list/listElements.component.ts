import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { IonInfiniteScroll, AlertController, ModalController, IonSearchbar } from '@ionic/angular';
import { Label } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEALabelerComponent } from '../labeler/labeler.component';

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-list-elements',
  templateUrl: 'listElements.component.html',
  styleUrls: ['listElements.component.scss']
})
export class IDEAListELementsComponent implements OnInit {
  /**
   * It should be read only until the component closure.
   */
  @Input() data: (Label | string)[];
  /**
   * Whether the elements are labels or simple strings.
   */
  @Input() labelElements: boolean;
  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() noElementsFoundText: string;

  workingData: (Label | string)[];
  filteredList: (Label | string)[];
  currentPage: number;

  @ViewChild('searchbar') searchbar: IonSearchbar;

  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);

  ngOnInit(): void {
    this.workingData = Array.from(this.data || (this.labelElements ? new Array<Label>() : new Array<string>()));
    this.search();
  }

  getElementName(x: Label | string): any {
    return this.labelElements
      ? (x as Label).translate(this._translate.getCurrentLang(), this._translate.languages())
      : x;
  }

  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

    this.filteredList = (this.workingData || [])
      .filter(x =>
        toSearch
          .split(' ')
          .every(searchTerm => [this.getElementName(x)].filter(f => f).some(f => f.toLowerCase().includes(searchTerm)))
      )
      .sort();

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.filteredList = this.filteredList.slice(0, (this.currentPage + 1) * MAX_PAGE_SIZE);

    if (scrollToNextPage) setTimeout((): Promise<void> => scrollToNextPage.complete(), 100);
  }

  addElement(): void {
    if (this.labelElements) {
      const l = new Label(null, this._translate.languages());
      l[this._translate.getDefaultLang()] = '-';
      this.workingData.push(l);
      this.editLabel(l);
    } else this.addStrElement();
  }
  editElement(element: Label | string): void {
    if (this.labelElements) this.editLabel(element as Label);
  }
  removeElement(element: Label | string): void {
    this.workingData.splice(this.workingData.indexOf(element), 1);
    this.search(this.searchbar ? this.searchbar.value : '');
  }

  async addStrElement(): Promise<void> {
    const alert = await this._alert.create({
      header: this._translate._('IDEA_COMMON.LIST.NEW_ELEMENT'),
      inputs: [{ type: 'text', name: 'element', placeholder: this._translate._('IDEA_COMMON.LIST.ELEMENT') }],
      buttons: [
        { text: this._translate._('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this._translate._('COMMON.SAVE'),
          handler: ({ element }): void => {
            if (element && element.trim()) {
              this.workingData.push(element);
              this.search(this.searchbar ? this.searchbar.value : '');
            }
          }
        }
      ]
    });
    await alert.present();
    const firstInput: HTMLInputElement = document.querySelector('ion-alert input');
    if (firstInput) firstInput.focus();
  }
  async editLabel(label: Label): Promise<void> {
    const modal = await this._modal.create({
      component: IDEALabelerComponent,
      componentProps: { label, obligatory: true }
    });
    modal.onDidDismiss().then((): void => this.search(this.searchbar ? this.searchbar.value : ''));
    modal.present();
  }

  close(save?: boolean): void {
    // empty and refill the array without losing the reference
    if (save) {
      this.data.length = 0;
      this.workingData.sort().forEach(x => this.data.push(x));
    }
    this._modal.dismiss(save ? this.data : null);
  }
}
