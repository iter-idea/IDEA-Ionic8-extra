import { Injectable } from '@angular/core';
import { ActionSheetButton } from '@ionic/core';
import { ActionSheetController, Platform, PopoverController } from '@ionic/angular';

import { IDEAActionSheetComponent } from './actionSheet.component';

/**
 * It's an alternative to the traditional ActionSheetController.
 * It shares (almost) the same inputs, so they are interchangeable.
 */
@Injectable()
export class IDEAActionSheetController {
  constructor(
    public platform: Platform,
    public actionSheetCtrl: ActionSheetController,
    public popoverCtrl: PopoverController
  ) {}

  /**
   * Based on the platform, open the traditional or the customised ActionSheet.
   */
  public create(options: IDEAActionSheetOptions, forceCustom?: boolean): Promise<HTMLIonActionSheetElement> {
    if (this.platform.is('mobile') && !forceCustom) return this.actionSheetCtrl.create(options);
    else
      return (this.popoverCtrl as any).create({
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
  buttons: Array<ActionSheetButton>;
  /**
   * Additional classes to apply for custom CSS. If multiple classes are provided they should be separated by spaces.
   */
  cssClass?: string;
  /**
   * Title for the action sheet.
   */
  header?: string;
}
