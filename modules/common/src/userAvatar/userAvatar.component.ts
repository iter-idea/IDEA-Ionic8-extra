import { Component, OnInit, Input } from '@angular/core';

import { COLORS } from '../colors.model';

@Component({
  selector: 'idea-user-avatar',
  templateUrl: 'userAvatar.component.html',
  styleUrls: ['userAvatar.component.scss']
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

  constructor() {}
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
