import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonItem, IonIcon, IonLabel, IonText } from '@ionic/angular/standalone';
import { IDEATranslatePipe } from '@idea-ionic/common';

@Component({
  selector: 'idea-duration',
  standalone: true,
  imports: [IonText, IonLabel, IonIcon, IonItem, CommonModule, FormsModule, IDEATranslatePipe],
  template: `
    <ion-item class="durationItem" [lines]="lines" [color]="color" [title]="title || label">
      @if (icon) {
        <ion-icon slot="start" [name]="icon" />
      }
      @if (!icon && label) {
        <ion-label position="stacked">
          {{ label }}
          @if (obligatory && !disabled) {
            <ion-text class="obligatoryDot" />
          }
        </ion-label>
      }
      <ion-label class="value">
        <ion-input
          type="number"
          min="0"
          max="23"
          inputmode="numeric"
          [disabled]="disabled"
          [(ngModel)]="hours"
          (ionChange)="setDuration('hours')"
        />
        <ion-text>{{
          ((shortLabels ? 'IDEA_UNCOMMON.DURATION.HH' : 'IDEA_UNCOMMON.DURATION.HOURS') | translate).toLowerCase()
        }}</ion-text>
        <ion-input
          type="number"
          min="0"
          max="59"
          inputmode="numeric"
          [disabled]="disabled"
          [(ngModel)]="minutes"
          (ionChange)="setDuration('minutes')"
        />
        <ion-text>{{
          ((shortLabels ? 'IDEA_UNCOMMON.DURATION.MM' : 'IDEA_UNCOMMON.DURATION.MINUTES') | translate).toLowerCase()
        }}</ion-text>
        @if (!hideSeconds) {
          <ion-input
            type="number"
            min="0"
            max="59"
            inputmode="numeric"
            [disabled]="disabled"
            [(ngModel)]="seconds"
            (ionChange)="setDuration('seconds')"
          />
        }
        @if (!hideSeconds) {
          <ion-text>
            {{
              ((shortLabels ? 'IDEA_UNCOMMON.DURATION.SS' : 'IDEA_UNCOMMON.DURATION.SECONDS') | translate).toLowerCase()
            }}
          </ion-text>
        }
      </ion-label>
    </ion-item>
  `,
  styles: [
    `
      .durationItem {
        .value {
          max-width: none;
          width: 100%;
          pointer-events: all;
          ion-input {
            display: inline-block;
            max-width: 35px;
            text-align: right;
          }
          ion-text {
            margin-left: 10px;
            margin-right: 20px;
            font-size: 0.8em;
          }
        }
      }
    `
  ]
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
