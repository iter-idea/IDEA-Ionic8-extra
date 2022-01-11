import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Sentiment } from 'idea-toolbox';

import { IDEAAWSAPIService } from '../AWSAPI.service';
import { IDEAOfflineService } from '../offline/offline.service';
import { IDEATranslationsService } from '../translations/translations.service';

import { environment as env } from '@env';

@Component({
  selector: 'idea-sentiment',
  templateUrl: 'sentiment.component.html',
  styleUrls: ['sentiment.component.scss']
})
export class IDEASentimentComponent implements OnChanges {
  /**
   * The sentiment detected from the input text.
   */
  public sentiment: Sentiment;
  /**
   * The input text.
   */
  @Input() public text: string;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines = 'none';
  /**
   * Triggers when the sentiment change.
   */
  @Output() public change = new EventEmitter<Sentiment>();

  constructor(public offline: IDEAOfflineService, public API: IDEAAWSAPIService, public t: IDEATranslationsService) {}
  ngOnChanges(changes: SimpleChanges) {
    if (changes.text.previousValue !== changes.text.currentValue) this.detectSentiment(changes.text.currentValue);
  }
  /**
   * Detect the sentiment of the input string, by running a request to the IDEA's online utility.
   */
  protected detectSentiment(text: string) {
    if (!text || this.offline.isOffline()) this.sentiment = null;
    else {
      this.API.postResource('sentiment', {
        idea: true,
        body: { project: env.idea.project, language: this.t.getCurrentLang(), text: this.text }
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
  public getColorBySentiment(sentiment?: Sentiment | string): string {
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
