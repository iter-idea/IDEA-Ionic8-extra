import { CommonModule } from '@angular/common';
import { Component, ViewChild, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonInfiniteScroll,
  IonSearchbar,
  ModalController,
  IonHeader,
  IonContent,
  IonList,
  IonInfiniteScrollContent,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonItem,
  IonLabel,
  IonAvatar,
  IonCheckbox
} from '@ionic/angular/standalone';
import { Check, Suggestion } from 'idea-toolbox';

import { IDEATranslatePipe } from '../translations/translate.pipe';
import { IDEASuggestionsComponent } from '../select/suggestions.component';
import { IDEAUserAvatarComponent } from '../userAvatar/userAvatar.component';

const MAX_PAGE_SIZE = 24;

@Component({
  selector: 'idea-checks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEAUserAvatarComponent,
    IonTitle,
    IonIcon,
    IonButton,
    IonButtons,
    IonToolbar,
    IonSearchbar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonList,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonAvatar,
    IonCheckbox
  ],
  template: `
    <ion-header>
      <ion-toolbar color="ideaToolbar">
        <ion-buttons slot="start">
          <ion-button [title]="'IDEA_COMMON.CHECKER.CLOSE_WITHOUT_SELECTING' | translate" (click)="cancel()">
            <ion-icon slot="icon-only" name="chevron-down" />
          </ion-button>
        </ion-buttons>
        <ion-searchbar
          #searchbar
          [debounce]="100"
          [placeholder]="searchPlaceholder || ('IDEA_COMMON.CHECKER.SEARCH' | translate)"
          (ionInput)="search($event.target.value)"
        />
        <ion-buttons slot="end">
          <ion-button [title]="'IDEA_COMMON.CHECKER.CONFIRM_SELECTION' | translate" (click)="confirm()">
            {{ 'IDEA_COMMON.CHECKER.DONE' | translate }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar color="ideaToolbar" class="secondary">
        <ion-title>
          {{ 'IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED' | translate: { num: getNumChecked() } }}
          @if (limitSelectionToNum) {
            <span>
              {{ 'IDEA_COMMON.CHECKER.LIMIT_OF_NUM' | translate: { num: limitSelectionToNum } }}
            </span>
          }
        </ion-title>
        @if (!limitSelectionToNum && allowSelectDeselectAll) {
          <ion-buttons slot="end">
            <ion-button [title]="'IDEA_COMMON.CHECKER.DESELECT_ALL' | translate" (click)="checkAll(false)">
              <ion-icon slot="icon-only" name="square-outline" />
            </ion-button>
            <ion-button [title]="'IDEA_COMMON.CHECKER.SELECT_ALL' | translate" (click)="checkAll(true)">
              <ion-icon slot="icon-only" name="checkbox-outline" />
            </ion-button>
          </ion-buttons>
        }
        @if (limitSelectionToNum || !allowSelectDeselectAll) {
          <ion-buttons slot="end">
            <ion-button [title]="'IDEA_COMMON.CHECKER.RESET' | translate" (click)="checkAll(false)">
              {{ 'IDEA_COMMON.CHECKER.RESET' | translate }}
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
      @if (showCategoriesFilters) {
        <ion-toolbar color="ideaToolbar" class="secondary">
          <div class="additionalToolbar">
            @if (activeCategories1?.size) {
              <ion-button
                color="light"
                size="small"
                [class.strong]="category1"
                (click)="category1 ? resetFilterCategoryN(1) : setFilterCategoryN(1)"
              >
                <ion-icon [icon]="category1 ? 'close' : 'filter'" slot="start" />
                {{ category1 || ('IDEA_COMMON.SELECT.TAP_TO_FILTER' | translate) }}
              </ion-button>
            }
            @if (activeCategories2?.size) {
              <ion-button
                color="light"
                size="small"
                [class.strong]="category2"
                (click)="category2 ? resetFilterCategoryN(2) : setFilterCategoryN(2)"
              >
                <ion-icon [icon]="category2 ? 'close' : 'filter'" slot="start" />
                {{ category2 || ('IDEA_COMMON.SELECT.TAP_TO_FILTER' | translate) }}
              </ion-button>
            }
          </div>
        </ion-toolbar>
      }
    </ion-header>
    <ion-content>
      <ion-list class="checksList">
        @if (!filteredChecks.length) {
          <ion-item lines="none">
            <ion-label>
              <i>{{ noElementsFoundText || ('IDEA_COMMON.CHECKER.NO_ELEMENTS_FOUND' | translate) }}</i>
            </ion-label>
          </ion-item>
        }
        @for (check of filteredChecks; track check.value) {
          <ion-item class="check">
            @if (showAvatars) {
              <ion-avatar slot="start">
                @if (check.color) {
                  <div class="circle" [style.background-color]="check.color"></div>
                }
                @if (!check.color) {
                  <idea-user-avatar [src]="check.avatar" [name]="check.name" />
                }
              </ion-avatar>
            }
            <ion-checkbox
              labelPlacement="end"
              justify="start"
              [disabled]="!check.checked && getNumChecked() >= limitSelectionToNum"
              [(ngModel)]="check.checked"
            >
              {{ check.name }}
              @if (check.description) {
                <p>{{ check.description }}</p>
              }
            </ion-checkbox>
          </ion-item>
        }
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="search(searchbar?.value, $event.target)">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>
  `,
  styles: [
    `
      ion-toolbar.secondary {
        --min-height: 44px;
        ion-title {
          font-size: 0.8em;
        }
        ion-buttons ion-button {
          height: auto;
          font-size: 0.8em;
          --padding-top: 6px;
          --padding-end: 8px;
          --padding-bottom: 6px;
          --padding-start: 8px;
        }
        .additionalToolbar {
          padding: 0px 5px 5px 15px;
          text-align: left;
          ion-button {
            text-transform: none;
            font-weight: normal;
          }
          ion-button.strong {
            font-weight: bold;
          }
        }
      }
      .checksList {
        .check {
          --background: var(--ion-color-white);
        }
        .circle {
          height: 100%;
          width: 100%;
          background-color: #555;
          border-radius: 50%;
        }
      }
    `
  ]
})
export class IDEAChecksComponent implements OnInit {
  private _modal = inject(ModalController);

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

  ngOnInit(): void {
    this.workingData = JSON.parse(JSON.stringify(this.data || new Array<Check>()));
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
