import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import {
  AlertController,
  ModalController,
  IonSearchbar,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { Label } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEALabelerComponent } from '../labeler/labeler.component';

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-list-elements',
  standalone: true,
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IDEALabelerComponent,
    IonSearchbar,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'IDEA_COMMON.LIST.CANCEL_AND_CLOSE' | translate" (click)="close()">
            <ion-icon slot="icon-only" icon="chevron-down" />
          </ion-button>
        </ion-buttons>
        <ion-searchbar
          #searchbar
          [placeholder]="searchPlaceholder || ('COMMON.SEARCH' | translate)"
          (ionInput)="search($event.target.value)"
        />
        <ion-buttons slot="end">
          <ion-button [title]="'IDEA_COMMON.LIST.NEW_ELEMENT' | translate" (click)="addElement()">
            <ion-icon icon="add" slot="icon-only" />
          </ion-button>
          <ion-button [title]="'IDEA_COMMON.LIST.SAVE_AND_CLOSE' | translate" (click)="close(true)">
            <ion-icon icon="checkmark-circle" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list class="listElements">
        @if (!filteredList.length) {
          <ion-item lines="none">
            <ion-label>
              <i>{{ noElementsFoundText || ('IDEA_COMMON.LIST.NO_ELEMENTS_FOUND' | translate) }}</i>
            </ion-label>
          </ion-item>
        }
        @for (element of filteredList; track element) {
          <ion-item class="listElement">
            <ion-label>{{ getElementName(element) }}</ion-label>
            @if (labelElements) {
              <ion-button slot="end" fill="clear" (click)="editElement(element)">
                <ion-icon icon="pencil-sharp" slot="icon-only" />
              </ion-button>
            }
            <ion-button
              slot="end"
              fill="clear"
              color="danger"
              [title]="'IDEA_COMMON.LIST.DELETE_ELEMENT' | translate"
              (click)="removeElement(element)"
            >
              <ion-icon icon="trash-outline" slot="icon-only" />
            </ion-button>
          </ion-item>
        }
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="search(searchbar?.value, $event.target)">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>
  `
})
export class IDEAListElementsComponent implements OnInit {
  private _modal = inject(ModalController);
  private _alert = inject(AlertController);
  private _translate = inject(IDEATranslationsService);

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
