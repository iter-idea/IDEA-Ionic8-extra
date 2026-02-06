import { Component, Input, OnInit, inject } from '@angular/core';
import { ActionSheetButton } from '@ionic/core';
import {
  IonContent,
  IonGrid,
  IonCol,
  IonRow,
  IonLabel,
  IonButton,
  IonIcon,
  PopoverController
} from '@ionic/angular/standalone';

/**
 * It's an alternative for desktop devices to the traditional ActionSheet.
 * It shares (almost) the same inputs so they are interchangeable.
 */
@Component({
  selector: 'idea-action-sheet',
  imports: [IonIcon, IonButton, IonLabel, IonRow, IonCol, IonGrid, IonContent],
  template: `
    <ion-content [class]="cssClass">
      <ion-grid class="ion-padding">
        @if (header) {
          <ion-row class="headerRow">
            <ion-col class="ion-text-center">
              <ion-label class="ion-text-wrap">
                {{ header }}
                @if (subHeader) {
                  <p>{{ subHeader }}</p>
                }
              </ion-label>
            </ion-col>
          </ion-row>
        }
        <ion-row class="ion-justify-content-center buttonsRow">
          @for (button of buttons; track button) {
            <ion-col [size]="withIcons ? 6 : 12">
              <ion-button
                fill="clear"
                expand="full"
                color="medium"
                [class.withIcon]="withIcons"
                [class.destructive]="button.role === 'destructive'"
                [class.cancel]="button.role === 'cancel'"
                (click)="buttonClicked(button)"
              >
                <div>
                  @if (withIcons) {
                    <ion-icon [icon]="button.icon || 'flash'" />
                  }
                  @if (withIcons) {
                    <br />
                  }
                  <ion-label class="ion-text-wrap">{{ button.text }}</ion-label>
                </div>
              </ion-button>
            </ion-col>
          }
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [
    `
      ion-row.headerRow {
        margin-top: 8px;
        margin-bottom: 16px;
        font-size: 1.2em;
        font-weight: 500;
      }
      ion-row.buttonsRow {
        margin-bottom: 8px;
        ion-button {
          text-transform: none;
          --ion-color-base: var(--ion-text-color-step-350) !important;
          &.destructive {
            --ion-color-base: var(--ion-color-danger) !important;
          }
          &.cancel {
            --ion-color-base: var(--ion-text-color-step-650) !important;
          }
          &.withIcon {
            height: 100%;
            div {
              display: flex;
              flex-flow: column nowrap;
              align-items: center;
              ion-icon {
                font-size: 1.8em;
              }
              br {
                content: '';
                margin-bottom: 10px;
              }
            }
          }
        }
      }
      .action-sheet-cancel ion-icon {
        opacity: 0.8;
      }
    `
  ]
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

  buttonClicked(button: ActionSheetButton): void {
    if (button.handler) button.handler();
    this._popover.dismiss();
  }
}
