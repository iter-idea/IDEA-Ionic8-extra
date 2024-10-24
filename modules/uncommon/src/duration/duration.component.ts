import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';

@Component({
  selector: 'idea-duration',
  templateUrl: 'duration.component.html',
  styleUrls: ['duration.component.scss']
})
export class IDEADurationComponent implements OnChanges {
  /**
   * The default number of seconds, to build the duration.
   */
  @Input() default: number;
  /**
   * The label for the field.
   */
  @Input() label: string;
  /**
   * The icon (alternative to the label) for the field.
   */
  @Input() icon: string;
  /**
   * The title (hint) for the field.
   */
  @Input() title: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
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
   * Whether to show or hide the seconds input.
   */
  @Input() hideSeconds: boolean;
  /**
   * Whether to show a shortened version of the labels.
   */
  @Input() shortLabels: boolean;
  /**
   * On change event. It emits a number of seconds representing the duration.
   */
  @Output() set = new EventEmitter<number>();

  /**
   * The hour part of the duration.
   */
  hours: number;
  /**
   * The minutes part of the duration.
   */
  minutes: number;
  /**
   * The seconds part of the duration.
   */
  seconds: number;

  constructor() {
    this.default = this.hours = this.minutes = this.seconds = 0;
  }
  ngOnChanges(changes: SimpleChanges): void {
    // assign a default value to the duration
    if (changes['default'] && changes['default'].isFirstChange()) {
      const refDate = new Date(0);
      refDate.setHours(0, 0, 0);
      refDate.setSeconds(refDate.getSeconds() + this.default);
      this.hours = refDate.getHours();
      this.minutes = refDate.getMinutes();
      this.seconds = this.hideSeconds ? 0 : refDate.getSeconds();
    }
  }

  /**
   * When one of the parts changes, emit the new duration.
   */
  setDuration(type: string): void {
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
