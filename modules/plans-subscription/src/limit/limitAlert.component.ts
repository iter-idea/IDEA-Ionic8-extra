import { Component, Input } from '@angular/core';
import { LimitCounter } from 'idea-toolbox';

import { IDEATranslationsService } from '@idea-ionic/common';

/**
 * A component to show a limit (LimitCounter)
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
  @Input() public limit: LimitCounter;
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
