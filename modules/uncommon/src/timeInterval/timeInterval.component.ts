import {
  Component,
  SimpleChanges,
  OnInit,
  OnDestroy,
  OnChanges,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  output,
  input
} from '@angular/core';
import { ModalController, IonItem, IonButton, IonIcon, IonText, IonLabel } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { TimeInterval } from 'idea-toolbox';
import { IDEATranslationsService } from '@idea-ionic/common';

import { IDEAFromTimeToTimeComponent, Periods } from './fromTimeToTime.component';

@Component({
  selector: 'idea-time-interval',
  imports: [IonLabel, IonText, IonIcon, IonButton, IonItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-item
      class="timeIntervalItem"
      [color]="color()"
      [lines]="lines()"
      [button]="!disabled()"
      [disabled]="isOpening"
      [title]="placeholder() || valueToDisplay || ''"
      [class.withLabel]="label()"
      (click)="disabled() ? doSelectWhenDisabled() : pickTimeInterval()"
    >
      @if (icon()) {
        <ion-button
          fill="clear"
          slot="start"
          [color]="iconColor()"
          [class.marginTop]="label()"
          (click)="doIconSelect($event)"
        >
          <ion-icon [name]="icon()" slot="icon-only" />
        </ion-button>
      }
      @if (label()) {
        <ion-label position="stacked" [class.selectable]="!disabled() || tappableWhenDisabled()">
          {{ label() }}
          @if (obligatory() && !disabled()) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <ion-label class="description" [class.selectable]="!disabled() || tappableWhenDisabled()">
        @if (!valueToDisplay && !disabled()) {
          <ion-text class="placeholder" [class.selectable]="!disabled()">
            {{ placeholder() }}
          </ion-text>
        }
        {{ valueToDisplay }}
      </ion-label>
      @if (!disabled()) {
        <ion-icon slot="end" name="caret-down" class="selectIcon" [class.selectable]="!disabled()" />
      }
    </ion-item>
  `,
  styles: [
    `
      .timeIntervalItem {
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
      .timeIntervalItem.withLabel {
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
export class IDEATimeIntervalComponent implements OnInit, OnDestroy, OnChanges {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);
  private _cdr = inject(ChangeDetectorRef);

  /**
   * The time interval to set.
   */
  readonly timeInterval = input<TimeInterval>();
  /**
   * Whether we should start picking the time displaying the afternoon (PM) or the morning (AM, default).
   */
  readonly period = input<Periods>(Periods.AM);
  /**
   * A time to use as lower limit for the possible choices.
   */
  readonly notEarlierThan = input<number>();
  /**
   * A time to use as upper limit for the possible choices.
   */
  readonly notLaterThan = input<number>();
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
   * A placeholder for the field.
   */
  readonly placeholder = input<string>();
  /**
   * If true, the component is disabled.
   */
  readonly disabled = input<boolean>();
  /**
   * If true, the field has a tappable effect when disabled.
   */
  readonly tappableWhenDisabled = input<boolean>();
  /**
   * If true, the obligatory dot is shown.
   */
  readonly obligatory = input<boolean>();
  /**
   * Lines preferences for the item.
   */
  readonly lines = input<string>();
  /**
   * The color for the component.
   */
  readonly color = input<string>();
  /**
   * On select event.
   */
  readonly select = output<void>();
  /**
   * Icon select.
   */
  readonly iconSelect = output<void>();
  /**
   * On select (with the field disabled) event.
   */
  readonly selectWhenDisabled = output<void>();

  valueToDisplay: string;
  private langChangeSubscription: Subscription;

  isOpening = false;

  ngOnInit(): void {
    // when the language changes, set the locale
    this.langChangeSubscription = this._translate.onLangChange.subscribe((): void => {
      this.valueToDisplay = this.getValueToDisplay(this.timeInterval());
      this._cdr.markForCheck();
    });
  }
  ngOnDestroy(): void {
    if (this.langChangeSubscription) this.langChangeSubscription.unsubscribe();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeInterval) this.valueToDisplay = this.getValueToDisplay(changes.timeInterval.currentValue);
  }

  private getValueToDisplay(timeInterval: TimeInterval): string {
    if (!timeInterval || !timeInterval.isSet()) return '';
    // note: the time must be always considered without any timezone (UTC)
    const dateOpts = { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' } as const;
    return ''.concat(
      this._translate._('IDEA_UNCOMMON.FTTT.FROM'),
      ' ',
      new Date(timeInterval.from).toLocaleTimeString(this._translate.getCurrentLang(), dateOpts),
      ' ',
      this._translate._('IDEA_UNCOMMON.FTTT.TO').toLowerCase(),
      ' ',
      new Date(timeInterval.to).toLocaleTimeString(this._translate.getCurrentLang(), dateOpts)
    );
  }

  async pickTimeInterval(): Promise<void> {
    if (this.isOpening) return;
    this.isOpening = true;
    const modal = await this._modal.create({
      component: IDEAFromTimeToTimeComponent,
      componentProps: {
        timeInterval: this.timeInterval(),
        period: this.period(),
        notEarlierThan: this.notEarlierThan(),
        notLaterThan: this.notLaterThan(),
        title: this.label()
      }
    });
    modal.onDidDismiss().then((res: any): void => {
      // if the content changed, update the internal values and notify the parent component
      if (res.data === true || res.data === false) {
        this.valueToDisplay = this.getValueToDisplay(this.timeInterval());
        this.select.emit();
        this._cdr.markForCheck();
      }
    });
    modal.present();
    this.isOpening = false;
  }

  doSelectWhenDisabled(): void {
    if (this.disabled()) this.selectWhenDisabled.emit();
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
