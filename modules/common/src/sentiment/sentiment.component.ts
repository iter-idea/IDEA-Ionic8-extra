import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { Sentiment } from 'idea-toolbox';

import { IDEAEnvironment } from '../../environment';
import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAOfflineService } from '../offline/offline.service';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-sentiment',
  templateUrl: 'sentiment.component.html',
  styleUrls: ['sentiment.component.scss']
})
export class IDEASentimentComponent implements OnChanges {
  protected env = inject(IDEAEnvironment);

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

  constructor(
    public offline: IDEAOfflineService,
    public API: IDEAAWSAPIService,
    public t: IDEATranslationsService
  ) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.text.previousValue !== changes.text.currentValue) this.detectSentiment(changes.text.currentValue);
  }
  /**
   * Detect the sentiment of the input string, by running a request to the IDEA's online utility.
   */
  private detectSentiment(text: string): void {
    if (!text || this.offline.isOffline()) this.sentiment = null;
    else {
      this.API.postResource('sentiment', {
        idea: true,
        body: { project: this.env.idea.project, language: this.t.getCurrentLang(), text: this.text }
      })
        .then(res => {
          this.sentiment = res.sentiment as Sentiment;
          this.change.emit(this.sentiment);
        })
        .catch(() => (this.sentiment = null));
    }
  }

  /**
   * Get the color based on the subject sentiment notes.
   */
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
