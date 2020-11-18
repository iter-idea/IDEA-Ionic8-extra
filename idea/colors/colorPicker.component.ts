import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PopoverController } from '@ionic/angular';

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
  @Input() public colors: Array<Color> = [
    { name: 'Radicchio', hex: '#AD1457' },
    { name: 'Tangerine', hex: '#F4511E' },
    { name: 'Citron', hex: '#E4C441' },
    { name: 'Basil', hex: '#0B8043' },
    { name: 'Blueberry', hex: '#3F51B5' },
    { name: 'Grape', hex: '#8E24AA' },
    { name: 'Blossom', hex: '#D81B60' },
    { name: 'Pumpkin', hex: '#EF6C00' },
    { name: 'Avocado', hex: '#C0CA33' },
    { name: 'Eucalyptus', hex: '#009688' },
    { name: 'Lavander', hex: '#7986CB' },
    { name: 'Cocoa', hex: '#795548' },
    { name: 'Tomato', hex: '#D50000' },
    { name: 'Mango', hex: '#F09300' },
    { name: 'Pistachio', hex: '#7CB342' },
    { name: 'Peacock', hex: '#039BE5' },
    { name: 'Wisteria', hex: '#B39DDB' },
    { name: 'Graphite', hex: '#616161' },
    { name: 'Flamingo', hex: '#E67C73' },
    { name: 'Banana', hex: '#F6BF26' },
    { name: 'Sage', hex: '#33B679' },
    { name: 'Cobalt', hex: '#039BE5' },
    { name: 'Amethyst', hex: '#9E69AF' },
    { name: 'Birch', hex: '#A79B8E' }
  ];
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
  @Input() public colors: Array<Color>;
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

/**
 * A color in the palette.
 */
export interface Color {
  name?: string;
  hex: string;
}
