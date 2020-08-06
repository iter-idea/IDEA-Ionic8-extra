import { Component, Input } from '@angular/core';
import Moment = require('moment-timezone');
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';
import { AlertController } from '@ionic/angular';

/**
 * A component to show a limit (IdeaX.LimitCounter)
 */
@Component({
  selector: 'idea-limit',
  templateUrl: 'limit.component.html',
  styleUrls: ['limit.component.scss']
})
export class IDEALimitComponent {
  /**
   * The limit to show.
   */
  @Input() public limit: IdeaX.LimitCounter;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * The name of the limit.
   */
  @Input() public name: string;
  /**
   * The description of the limit.
   */
  @Input() public description: string;
  /**
   * The timestamp when the limit's counter will be reset.
   */
  @Input() public renewsOn: IdeaX.epochDateTime;
  /**
   * A shortcut to use Moment in UI.
   */
  public Moment = Moment;

  constructor(public alertCtrl: AlertController, public t: IDEATranslationsService) {}

  /**
   * Get a color based on the limit's status.
   */
  public getLimitColor(): string {
    if (this.limit.limitReached()) return 'danger';
    else if (this.limit.isCloseToLimit()) return 'warning';
    else return 'success';
  }

  /**
   * Shows the description of the limit.
   */
  public showDescription(event: any) {
    if (event) event.stopPropagation();
    if (this.description) {
      this.alertCtrl
        .create({ header: this.name, message: this.description, buttons: ['OK'], cssClass: 'alertLongOptions' })
        .then(alert => alert.present());
    }
  }
}
