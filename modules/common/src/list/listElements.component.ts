import { Component, Input, ViewChild } from '@angular/core';
import { AlertController, ModalController, IonSearchbar } from '@ionic/angular';
import { Label } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEALabelerComponent } from '../labeler/labeler.component';

@Component({
  selector: 'idea-list-elements',
  templateUrl: 'listElements.component.html',
  styleUrls: ['listElements.component.scss']
})
export class IDEAListELementsComponent {
  /**
   * It should be read only until the component closure.
   */
  @Input() public data: (Label | string)[];
  /**
   * Whether the elements are labels or simple strings.
   */
  @Input() public labelElements: boolean;
  /**
   * A placeholder for the searchbar.
   */
  @Input() public searchPlaceholder: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() public noElementsFoundText: string;
  /**
   * A copy of data, to use until the changes are confirmed.
   */
  public workingData: (Label | string)[];
  /**
   * The list filtered by the current search terms.
   */
  public filteredList: (Label | string)[];
  /**
   * Manage the searchbar component.
   */
  @ViewChild(IonSearchbar, { static: true }) public searchbar: IonSearchbar;

  constructor(
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public t: IDEATranslationsService
  ) {}
  public ngOnInit() {
    // use a copy of the array, to confirm it only when saving
    this.workingData = Array.from(this.data || (this.labelElements ? new Array<Label>() : new Array<string>()));
    // fire the first search
    this.search();
  }

  /**
   * Get the value to show based on the type of the element.
   */
  public getElementName(x: Label | string) {
    return this.labelElements ? (x as Label).translate(this.t.getCurrentLang(), this.t.languages()) : x;
  }

  /**
   * Get the filtered list while typing into the input.
   */
  public search(toSearch?: string) {
    // acquire and clean the searchTerm
    toSearch = toSearch ? toSearch.toLowerCase() : '';
    // load the list
    this.filteredList = (this.workingData || [])
      .filter(x =>
        toSearch
          .split(' ')
          .every(searchTerm => [this.getElementName(x)].filter(f => f).some(f => f.toLowerCase().includes(searchTerm)))
      )
      .sort();
  }

  /**
   * Add a new element to the list.
   */
  public addElement() {
    if (this.labelElements) {
      const l = new Label(null, this.t.languages());
      l[this.t.getDefaultLang()] = '-';
      this.workingData.push(l);
      this.editLabel(l);
    } else this.addStrElement();
  }
  /**
   * Edit an element of the list, it it's a label.
   */
  public editElement(element: Label | string) {
    if (this.labelElements) this.editLabel(element as Label);
  }
  /**
   * Remove the selected element from the list.
   */
  public removeElement(element: Label | string) {
    this.workingData.splice(this.workingData.indexOf(element), 1);
    this.search(this.searchbar ? this.searchbar.value : '');
  }

  /**
   * Prompt to edit a string element.
   */
  public addStrElement() {
    this.alertCtrl
      .create({
        header: this.t._('IDEA_COMMON.LIST.NEW_ELEMENT'),
        inputs: [{ type: 'text', name: 'element', placeholder: this.t._('IDEA_COMMON.LIST.ELEMENT') }],
        buttons: [
          { text: this.t._('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t._('COMMON.SAVE'),
            handler: data => {
              if (data.element && data.element.trim()) {
                this.workingData.push(data.element);
                this.search(this.searchbar ? this.searchbar.value : '');
              }
            }
          }
        ]
      })
      .then(alert =>
        alert.present().then(() => {
          const firstInput: any = document.querySelector('ion-alert input');
          firstInput.focus();
          return;
        })
      );
  }
  /**
   * Open the component to edit a label.
   */
  public editLabel(label: Label) {
    this.modalCtrl
      .create({ component: IDEALabelerComponent, componentProps: { label, obligatory: true } })
      .then(modal => {
        modal.onDidDismiss().then(() => this.search(this.searchbar ? this.searchbar.value : ''));
        modal.present();
      });
  }

  /**
   * Close and save or simply dismiss.
   */
  public close(save?: boolean) {
    // empty and refill the array without losing the reference
    if (save) {
      this.data.length = 0;
      this.workingData.sort().forEach(x => this.data.push(x));
    }
    this.modalCtrl.dismiss(save ? this.data : null);
  }
}
