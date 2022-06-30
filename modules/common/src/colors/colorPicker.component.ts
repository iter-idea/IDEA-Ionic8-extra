import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PopoverController } from '@ionic/angular';

import { Color, COLORS } from '../colors.model';

/**
 * Pick a color from a defined set.
 */
@Component({
  selector: 'idea-color-picker',
  templateUrl: 'colorPicker.component.html',
  styleUrls: ['colorPicker.component.scss']
})
export class IDEAColorPickerComponent {
  /**
   * The pickable colors.
   */
  @Input() public colors: Color[] = COLORS;
  /**
   * The current color.
   */
  @Input() public current: string;
  /**
   * The label for the field.
   */
  @Input() public label: string;
  /**
   * A placeholder for the field.
   */
  @Input() public placeholder: string;
  /**
   * The icon for the field.
   */
  @Input() public icon: string;
  /**
   * The color of the icon.
   */
  @Input() public iconColor: string;
  /**
   * If true, the component is disabled.
   */
  @Input() public disabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() public obligatory: boolean;
  /**
   * Lines preferences for the item.
   */
  @Input() public lines: string;
  /**
   * On select event.
   */
  @Output() public select = new EventEmitter<string>();
  /**
   * Icon select.
   */
  @Output() public iconSelect = new EventEmitter<void>();

  constructor(public popoverCtrl: PopoverController) {}

  /**
   * Open the popover to pick a color.
   */
  public openPalette(event: any) {
    if (this.disabled) return;
    this.popoverCtrl
      .create({
        component: ColorsPaletteComponent,
        componentProps: { colors: this.colors, current: this.current },
        event
      })
      .then(popover => {
        popover.onDidDismiss().then(res => {
          if (res && res.data) this.select.emit(res.data);
        });
        popover.present();
      });
  }

  /**
   * The icon was selected.
   */
  public doIconSelect(event: any) {
    if (event) event.stopPropagation();
    this.iconSelect.emit(event);
  }
}

/**
 * Component to open in a popover for displaying the colors available.
 */
@Component({
  selector: 'idea-colors-palette',
  template: `
    <ion-content>
      <ion-grid>
        <ion-row>
          <ion-col *ngFor="let c of colors" [size]="2">
            <ion-avatar
              class="colorCircle tappable"
              [style.background-color]="c.hex"
              [title]="c.name || c.hex"
              (click)="pick(c.hex)"
            >
              <ion-icon name="checkmark" *ngIf="c.hex === current"></ion-icon>
            </ion-avatar>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: var(--ion-color-white);
      }
      ion-avatar.colorCircle {
        width: 20px;
        height: 20px;
      }
      .tappable {
        cursor: pointer;
      }
      ion-avatar.colorCircle ion-icon {
        color: white;
        font-size: 1.2em;
      }
    `
  ]
})
export class ColorsPaletteComponent {
  /**
   * The pickable colors.
   */
  @Input() public colors: Color[];
  /**
   * The current color.
   */
  @Input() public current: string;

  constructor(public popoverCtrl: PopoverController) {}

  /**
   * Pick a color.
   */
  public pick(color: string) {
    this.popoverCtrl.dismiss(color);
  }
}
