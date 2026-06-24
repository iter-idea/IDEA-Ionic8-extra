import { Component, Input, OnInit, inject, ChangeDetectionStrategy, output, viewChild, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonChip,
  IonIcon,
  IonLabel,
  IonText,
  IonInfiniteScroll,
  IonSearchbar,
  ModalController,
  PopoverController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonContent,
  IonList,
  IonItem,
  IonCheckbox,
  IonInfiniteScrollContent,
  IonTitle
} from '@ionic/angular/standalone';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from '../translations/translate.pipe';

const PAGINATION_MAX_PAGE_SIZE = 24;

@Component({
  imports: [IonChip, IonIcon, IonLabel, IonText, IonButton],
  selector: 'idea-chip-checker',
  template: `
    @let active = someChecked();
    <ion-chip
      tabindex="0"
      class="chipChecker"
      [class.active]="active"
      [class.inactive]="!active"
      [color]="active ? color() : inactiveColor()"
      [disabled]="disabled() || isOpening"
      (click)="openChecker($event)"
      (keyup.enter)="openChecker($event)"
    >
      @if (icon) {
        <ion-icon [icon]="icon" [color]="iconColor()" />
      }
      <ion-label>
        <ion-text class="chipCheckerLabel">{{ label() }}:</ion-text>
        <ion-text class="chipCheckerText">{{ getPreview() }}</ion-text>
      </ion-label>
      @if (resetButton() && active) {
        <ion-button size="small" fill="clear" (click)="resetChecks($event)">
          <ion-icon icon="close-circle" slot="icon-only" size="small" />
        </ion-button>
      }
    </ion-chip>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      ion-chip.chipChecker {
        height: 40px;
      }
      ion-text.chipCheckerLabel {
        font-weight: 600;
        padding-right: 4px;
      }
      ion-button {
        margin-left: 8px;
        --padding-start: 2px;
        --padding-end: 2px;
      }
    `
  ]
})
export class IDEAChipCheckerComponent {
  private _popover = inject(PopoverController);
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The checks to show.
   */
  readonly data = input<Check[]>([]);
  /**
   * The label for the field.
   */
  readonly label = input<string>();
  /**
   * The icon for the field.
   */
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  readonly iconColor = input<string>();
  /**
   * A placeholder for the searchbar.
   */
  readonly searchPlaceholder = input<string>();
  /**
   * If true, show the string instead of the preview text.
   */
  readonly noPreviewText = input<string>();
  /**
   * The text to show in case no element is found after a search.
   */
  readonly noElementsFoundText = input<string>();
  /**
   * If true, no elements selected equals all the elements selected.
   */
  readonly noneEqualsAll = input<boolean>();
  /**
   * If no element is selected, set this custom text.
   */
  readonly noneText = input<string>();
  /**
   * If all the elements are selected, set this custom text.
   */
  readonly allText = input<string>();
  /**
   * The translation key to get the preview text; it has a `num` variable available.
   */
  readonly previewTextKey = input('IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED');
  /**
   * The color for the component.
   */
  readonly color = input('primary');
  /**
   * The color for the inactive component.
   */
  readonly inactiveColor = input('dark');
  /**
   * If true, the component is disabled.
   */
  readonly disabled = input<boolean>();
  /**
   * If true, sort alphabetically the data.
   */
  readonly sortData = input<boolean>();
  /**
   * Whether to always show the `value`, even when the `name` is set.
   */
  readonly alwaysShowValue = input(false);
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  readonly numMaxElementsInPreview = input(4);
  /**
   * Limit the number of selectable elements to the value provided.
   */
  readonly limitSelectionToNum = input<number>();
  /**
   * Whether to allow the select/deselect-all buttons.
   */
  readonly allowSelectDeselectAll = input<boolean>();
  /**
   * Whether to show the reset button.
   */
  readonly resetButton = input(true);
  /**
   * Whether to show the check list as a popover.
   * If false, we show a centered modal.
   */
  readonly showAsPopover = input(true);
  /**
   * On change event.
   */
  readonly change = output<string[]>();

  isOpening = false;

  async openChecker(event: Event): Promise<void> {
    if (this.disabled() || this.isOpening) return;
    this.isOpening = true;
    const component = IDEAChipChecksComponent;
    const componentProps = {
      data: this.data(),
      sortData: this.sortData(),
      alwaysShowValue: this.alwaysShowValue(),
      searchPlaceholder: this.searchPlaceholder(),
      noElementsFoundText: this.noElementsFoundText(),
      limitSelectionToNum: this.limitSelectionToNum(),
      allowSelectDeselectAll: this.allowSelectDeselectAll(),
      showAsPopover: this.showAsPopover(),
      previewTextKey: this.previewTextKey()
    };
    const cssClass = 'chipCheckerPopover';
    const modal = this.showAsPopover()
      ? await this._popover.create({ component, componentProps, event, cssClass })
      : await this._modal.create({ component, componentProps, cssClass });
    modal.onDidDismiss().then((): void => {
      const checkValues = this.data()
        .filter(x => x.checked)
        .map(x => x.value as string);
      this.change.emit(checkValues);
    });
    modal.present();
    this.isOpening = false;
  }

  getPreview(): string {
    const data = this.data();
    if (!data || !data.length) return null;
    const noPreviewText = this.noPreviewText();
    if (noPreviewText) return noPreviewText;
    const allText = this.allText();
    if (allText && this.allChecked()) return allText;
    else {
      const checked = data.filter(x => x.checked);
      const noneText = this.noneText();
      if (noneText && checked.length === 0) return noneText;
      if (checked.length && checked.length <= this.numMaxElementsInPreview())
        return data
          .filter(x => x.checked)
          .slice(0, this.numMaxElementsInPreview())
          .map(x => x.name)
          .join(', ');
      return this._translate._(this.previewTextKey(), { num: checked.length });
    }
  }
  private allChecked(): boolean {
    const data = this.data();
    return data?.every(x => x.checked) || (data?.every(x => !x.checked) && this.noneEqualsAll());
  }

  someChecked(): boolean {
    return this.data()?.some(x => x.checked);
  }

  resetChecks(event: Event): void {
    if (event) event.stopPropagation();
    this.data()?.forEach(x => (x.checked = false));
    this.change.emit([]);
  }
}

@Component({
  imports: [
    FormsModule,
    IDEATranslatePipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonContent,
    IonList,
    IonItem,
    IonTitle,
    IonCheckbox,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
  selector: 'idea-chip-checks',
  template: `
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
          [placeholder]="searchPlaceholder() || ('IDEA_COMMON.CHECKER.SEARCH' | translate)"
          (ionInput)="search($event.target.value)"
        />
      </ion-toolbar>
      @if (allowSelectDeselectAll()) {
        <ion-toolbar color="ideaToolbar" class="secondary">
          <ion-title>
            {{ previewTextKey() | translate: { num: getNumChecked() } }}
            @if (limitSelectionToNum) {
              <span>
                {{ 'IDEA_COMMON.CHECKER.LIMIT_OF_NUM' | translate: { num: limitSelectionToNum } }}
              </span>
            }
          </ion-title>
          @if (!limitSelectionToNum) {
            <ion-buttons slot="end">
              <ion-button [title]="'IDEA_COMMON.CHECKER.DESELECT_ALL' | translate" (click)="checkAll(false)">
                <ion-icon slot="icon-only" name="square-outline" />
              </ion-button>
              <ion-button [title]="'IDEA_COMMON.CHECKER.SELECT_ALL' | translate" (click)="checkAll(true)">
                <ion-icon slot="icon-only" name="checkbox-outline" />
              </ion-button>
            </ion-buttons>
          }
        </ion-toolbar>
      }
    </ion-header>
    <ion-content>
      <ion-list>
        @for (check of filteredChecks; track check.value) {
          @if (limitSelectionToNum !== 1) {
            <ion-item color="white" class="chipCheck">
              <ion-checkbox
                labelPlacement="end"
                justify="start"
                [class.alwaysShowValue]="alwaysShowValue()"
                [helperText]="alwaysShowValue() ? check.value : undefined"
                [disabled]="!check.checked && getNumChecked() >= limitSelectionToNum"
                [(ngModel)]="check.checked"
              >
                @if (check.category1) {
                  <strong>{{ check.category1 }}</strong>
                }
                {{ check.name }}
              </ion-checkbox>
            </ion-item>
          } @else {
            <ion-item color="white" class="chipCheck" button (click)="selectSingle(check)">
              <ion-label [class.alwaysShowValue]="alwaysShowValue()">
                @if (check.category1) {
                  <strong>{{ check.category1 }}</strong>
                }
                {{ check.name }}
                @if (alwaysShowValue()) {
                  <p>{{ check.value }}</p>
                }
              </ion-label>
            </ion-item>
          }
        } @empty {
          <ion-item color="white" lines="none">
            <ion-label class="ion-text-center">
              <i>{{ noElementsFoundText() ?? ('IDEA_COMMON.CHECKER.NO_ELEMENTS_FOUND' | translate) }}</i>
            </ion-label>
          </ion-item>
        }
      </ion-list>
      <ion-infinite-scroll (ionInfinite)="search(searchbar?.value, $event.target)">
        <ion-infinite-scroll-content />
      </ion-infinite-scroll>
    </ion-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      }
      ion-list {
        background: transparent;
      }
      ion-searchbar {
        --box-shadow: none;
      }
      ion-item {
        ion-label {
          margin: 0;
          font-size: 0.9em;
          strong {
            font-weight: 600;
            padding-right: 4px;
          }
          &.alwaysShowValue {
            margin: 8px 0;
            > p {
              font-size: 0.8em;
              margin: 0;
            }
          }
        }
        ion-checkbox {
          margin: 0 12px;
          &.alwaysShowValue {
            margin: 2px 12px;
          }
        }
      }
    `
  ]
})
class IDEAChipChecksComponent implements OnInit {
  private _popover = inject(PopoverController);
  private _modal = inject(ModalController);

  /**
   * The data to show.
   */
  // TODO: Skipped for migration because:
  //  Your application code writes to the input. This prevents migration.
  @Input() data: Check[];
  /**
   * If true, sort alphabetically the data (by name or, fallback, by value).
   */
  readonly sortData = input<boolean>();
  /**
   * Whether to always show the `value`, even when the `name` is set.
   */
  readonly alwaysShowValue = input(false);
  /**
   * A placeholder for the searchbar.
   */
  readonly searchPlaceholder = input<string>();
  /**
   * The text to show in case no element is found after a search.
   */
  readonly noElementsFoundText = input<string>();
  /**
   * The translation key to get the preview text; it has a `num` variable available.
   */
  readonly previewTextKey = input('IDEA_COMMON.CHECKER.NUM_ELEMENTS_SELECTED');
  /**
   * Limit the number of selectable elements to the value provided.
   * If this number is forced to `1`, the component turns into a single selection.
   * Note: if this attribute is active, `allowSelectDeselectAll` will be ignored.
   */
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() limitSelectionToNum: number;
  /**
   * Whether to allow the select/deselect-all buttons.
   */
  readonly allowSelectDeselectAll = input<boolean>();
  /**
   * Whether to show the check list as a popover.
   * If false, we show a centered modal.
   */
  readonly showAsPopover = input<boolean>();

  filteredChecks: Check[];
  currentPage: number;

  readonly searchbar = viewChild<IonSearchbar>('searchbar');

  ngOnInit(): void {
    if (!this.data) this.data = [];
    this.search();
  }
  ionViewDidEnter(): void {
    // set the focus / open the keyboard when entering the component
    setTimeout((): Promise<void> => this.searchbar().setFocus(), 100);
  }

  search(toSearch?: string, scrollToNextPage?: IonInfiniteScroll): void {
    toSearch = toSearch ? toSearch.toLowerCase() : '';

    this.filteredChecks = this.data
      .filter(x => !x.hidden)
      .filter(x =>
        toSearch
          .split(' ')
          .every(searchTerm =>
            [x.name, String(x.value), x.description, x.category1, x.category2]
              .filter(f => f)
              .some(f => f.toLowerCase().includes(searchTerm))
          )
      );
    if (this.sortData()) this.filteredChecks = this.filteredChecks.sort((a, b): number => a.name.localeCompare(b.name));

    if (scrollToNextPage) this.currentPage++;
    else this.currentPage = 0;
    this.filteredChecks = this.filteredChecks.slice(0, (this.currentPage + 1) * PAGINATION_MAX_PAGE_SIZE);

    if (scrollToNextPage) setTimeout((): Promise<void> => scrollToNextPage.complete(), 100);
  }

  getNumChecked(): number {
    return this.data.filter(x => x.checked).length;
  }

  selectSingle(check: Check): void {
    this.data.forEach(x => (x.checked = false));
    const index = this.data.indexOf(check);
    if (index !== -1) this.data[index].checked = true;
    this.showAsPopover() ? this._popover.dismiss() : this._modal.dismiss();
  }

  checkAll(check: boolean): void {
    this.data.forEach(x => (x.checked = check));
  }

  close(): void {
    this.showAsPopover() ? this._popover.dismiss() : this._modal.dismiss();
  }
}
