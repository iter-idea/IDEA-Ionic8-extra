import { Component, Input, Output, EventEmitter, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonReorder,
  IonReorderGroup,
  ItemReorderEventDetail,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSearchbar,
  PopoverController,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonTitle
} from '@ionic/angular/standalone';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';

const PAGINATION_MAX_PAGE_SIZE = 24;

@Component({
  standalone: true,
  imports: [IonItem, IonInput, IonIcon],
  selector: 'idea-inline-checker',
  template: `
    <ion-item
      [color]="color"
      [lines]="lines"
      [button]="!disabled"
      [disabled]="disabled || isOpening"
      [class.placeholder]="getPreview() === placeholder"
      (click)="openChecker($event)"
    >
      @if (!disabled) {
        <ion-icon slot="end" icon="caret-down" color="medium" class="margin-top" />
      }
      <ion-input readonly [labelPlacement]="labelPlacement" [label]="label" [value]="getPreview()" />
    </ion-item>
  `,
  styles: [
    `
      ion-icon[icon='caret-down'] {
        font-size: 0.8em;
      }
      .placeholder ion-input {
        -webkit-text-fill-color: var(--ion-color-medium);
      }
    `
  ]
})
export class IDEAInlineCheckerComponent {
  private _popover = inject(PopoverController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The options to show and sort.
   */
  @Input() data: Check[] = [];
  /**
   * The label for the component.
   */
  @Input() label: string;
  /**
   * The label placement.
   */
  @Input() labelPlacement: string;
  /**
   * The placeholder for the component.
   */
  @Input() placeholder: string;
  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() noElementsFoundText: string;
  /**
   * The lines of the component.
   */
  @Input() lines: string;
  /**
   * The color of the component.
   */
  @Input() color: string;
  /**
   * Whether the component is disabled.
   */
  @Input() disabled = false;
  /**
   * Whether the checklist is reorderable or not.
   */
  @Input() reorder = false;
  /**
   * If true, sort the checklist alphabetically.
   */
  @Input() sortData: boolean;
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  @Input() numMaxElementsInPreview = 4;
  /**
   * The translation key to get the preview text; it has a `num` variable available.
   */
  @Input() previewTextKey = 'IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED';
  /**
   * Limit the number of selectable elements to the value provided.
   * If this number is forced to `1`, the component turns into a single selection.
   */
  @Input() limitSelectionToNum: number;
  /**
   * If true, render the child component centered in the screen and show a header with a searchbar.
   */
  @Input() withSearchbar = false;

  /**
   * On change event.
   */
  @Output() change = new EventEmitter<void>();

  isOpening = false;

  async openChecker(theEvent: Event): Promise<void> {
    if (this.disabled || this.isOpening) return;
    this.isOpening = true;
    const component = IDEAInlineChecksComponent;
    const componentProps = {
      data: this.data,
      reorder: this.reorder,
      sortData: this.sortData,
      withSearchbar: this.withSearchbar,
      searchPlaceholder: this.searchPlaceholder,
      noElementsFoundText: this.noElementsFoundText,
      previewTextKey: this.previewTextKey,
      limitSelectionToNum: this.limitSelectionToNum
    };
    const event = this.withSearchbar ? undefined : theEvent;
    const cssClass = 'popoverLarge';
    const modal = await this._popover.create({ component, componentProps, event, cssClass });
    modal.onDidDismiss().then((): void => this.change.emit());
    modal.present();
    this.isOpening = false;
  }

  getPreview(): string {
    if (!this.data || !this.data.length) return null;
    const checked = this.data.filter(x => x.checked);
    if (this.placeholder && checked.length === 0) return this.placeholder;
    else if (checked.length && checked.length <= this.numMaxElementsInPreview)
      return this.data
        .filter(x => x.checked)
        .slice(0, this.numMaxElementsInPreview)
        .map(x => x.name)
        .join(', ');
    else return this._translate._(this.previewTextKey, { num: checked.length });
  }
}

@Component({
  standalone: true,
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IonContent,
    IonList,
    IonReorderGroup,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonReorder,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonTitle
  ],
  selector: 'idea-inline-checks',
  template: `
    @if (withSearchbar) {
      <ion-header class="ion-no-border">
        <ion-toolbar color="ideaToolbar">
          <ion-buttons slot="start">
            <ion-button [title]="'COMMON.CLOSE' | translate" (click)="close()">
              <ion-icon icon="chevron-down-outline" slot="icon-only" />
            </ion-button>
          </ion-buttons>
          <ion-searchbar
            #searchbar
            color="white"
            lines="none"
            [placeholder]="searchPlaceholder || ('IDEA_COMMON.CHECKER.SEARCH' | translate)"
            (ionInput)="search($event.target.value)"
          />
          @if (limitSelectionToNum !== 1) {
            <ion-buttons slot="end">
              <ion-button
                [title]="'IDEA_COMMON.CHECKER.SHOW_ONLY_CHECKED' | translate"
                (click)="showOnlyChecked = !showOnlyChecked; search(searchbar?.value)"
              >
                <ion-icon [icon]="showOnlyChecked ? 'eye-off-outline' : 'eye-outline'" slot="icon-only" />
              </ion-button>
            </ion-buttons>
          }
        </ion-toolbar>
        @if (limitSelectionToNum !== 1) {
          <ion-toolbar color="ideaToolbar" class="secondary">
            <ion-title>
              {{ previewTextKey | translate: { num: getNumChecked() } }}
              @if (limitSelectionToNum) {
                <span>{{ 'IDEA_COMMON.CHECKER.LIMIT_OF_NUM' | translate: { num: limitSelectionToNum } }}</span>
              }
            </ion-title>
          </ion-toolbar>
        }
      </ion-header>
    }
    <ion-content>
      <ion-list>
        @if (limitSelectionToNum === 1) {
          @for (check of filteredChecks; track check.value) {
            <ion-item color="white" button (click)="selectSingle(check)">
              <ion-label>{{ check.name }}</ion-label>
            </ion-item>
          } @empty {
            <ion-item color="white" lines="none">
              <ion-label class="ion-text-center">
                <i>{{ noElementsFoundText ?? ('IDEA_COMMON.CHECKER.NO_ELEMENTS_FOUND' | translate) }}</i>
              </ion-label>
            </ion-item>
          }
        } @else {
          <ion-reorder-group [disabled]="!reorder" (ionItemReorder)="handleReorder($event)">
            @for (check of filteredChecks; track check.value) {
              <ion-item color="white">
                <ion-reorder slot="start" />
                <ion-checkbox
                  [disabled]="!check.checked && limitSelectionToNum && getNumChecked() >= limitSelectionToNum"
                  [(ngModel)]="check.checked"
                >
                  {{ check.name }}
                </ion-checkbox>
              </ion-item>
            } @empty {
              <ion-item color="white" lines="none">
                <ion-label class="ion-text-center">
                  <i>{{ noElementsFoundText ?? ('IDEA_COMMON.CHECKER.NO_ELEMENTS_FOUND' | translate) }}</i>
                </ion-label>
              </ion-item>
            }
          </ion-reorder-group>
        }
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="search(searchbar?.value, $event.target)">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>
  `,
  styles: [
    `
      ion-list {
        background: transparent;
      }
      ion-toolbar.secondary {
        --min-height: 44px;
        ion-title {
          font-size: 0.8em;
        }
      }
    `
  ]
})
class IDEAInlineChecksComponent implements OnInit {
  private _popover = inject(PopoverController);

  /**
   * The checklist to show and sort.
   */
  @Input() data: Check[] = [];
  /**
   * Whether the checklist is reorderable or not.
   */
  @Input() reorder = false;
  /**
   * If true, sort the checklist alphabetically.
   */
  @Input() sortData: boolean;
  /**
   * If true, render the component centered in the screen and show a header with a searchbar.
   */
  @Input() withSearchbar = false;
  /**
   * A placeholder for the searchbar.
   */
  @Input() searchPlaceholder: string;
  /**
   * The text to show in case no element is found after a search.
   */
  @Input() noElementsFoundText: string;
  /**
   * The translation key to get the preview text; it has a `num` variable available.
   */
  @Input() previewTextKey = 'IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED';
  /**
   * Limit the number of selectable elements to the value provided.
   * If this number is forced to `1`, the component turns into a single selection.
   */
  @Input() limitSelectionToNum: number;

  @ViewChild('searchbar') searchbar: IonSearchbar;

  filteredChecks: Check[];
  currentPage: number;
  showOnlyChecked = false;

  ngOnInit(): void {
    if (this.sortData) {
      const compareByLabel = (a: Check, b: Check): number =>
        a.name && b.name ? a.name.localeCompare(b.name) : String(a.value).localeCompare(String(b.value));
      if (this.reorder) {
        const originalIndex = new Map<Check, number>();
        for (let i = 0; i < this.data.length; i++) originalIndex.set(this.data[i], i);
        this.data.sort((a, b): number => {
          if (a.checked && b.checked) return (originalIndex.get(a) || 0) - (originalIndex.get(b) || 0);
          if (a.checked !== b.checked) return a.checked ? -1 : 1;
          return compareByLabel(a, b);
        });
      } else this.data.sort(compareByLabel);
    }
    this.search();
  }

  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

    this.filteredChecks = this.data.filter(
      x =>
        !x.hidden &&
        (!this.showOnlyChecked || x.checked) &&
        toSearch
          .split(' ')
          .every(searchTerm =>
            [x.name, String(x.value), x.description, x.category1, x.category2]
              .filter(f => f)
              .some(f => f.toLowerCase().includes(searchTerm))
          )
    );

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.filteredChecks = this.filteredChecks.slice(0, (this.currentPage + 1) * PAGINATION_MAX_PAGE_SIZE);

    if (scrollToNextPage) setTimeout((): Promise<void> => scrollToNextPage.complete(), 100);
  }

  getNumChecked(): number {
    return this.data.filter(x => x.checked).length;
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>): void {
    if (!this.reorder) return;
    const reordered = ev.detail.complete(this.filteredChecks);
    this.filteredChecks = reordered;
    const visibleChecks = new Set(reordered);
    const reorderedQueue = [...reordered];
    const nextData = this.data.map(item => (visibleChecks.has(item) ? reorderedQueue.shift() : item));
    this.data.splice(0, this.data.length, ...nextData);
  }

  selectSingle(check: Check): void {
    this.data.forEach(x => (x.checked = false));
    const index = this.data.indexOf(check);
    if (index !== -1) this.data[index].checked = true;
    this._popover.dismiss();
  }

  close(): void {
    this._popover.dismiss();
  }
}
