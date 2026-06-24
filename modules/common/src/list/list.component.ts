import { Component, Input, inject, ChangeDetectionStrategy, output, input } from '@angular/core';
import { ModalController, IonItem, IonButton, IonIcon, IonLabel, IonText } from '@ionic/angular/standalone';
import { Label } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEAListElementsComponent } from './listElements.component';

@Component({
  selector: 'idea-list',
  imports: [IonItem, IonButton, IonIcon, IonLabel, IonText],
  template: `
    <ion-item
      class="listItem"
      [color]="color()"
      [lines]="lines()"
      [button]="!disabled"
      [disabled]="isOpening"
      [title]="placeholder() || ''"
      [class.withLabel]="label"
      (click)="openList()"
    >
      @if (icon) {
        <ion-button
          fill="clear"
          slot="start"
          [color]="iconColor()"
          [class.marginTop]="label"
          (click)="doIconSelect($event)"
        >
          <ion-icon [icon]="icon" slot="icon-only" />
        </ion-button>
      }
      @if (label) {
        <ion-label position="stacked" [class.selectable]="!disabled">
          {{ label }}
          @if (obligatory() && !disabled) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <ion-label
        class="description"
        [class.selectable]="!disabled"
        [class.placeholder]="!getPreview() || noPreviewText()"
      >
        {{ getPreview() || placeholder() }}
      </ion-label>
      @if (!disabled) {
        <ion-icon slot="end" icon="caret-down" class="selectIcon" [class.selectable]="!disabled" />
      }
    </ion-item>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .listItem {
        min-height: 48px;
        height: auto;
        .description {
          margin: 10px 0;
          height: 20px;
          line-height: 20px;
          width: 100%;
        }
        .placeholder {
          color: var(--ion-color-medium);
        }
        .selectIcon {
          margin: 0;
          padding-left: 4px;
          font-size: 0.8em;
          color: var(--ion-color-medium);
        }
      }
      .listItem.withLabel {
        min-height: 58px;
        height: auto;
        .selectIcon {
          padding-top: 25px;
        }
        ion-icon[slot='start'] {
          margin-top: 16px;
        }
      }
      .selectable {
        cursor: pointer;
      }
    `
  ]
})
export class IDEAListComponent {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The list to manage.
   */
  readonly data = input<(Label | string)[]>([]);
  /**
   * Whether the elements are labels or simple strings.
   */
  readonly labelElements = input<boolean>();
  /**
   * The label for the field.
   */
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() label: string;
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
   * Text to show when there isn't a result.
   */
  readonly noElementsFoundText = input<string>();
  /**
   * If true, show the string instead of the preview text.
   */
  readonly noPreviewText = input<string>();
  /**
   * A placeholder for the field.
   */
  readonly placeholder = input<string>();
  /**
   * Lines preferences for the item.
   */
  readonly lines = input<string>();
  /**
   * The color for the component.
   */
  readonly color = input<string>();
  /**
   * If true, the component is disabled.
   */
  // TODO: Skipped for migration because:
  //  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
  //  and migrating would break narrowing currently.
  @Input() disabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  readonly obligatory = input<boolean>();
  /**
   * How many elements to show in the preview before to generalize on the number.
   */
  readonly numMaxElementsInPreview = input(4);
  /**
   * On change event.
   */
  readonly change = output<void>();
  /**
   * Icon select.
   */
  readonly iconSelect = output<void>();

  isOpening = false;

  async openList(): Promise<void> {
    if (this.disabled || this.isOpening) return;
    this.isOpening = true;
    const modal = await this._modal.create({
      component: IDEAListElementsComponent,
      componentProps: {
        data: this.data(),
        labelElements: this.labelElements(),
        searchPlaceholder: this.searchPlaceholder(),
        noElementsFoundText: this.noElementsFoundText()
      }
    });
    modal.onDidDismiss().then(({ data }): void => (data ? this.change.emit() : null));
    modal.present();
    this.isOpening = false;
  }

  getPreview(): string {
    const data = this.data();
    if (!data || !data.length) return null;
    const noPreviewText = this.noPreviewText();
    if (noPreviewText) return noPreviewText;
    if (data.length <= this.numMaxElementsInPreview())
      return data
        .slice(0, this.numMaxElementsInPreview())
        .map(x => this.getElementName(x))
        .join(', ');
    else return this._translate._('IDEA_COMMON.LIST.NUM_ELEMENTS_', { num: data.length });
  }
  getElementName(x: Label | string): any {
    return this.labelElements()
      ? (x as Label).translate(this._translate.getCurrentLang(), this._translate.languages())
      : x;
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
