import { Component, Input } from '@angular/core';
import { Address, Countries, getStringEnumKeyByValue, Suggestion } from 'idea-toolbox';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-address',
  templateUrl: 'address.component.html',
  styleUrls: ['address.component.scss']
})
export class IDEAAddressComponent {
  /**
   * The address to manage.
   */
  @Input() public address: Address;
  /**
   * If true, show the field `contact`.
   */
  @Input() public showContact: boolean;
  /**
   * If true, show the field `address2`.
   */
  @Input() public showAddress2: boolean;
  /**
   * If true, show the field `phone`.
   */
  @Input() public showPhone: boolean;
  /**
   * If true, show the field `email`.
   */
  @Input() public showEmail: boolean;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() public editMode: boolean;
  /**
   * The lines attribute of the item.
   */
  @Input() public lines: string;
  /**
   * If true, show obligatory dots.
   */
  @Input() public obligatory: boolean;
  /**
   * The label to show for the field; if not set, it has a default value.
   */
  @Input() public label: string;
  /**
   * The suggestions for the Countries picker.
   */
  public countriesSuggestions: Array<Suggestion>;
  /**
   * Shortcut to Countries enum.
   */
  public Countries = Countries;
  /**
   * To toggle the detailed view.
   */
  public addressCollapsed: boolean;

  constructor(public t: IDEATranslationsService) {
    this.address = new Address();
    this.showContact = false;
    this.showAddress2 = false;
    this.showPhone = false;
    this.showEmail = false;
    this.editMode = true;
    this.lines = 'inset';
    this.countriesSuggestions = Object.keys(Countries).map(
      k => new Suggestion({ value: (Countries as any)[k], name: k })
    );
    this.addressCollapsed = true;
  }

  /**
   * Toggle the detailed/collapsed view.
   */
  public toggleCollapse() {
    this.addressCollapsed = !this.addressCollapsed;
  }

  /**
   * Get the country's name.
   */
  public getCountryName(country: Countries): string {
    if (!country) return;
    return getStringEnumKeyByValue(Countries, country);
  }
}
