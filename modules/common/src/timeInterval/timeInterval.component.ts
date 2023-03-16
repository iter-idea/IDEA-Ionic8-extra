import { Component, Input, Output, EventEmitter, SimpleChanges, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { OverlayEventDetail } from '@ionic/core';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { TimeInterval } from 'idea-toolbox';

import { IDEAFromTimeToTimeComponent, Periods } from './fromTimeToTime.component';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-time-interval',
  templateUrl: 'timeInterval.component.html',
  styleUrls: ['timeInterval.component.scss']
})
export class IDEATimeIntervalComponent implements OnInit, OnDestroy, OnChanges {
  /**
   * The time interval to set.
   */
  @Input() timeInterval: TimeInterval;
  /**
   * Whether we should start picking the time displaying the afternoon (PM) or the morning (AM, default).
   */
  @Input() period: Periods = Periods.AM;
  /**
   * A time to use as lower limit for the possible choices.
   */
  @Input() notEarlierThan: number;
  /**
   * A time to use as upper limit for the possible choices.
   */
  @Input() notLaterThan: number;
  /**
   * The label for the field.
   */
  @Input() label: string;
  /**
   * The icon for the field.
   */
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  @Input() iconColor: string;
  /**
   * A placeholder for the field.
   */
  @Input() placeholder: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * If true, the field has a tappable effect when disabled.
   */
  @Input() tappableWhenDisabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() obligatory: boolean;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * On select event.
   */
  @Output() select = new EventEmitter<void>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();
  /**
   * On select (with the field disabled) event.
   */
  @Output() selectWhenDisabled = new EventEmitter<void>();
  /**
   * The value to display in the field preview.
   */
  valueToDisplay: string;
  /**
   * Language change subscription.
   */
  private langChangeSubscription: Subscription;

  constructor(public modalCtrl: ModalController, public t: IDEATranslationsService) {}

  ngOnInit(): void {
    // when the language changes, set the locale
    this.langChangeSubscription = this.t.onLangChange.subscribe(() => {
      this.valueToDisplay = this.getValueToDisplay(this.timeInterval);
    });
  }
  ngOnDestroy(): void {
    if (this.langChangeSubscription) this.langChangeSubscription.unsubscribe();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeInterval) this.valueToDisplay = this.getValueToDisplay(changes.timeInterval.currentValue);
  }

  /**
   * Get the value to show for the interval.
   */
  private getValueToDisplay(timeInterval: TimeInterval): string {
    if (!timeInterval || !timeInterval.isSet()) return '';
    // note: the time must be always considered without any timezone (UTC)
    const dateOpts = { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' } as const;
    return ''.concat(
      this.t._('IDEA_COMMON.FTTT.FROM'),
      ' ',
      new Date(timeInterval.from).toLocaleTimeString(this.t.getCurrentLang(), dateOpts),
      ' ',
      this.t._('IDEA_COMMON.FTTT.TO').toLowerCase(),
      ' ',
      new Date(timeInterval.to).toLocaleTimeString(this.t.getCurrentLang(), dateOpts)
    );
  }

  /**
   * Pick the time interval.
   */
  pickTimeInterval(): void {
    this.modalCtrl
      .create({
        component: IDEAFromTimeToTimeComponent,
        componentProps: {
          timeInterval: this.timeInterval,
          period: this.period,
          notEarlierThan: this.notEarlierThan,
          notLaterThan: this.notLaterThan,
          title: this.label
        }
      })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail): void => {
          // if the content changed, update the internal values and notify the parent component
          if (res.data === true || res.data === false) {
            this.valueToDisplay = this.getValueToDisplay(this.timeInterval);
            this.select.emit();
          }
        });
        modal.present();
      });
  }

  /**
   * Emit the selection while the component is in viewMode.
   */
  doSelectWhenDisabled(): void {
    if (this.disabled) this.selectWhenDisabled.emit();
  }

  /**
   * Emit the selection of the icon.
   */
  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
