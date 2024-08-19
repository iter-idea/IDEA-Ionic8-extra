import { Component, Input, OnInit, inject } from '@angular/core';
import { ActionSheetButton } from '@ionic/core';
import { PopoverController } from '@ionic/angular';

/**
 * It's an alternative for desktop devices to the traditional ActionSheet.
 * It shares (almost) the same inputs so they are interchangeable.
 */
@Component({
  selector: 'idea-action-sheet',
  templateUrl: 'actionSheet.component.html',
  styleUrls: ['actionSheet.component.scss']
})
export class IDEAActionSheetComponent implements OnInit {
  private _popover = inject(PopoverController);

  /**
   * An array of buttons for the actions panel.
   */
  @Input() buttons: ActionSheetButton[] = [];
  /**
   * Additional classes to apply for custom CSS. If multiple classes are provided they should be separated by spaces.
   */
  @Input() cssClass: string;
  /**
   * Title for the actions panel.
   */
  @Input() header: string;
  /**
   * Subtitle for the actions panel.
   */
  @Input() subHeader: string;

  withIcons: boolean;

  ngOnInit(): void {
    // based on the input, changes the way the UI behaves
    this.withIcons = this.buttons.some(b => b.icon);
  }

  buttonClicked(b: ActionSheetButton): void {
    if (b.handler) b.handler();
    this._popover.dismiss();
  }
}
