import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonAvatar, IonImg } from '@ionic/angular/standalone';
import { COLORS } from 'idea-toolbox';

import { IDEASelectComponent } from '../select/select.component';

@Component({
  selector: 'idea-user-avatar',
  standalone: true,
  imports: [CommonModule, IDEASelectComponent, IonAvatar, IonImg],
  template: `
    <div class="container">
      @if (src) {
        <ion-avatar style="height: var(--avatar-size); width: var(--avatar-size)" [ngClass]="size" [title]="name">
          <ion-img [src]="src" (ionError)="fallbackToInitials()" />
        </ion-avatar>
      }
      @if (!src) {
        <div
          class="circle"
          style="height: var(--avatar-size); width: var(--avatar-size)"
          [ngClass]="size"
          [title]="name"
          [style.background]="'#' + color"
        >
          <div
            class="text"
            style="line-height: var(--avatar-size); font-size: var(--avatar-font-size)"
            [style.color]="'#' + fontColor"
          >
            {{ initials }}
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      div.container {
        text-align: center;
        padding: var(--avatar-container-padding, 0);
        margin: var(--avatar-container-margin, 0);
      }
      ion-avatar,
      div.circle {
        border: 0.5px solid var(--ion-color-dark-tint);
        margin: 0 auto;
      }
      div.circle {
        border-radius: 50%;
        display: inline-block;
        text-align: center;
        vertical-align: top;
        div.text {
          font-weight: bold;
          letter-spacing: -0.5px;
        }
      }
      .mini {
        --avatar-size: 14px;
        --avatar-font-size: 8px;
      }
      .small {
        --avatar-size: 24px;
        --avatar-font-size: 9px;
      }
      .default {
        --avatar-size: 40px;
        --avatar-font-size: 16px;
      }
      .large {
        --avatar-size: 80px;
        --avatar-font-size: 32px;
      }
      .extraLarge {
        --avatar-size: 120px;
        --avatar-font-size: 52px;
      }
    `
  ]
})
export class IDEAUserAvatarComponent implements OnInit {
  /**
   * The link to the avatar media to show.
   */
  @Input() src?: string;
  /**
   * The full name of the user (to use as fallback in case the media isn't available).
   */
  @Input() name = '?';
  /**
   * The size of the avatar.
   */
  @Input() size: 'mini' | 'small' | 'default' | 'large' | 'extraLarge' = 'default';
  /**
   * The HEX color of the avatar's background.
   */
  @Input() color?: string;

  initials: string;
  fontColor: string;
  borderColor: string;

  ngOnInit(): void {
    this.setInitialsFromName();
    if (!this.color) this.color = getHexColorFromString(this.name);
    if (this.color.charAt(0) === '#') this.color = this.color.slice(1);
    this.setFontColorBasedOnBackground();
  }

  private setInitialsFromName(): void {
    if (!this.name) this.initials = '?';
    else {
      const initials = this.name
        .split(' ')
        .reduce((initials, name): string => initials + name.charAt(0), '')
        .toUpperCase();

      this.initials =
        initials.length > 1 && this.size !== 'mini'
          ? initials.charAt(0).concat(initials.charAt(initials.length - 1))
          : initials.charAt(0);
    }
  }
  fallbackToInitials(): void {
    this.src = undefined;
  }

  setFontColorBasedOnBackground(): void {
    this.fontColor = getBlackWhiteInvertedHexColor(this.color);
  }
}

//
// HELPERS
//

const getHexColorFromString = (str: string): string => {
  return COLORS[getNumericHashFromString(str) % COLORS.length].hex;
};

const getNumericHashFromString = (str: string): number => {
  let hash = 0;
  if (str.length == 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // convert to 32bit integer
  }
  return Math.abs(hash);
};

const getBlackWhiteInvertedHexColor = (hexColor: string): string =>
  getLumeOfHexColor(hexColor) >= 165 ? '000' : 'fff';

const getLumeOfHexColor = (hexColor: string): number => {
  const rgb = hexColorToRGBArray(hexColor);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; // SMPTE C, Rec. 709 weightings
};

const hexColorToRGBArray = (hexColor: string): number[] => {
  try {
    if (hexColor.length === 3)
      hexColor =
        hexColor.charAt(0) +
        hexColor.charAt(0) +
        hexColor.charAt(1) +
        hexColor.charAt(1) +
        hexColor.charAt(2) +
        hexColor.charAt(2);
    else if (hexColor.length !== 6) throw 'Invalid hex color: ' + hexColor;
    const rgb = [];
    for (let i = 0; i <= 2; i++) rgb[i] = parseInt(hexColor.substr(i * 2, 2), 16);
    return rgb;
  } catch (error) {
    return [255, 255, 255];
  }
};
