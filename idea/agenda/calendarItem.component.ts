import { Component, Input, EventEmitter, Output } from '@angular/core';
import IdeaX = require('idea-toolbox');

import { IDEATinCanService } from '../tinCan.service';
import { IDEATranslationsService } from '../translations/translations.service';

import { Membership } from '../../../../../api/_shared/membership.model';

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
  /**
   * The current membership.
   */
  public membership: Membership;

  constructor(public tc: IDEATinCanService, public t: IDEATranslationsService) {}
  public ngOnInit() {
    this.membership = this.tc.get('membership');
  }

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
