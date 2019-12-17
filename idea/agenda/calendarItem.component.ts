import { Component, Input, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';

@Component({
  selector: 'idea-calendar-item',
  templateUrl: 'calendarItem.component.html',
  styleUrls: ['calendarItem.component.scss']
})
export class IDEACalendarItemComponent {
  /**
   * The calendar to show.
   */
  @Input() public calendar: IdeaX.Calendar;
  /**
   * Whether the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * Emit selection of a calendar.
   */
  @Output() public select = new EventEmitter<void>();

  constructor(public tc: IDEATinCanService, public t: TranslateService) {}

  /**
   * Get the ionicon of a service from its name.
   */
  public getServiceIcon(service: IdeaX.ExternalCalendarSources): string {
    switch (service) {
      case IdeaX.ExternalCalendarSources.GOOGLE:
        return 'logo-google';
      case IdeaX.ExternalCalendarSources.MICROSOFT:
        return 'logo-windows';
      default:
        return 'help';
    }
  }
}
