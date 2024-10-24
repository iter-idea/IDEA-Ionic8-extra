import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnInit,
  OnDestroy,
  OnChanges,
  inject
} from '@angular/core';
import { OverlayEventDetail } from '@ionic/core';
import { ModalController } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { TimeInterval } from 'idea-toolbox';
import { IDEATranslationsService } from '@idea-ionic/common';

import { IDEAFromTimeToTimeComponent, Periods } from './fromTimeToTime.component';

@Component({
  selector: 'idea-time-interval',
  templateUrl: 'timeInterval.component.html',
  styleUrls: ['timeInterval.component.scss']
})
export class IDEATimeIntervalComponent implements OnInit, OnDestroy, OnChanges {
  private _modal = inject(ModalController);
  private _translate = inject(IDEATranslationsService);

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

  valueToDisplay: string;
  private langChangeSubscription: Subscription;

  isOpening = false;

  ngOnInit(): void {
    // when the language changes, set the locale
    this.langChangeSubscription = this._translate.onLangChange.subscribe((): void => {
      this.valueToDisplay = this.getValueToDisplay(this.timeInterval);
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
        timeInterval: this.timeInterval,
        period: this.period,
        notEarlierThan: this.notEarlierThan,
        notLaterThan: this.notLaterThan,
        title: this.label
      }
    });
    modal.onDidDismiss().then((res: OverlayEventDetail): void => {
      // if the content changed, update the internal values and notify the parent component
      if (res.data === true || res.data === false) {
        this.valueToDisplay = this.getValueToDisplay(this.timeInterval);
        this.select.emit();
      }
    });
    modal.present();
    this.isOpening = false;
  }

  doSelectWhenDisabled(): void {
    if (this.disabled) this.selectWhenDisabled.emit();
  }

  doIconSelect(event: any): void {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}
