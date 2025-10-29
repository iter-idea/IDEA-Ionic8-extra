import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
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
  PopoverController
} from '@ionic/angular/standalone';
import { Check } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

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
   * The options to show.
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
   * On change event.
   */
  @Output() change = new EventEmitter<void>();

  isOpening = false;

  async openChecker(event: Event): Promise<void> {
    if (this.disabled || this.isOpening) return;
    this.isOpening = true;
    const component = IDEAInlineChecksComponent;
    const componentProps = { data: this.data, reorder: this.reorder, sortData: this.sortData };
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
  imports: [FormsModule, IonContent, IonList, IonReorderGroup, IonItem, IonCheckbox, IonReorder],
  selector: 'idea-inline-checks',
  template: `
    <ion-content>
      <ion-list>
        <ion-reorder-group [disabled]="!reorder" (ionItemReorder)="handleReorder($event)">
          @for (check of data; track check.value) {
            <ion-item color="white">
              <ion-reorder slot="start" />
              <ion-checkbox [(ngModel)]="check.checked">{{ check.name }}</ion-checkbox>
            </ion-item>
          }
        </ion-reorder-group>
      </ion-list>
    </ion-content>
  `
})
class IDEAInlineChecksComponent implements OnInit {
  /**
   * The checklist to show.
   */
  @Input() data: Check[];
  /**
   * Whether the checklist is reorderable or not.
   */
  @Input() reorder = false;
  /**
   * If true, sort the checklist alphabetically.
   */
  @Input() sortData: boolean;

  async ngOnInit(): Promise<void> {
    if (this.sortData)
      this.data = this.data.sort((a, b): number =>
        a.name && b.name ? a.name.localeCompare(b.name) : String(a.value).localeCompare(String(b.value))
      );
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>): void {
    if (!this.reorder) return;
    this.data = ev.detail.complete(this.data);
  }
}
