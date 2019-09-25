import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import Moment = require('moment-timezone');

@Component({
  selector: 'idea-duration',
  templateUrl: 'duration.component.html',
  styleUrls: ['duration.component.scss']
})
export class IDEADurationComponent {
  /**
   * The default number of seconds, to build the duration.
   */
  @Input() public default: number;
  /**
   * The label for the field.
   */
  @Input() public label: string;
  /**
   * The icon (alternative to the label) for the field.
   */
  @Input() public icon: string;
  /**
   * The title (hint) for the field.
   */
  @Input() public title: string;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() public obligatory: boolean;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * Whether to show or hide the seconds input.
   */
  @Input() public hideSeconds: boolean;
  /**
   * Whether to show a shortened version of the labels.
   */
  @Input() public shortLabels: boolean;
  /**
   * On change event. It emits a number of seconds representing the duration.
   */
  @Output() public set = new EventEmitter<number>();

  /**
   * The hour part of the duration.
   */
  public hours: number;
  /**
   * The minutes part of the duration.
   */
  public minutes: number;
  /**
   * The seconds part of the duration.
   */
  public seconds: number;

  constructor() {
    this.default = this.hours = this.minutes = this.seconds = 0;
  }

  public ngOnChanges(changes: SimpleChanges) {
    // assign a default value to the duration
    if (changes['default'] && changes['default'].isFirstChange()) {
      const val = Moment.duration(this.default, 'seconds');
      this.hours = val.hours();
      this.minutes = val.minutes();
      this.seconds = this.hideSeconds ? 0 : val.seconds();
    }
  }

  /**
   * When one of the parts changes, emit the new duration.
   */
  public setDuration(type: string) {
    switch (type) {
      case 'hours':
        const hh = Number(this.hours) || 0;
        this.hours = hh > 23 ? 23 : hh < 0 ? 0 : hh;
        break;
      case 'minutes':
        const mm = Number(this.minutes) || 0;
        this.minutes = mm > 59 ? 59 : mm < 0 ? 0 : mm;
        break;
      case 'seconds':
        const ss = Number(this.seconds) || 0;
        if (this.hideSeconds) this.seconds = 0;
        else this.seconds = ss > 59 ? 59 : ss < 0 ? 0 : ss;
        break;
    }
    this.set.emit(this.hours * 3600 + this.minutes * 60 + this.seconds);
  }
}
