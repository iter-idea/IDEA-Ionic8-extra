import { Component, Input } from '@angular/core';
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';

/**
 * A component to show a limit (IdeaX.LimitCounter)
 */
@Component({
  selector: 'idea-limit-alert',
  templateUrl: 'limitAlert.component.html',
  styleUrls: ['limitAlert.component.scss']
})
export class IDEALimitAlertComponent {
  /**
   * The limit to show.
   */
  @Input() public limit: IdeaX.LimitCounter;
  /**
   * The name of the limit.
   */
  @Input() public name: string;

  constructor(public t: IDEATranslationsService) {}

  /**
   * Get a color based on the limit's status.
   */
  public getLimitColor(): string {
    if (this.limit.limitReached()) return 'danger';
    else if (this.limit.isCloseToLimit()) return 'warning';
    else return 'success';
  }
}
