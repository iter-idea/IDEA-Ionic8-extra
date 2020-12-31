import { Component, Input } from '@angular/core';
import { ActionSheetButton } from '@ionic/core';
import { PopoverController } from '@ionic/angular';

import { IDEATranslationsService } from '../translations/translations.service';

/**
 * It's an alternative for desktop devices to the traditional ActionSheet.
 * It shares (almost) the same inputs so they are interchangeable.
 */
@Component({
  selector: 'idea-action-sheet',
  templateUrl: 'actionSheet.component.html',
  styleUrls: ['actionSheet.component.scss']
})
export class IDEAActionSheetComponent {
  /**
   * An array of buttons for the actions panel.
   */
  @Input() public buttons: Array<ActionSheetButton> = [];
  /**
   * Additional classes to apply for custom CSS. If multiple classes are provided they should be separated by spaces.
   */
  @Input() public cssClass: string;
  /**
   * Title for the actions panel.
   */
  @Input() public header: string;
  /**
   * Whether at least one button has an icon set; it changes the way the UI behaves.
   */
  public withIcons: boolean;

  constructor(public popoverCtrl: PopoverController, public t: IDEATranslationsService) {}
  public ngOnInit() {
    // based on the input, changes the way the UI behaves
    this.withIcons = this.buttons.some(b => b.icon);
  }

  /**
   * Execute the button's action and close the action sheet.
   */
  public buttonClicked(b: ActionSheetButton) {
    if (b.handler) b.handler();
    this.popoverCtrl.dismiss();
  }
}
