import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Sentiment } from 'idea-toolbox';
import { IDEAEnvironment, IDEATranslationsService } from '@idea-ionic/common';

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAOfflineService } from '../offline/offline.service';

@Component({
  selector: 'idea-sentiment',
  templateUrl: 'sentiment.component.html',
  styleUrls: ['sentiment.component.scss']
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
