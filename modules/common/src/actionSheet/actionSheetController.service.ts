import { Injectable, inject } from '@angular/core';
import { ActionSheetButton } from '@ionic/core';
import { ActionSheetController, Platform, PopoverController } from '@ionic/angular';

import { IDEAActionSheetComponent } from './actionSheet.component';

/**
 * It's an alternative to the traditional ActionSheetController.
 * It shares (almost) the same inputs, so they are interchangeable.
 */
@Injectable()
export class IDEAActionSheetController {
  private _platform = inject(Platform);
  private _actions = inject(ActionSheetController);
  private _popover = inject(PopoverController);

  /**
   * Based on the platform, open the traditional or the customised ActionSheet.
   */
  create(options: IDEAActionSheetOptions, forceCustom?: boolean): Promise<HTMLIonActionSheetElement> {
    if ((this._platform.is('mobile') || this._platform.width() < 576) && !forceCustom)
      return this._actions.create(options);
    else
      return (this._popover as any).create({
        backdropDismiss: options.backdropDismiss,
        component: IDEAActionSheetComponent,
        componentProps: options,
        cssClass: 'actionSheetPopover'
      }) as Promise<HTMLIonActionSheetElement>;
  }
}

/**
 * The options for the ActionSheet.
 */
export interface IDEAActionSheetOptions {
  /**
   * If true, the action sheet will be dismissed when the backdrop is clicked.
   */
  backdropDismiss?: boolean;
  /**
   * An array of buttons for the action sheet.
   */
  buttons: ActionSheetButton[];
  /**
   * Additional classes to apply for custom CSS. If multiple classes are provided they should be separated by spaces.
   */
  cssClass?: string;
  /**
   * Title for the action sheet.
   */
  header?: string;
  /**
   * Subtitle for the action sheet.
   */
  subHeader?: string;
}
