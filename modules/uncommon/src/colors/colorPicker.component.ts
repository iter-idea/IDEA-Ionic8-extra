import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { PopoverController } from '@ionic/angular/standalone';
import { Color, COLORS } from 'idea-toolbox';

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
  @Input() colors: Color[] = COLORS;
  /**
   * The current color.
   */
  @Input() current: string;
  /**
   * The label for the field.
   */
  @Input() label: string;
  /**
   * A placeholder for the field.
   */
  @Input() placeholder: string;
  /**
   * The icon for the field.
   */
  @Input() icon: string;
  /**
   * The color of the icon.
   */
  @Input() iconColor: string;
  /**
   * If true, the component is disabled.
   */
  @Input() disabled: boolean;
  /**
   * If true, the obligatory dot is shown.
   */
  @Input() obligatory: boolean;
  /**
   * Lines preferences for the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * On select event.
   */
  @Output() select = new EventEmitter<string>();
  /**
   * Icon select.
   */
  @Output() iconSelect = new EventEmitter<void>();

  private _popover = inject(PopoverController);

  async openPalette(event: any): Promise<void> {
    if (this.disabled) return;

    const componentProps = { colors: this.colors, current: this.current };
    const popover = await this._popover.create({ component: ColorsPaletteComponent, componentProps, event });
    popover.onDidDismiss().then(res => {
      if (res && res.data) this.select.emit(res.data);
    });
    popover.present();
  }

  doIconSelect(event: any): void {
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
          @for (c of colors; track c) {
            <ion-col [size]="2">
              <ion-avatar
                class="colorCircle tappable"
                [style.background-color]="c.hex"
                [title]="c.name || c.hex"
                (click)="pick(c.hex)"
              >
                @if (c.hex === current) {
                  <ion-icon name="checkmark" />
                }
              </ion-avatar>
            </ion-col>
          }
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
  private _popover = inject(PopoverController);

  /**
   * The pickable colors.
   */
  @Input() colors: Color[];
  /**
   * The current color.
   */
  @Input() current: string;

  pick(color: string): void {
    this._popover.dismiss(color);
  }
}
