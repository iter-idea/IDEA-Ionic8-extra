import {
  Component,
  SimpleChanges,
  OnInit,
  OnDestroy,
  OnChanges,
  inject,
  ChangeDetectionStrategy,
  output,
  input,
  signal
} from '@angular/core';
import { ModalController, IonItem, IonButton, IonIcon, IonLabel, IonText } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { epochDateTime, epochISOString } from 'idea-toolbox';
import { IDEATranslationsService } from '@idea-ionic/common';

import { IDEACalendarPickerComponent } from './calendarPicker.component';

@Component({
  selector: 'idea-date-time',
  imports: [IonText, IonLabel, IonIcon, IonButton, IonItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-item
      class="dateTimeItem"
      [color]="color()"
      [lines]="lines()"
      [title]="placeholder() || label() || ''"
      [button]="!disabled()"
      [disabled]="isOpening()"
      [class.withLabel]="label()"
      (click)="openCalendarPicker()"
    >
      @if (icon()) {
        <ion-button
          fill="clear"
          slot="start"
          [color]="iconColor()"
          [class.marginTop]="label()"
          (click)="doIconSelect($event)"
        >
          <ion-icon [icon]="icon()" slot="icon-only" />
        </ion-button>
      }
      @if (label()) {
        <ion-label position="stacked" [class.selectable]="!disabled()">
          {{ label() }}
          @if (obligatory() && !disabled()) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <ion-label class="value" [class.selectable]="!disabled()">
        @if (!valueToDisplay() && !disabled()) {
          <ion-text class="placeholder" [class.selectable]="!disabled()">
            {{ placeholder() }}
          </ion-text>
        }
        {{ valueToDisplay() }}
      </ion-label>
      @if (!disabled()) {
        <ion-icon slot="end" icon="caret-down" class="selectIcon" [class.selectable]="!disabled()" />
      }
    </ion-item>
  `,
  styles: [
    `
      .dateTimeItem {
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
        .value {
          white-space: nowrap;
        }
        .selectIcon {
          margin: 0;
          padding-left: 4px;
          font-size: 0.8em;
          color: var(--ion-color-medium);
        }
      }
      .dateTimeItem.withLabel {
        min-height: 58px;
        height: auto;
        .selectIcon {
          padding-top: 25px;
        }
        ion-button[slot='start'] {
          margin-top: 16px;
        }
      }
      .selectable {
        cursor: pointer;
      }
    `
  ]
})
export class IDEADateTimeComponent implements OnInit, OnDestroy, OnChanges {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

  /**
   * The date to show/pick.
   */
  readonly date = input<epochDateTime | epochISOString>();
  /**
   * Whether to show the time picker (datetime) or not (date).
   */
  readonly timePicker = input(false);
  /**
   * Whether to show the MANUAL time picker (datetime) or not (date).
   */
  readonly manualTimePicker = input(false);
  /**
   * Whether to use the `epochISOString` format instead of `epochDateTime`.
   */
  readonly useISOFormat = input(false);
  /**
   * The label for the field.
   */
  readonly label = input<string>();
  /**
   * The icon for the field.
   */
  readonly icon = input<string>();
  /**
   * The color of the icon.
   */
  readonly iconColor = input<string>();
  /**
   * Lines preferences for the item.
   */
  readonly lines = input<string>();
  /**
   * The color for the component.
   */
  readonly color = input<string>();
  /**
   * A placeholder for the field.
   */
  readonly placeholder = input<string>();
  /**
   * If true, the component is disabled.
   */
  readonly disabled = input(false);
  /**
   * If true, the obligatory dot is shown.
   */
  readonly obligatory = input(false);
  /**
   * If true, hidew the clear button in the header.
   */
  readonly hideClearButton = input(false);
  /**
   * If set, is the minimum date selectable.
   */
  readonly min = input<epochDateTime | epochISOString>();
  /**
   * If set, is the maximum date selectable.
   */
  readonly max = input<epochDateTime | epochISOString>();

  readonly dateChange = output<epochDateTime | epochISOString | null | any>();
  readonly iconSelect = output<void>();

  valueToDisplay = signal<string>('');
  private langChangeSubscription: Subscription;

  isOpening = signal(false);

  ngOnInit(): void {
    this.langChangeSubscription = this._translate.onLangChange.subscribe((): void => {
      this.valueToDisplay.set(this.getValueToDisplay(this.date()));
    });
  }
  ngOnDestroy(): void {
    if (this.langChangeSubscription) this.langChangeSubscription.unsubscribe();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.date || changes.timePicker) this.valueToDisplay.set(this.getValueToDisplay(this.date()));
  }

  async openCalendarPicker(): Promise<void> {
    if (this.disabled() || this.isOpening()) return;
    this.isOpening.set(true);
    const modal = await this._modal.create({
      component: IDEACalendarPickerComponent,
      componentProps: {
        inputDate: this.date(),
        title: this.label(),
        timePicker: this.timePicker(),
        manualTimePicker: this.manualTimePicker(),
        hideClearButton: this.hideClearButton(),
        min: this.min(),
        max: this.max()
      }
    });
    modal.onDidDismiss().then(({ data }): void => {
      if (data !== undefined && data !== null) {
        if (data === '') this.doSelect(null);
        else this.doSelect(data as Date);
      }
    });
    modal.present();
    this.isOpening.set(false);
  }

  private getValueToDisplay(date: epochDateTime | epochISOString): string {
    return !date
      ? ''
      : this._translate.formatDate(
          date,
          this.timePicker() || this.manualTimePicker() ? 'd MMM yyyy, HH:mm' : 'mediumDate'
        );
  }

  doSelect(date: Date): void {
    this.dateChange.emit(date ? (this.useISOFormat() ? date.toISOString() : date.valueOf()) : null);
  }
  doIconSelect(event: Event): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit();
  }
}
