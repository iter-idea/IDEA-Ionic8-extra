import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonContent,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { Ionicons, loopStringEnumValues } from 'idea-toolbox';

import { IDEATranslatePipe } from '../translations/translate.pipe';

// @todo add pagination to grid
@Component({
  selector: 'idea-icons',
  standalone: true,
  imports: [
    CommonModule,
    IDEATranslatePipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonGrid,
    IonRow,
    IonCol
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
            <ion-icon slot="icon-only" name="close" />
          </ion-button>
        </ion-buttons>
        <ion-searchbar
          [placeholder]="searchPlaceholder || ('COMMON.SEARCH' | translate)"
          [debounce]="100"
          (ionInput)="search($event.target ? $event.target.value : '')"
        />
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-grid>
        <ion-row class="ion-justify-content-center">
          @for (i of icons; track i) {
            <ion-col class="ion-text-center" [style.display]="shouldShowIcon[i] ? 'block' : 'none'">
              <ion-button size="large" fill="clear" color="dark" (click)="select(i)">
                <ion-icon [name]="i" />
              </ion-button>
            </ion-col>
          }
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [
    `
      ion-grid {
        background: var(--ion-color-white);
      }
    `
  ]
})
export class IDEAIconsComponent {
  private _modal = inject(ModalController);

  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;

  icons: Ionicons[];
  /**
   * Which icons to show, based on the current search. Note: this method is used instead of the usual, because the
   * icons take a lot to redraw (so it's better to just hide them when not needed).
   */
  shouldShowIcon: { [icon: string]: boolean } = {};

  ionViewDidEnter(): void {
    // note: it will take a while for the icons to draw in the UI; @idea to improve
    this.icons = loopStringEnumValues(Ionicons) as Ionicons[];
    this.search();
  }

  search(toSearch?: string): void {
    // acquire and clean the searchTerm
    toSearch = toSearch ? toSearch.toLowerCase() : '';
    // set visibility based on the search terms
    this.shouldShowIcon = {};
    this.icons.forEach(i => (this.shouldShowIcon[i] = i.toLowerCase().includes(toSearch)));
  }

  select(selection: Ionicons): void {
    this._modal.dismiss(selection);
  }

  close(): void {
    this._modal.dismiss();
  }
}
