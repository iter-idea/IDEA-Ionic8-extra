import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Sentiment } from 'idea-toolbox';
import { IonItem, IonSpinner, IonBadge } from '@ionic/angular/standalone';
import { IDEAEnvironment, IDEATranslatePipe, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAOfflineService } from '../offline/offline.service';

@Component({
  selector: 'idea-sentiment',
  standalone: true,
  imports: [CommonModule, IDEATranslatePipe, IonBadge, IonSpinner, IonItem],
  template: `
    @if (text && _offline.isOnline()) {
      <ion-item [lines]="lines" [color]="color">
        @if (!sentiment) {
          <ion-spinner slot="end" size="small" />
        }
        @if (sentiment) {
          <ion-badge
            slot="end"
            size="small"
            [color]="getColorBySentiment()"
            [title]="'IDEA_UNCOMMON.SENTIMENT.RESULT_HINT' | translate: { sentiment: sentiment }"
          >
            {{ 'IDEA_UNCOMMON.SENTIMENT.RESULT.' + sentiment | translate }}
          </ion-badge>
        }
      </ion-item>
    }
  `
})
export class IDEASentimentComponent implements OnChanges {
  protected _env = inject(IDEAEnvironment);
  private _API = inject(IDEAAWSAPIService);
  private _translate = inject(IDEATranslationsService);
  _offline = inject(IDEAOfflineService);

  /**
   * The sentiment detected from the input text.
   */
  sentiment: Sentiment;
  /**
   * The input text.
   */
  @Input() text: string;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * Triggers when the sentiment change.
   */
  @Output() change = new EventEmitter<Sentiment>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.text.previousValue !== changes.text.currentValue) this.detectSentiment(changes.text.currentValue);
  }
  private async detectSentiment(text: string): Promise<void> {
    if (!text || this._offline.isOffline()) this.sentiment = null;
    else {
      try {
        const { sentiment } = await this._API.postResource('sentiment', {
          idea: true,
          body: { project: this._env.idea.project, language: this._translate.getCurrentLang(), text: this.text }
        });
        this.sentiment = sentiment;
        this.change.emit(this.sentiment);
      } catch (error) {
        this.sentiment = null;
      }
    }
  }

  getColorBySentiment(sentiment?: Sentiment | string): string {
    sentiment = sentiment || this.sentiment;
    switch (sentiment) {
      case Sentiment.POSITIVE:
        return 'success';
      case Sentiment.NEGATIVE:
        return 'danger';
      case Sentiment.MIXED:
        return 'warning';
      case Sentiment.NEUTRAL:
        return 'medium';
      default:
        return 'light';
    }
  }
}
