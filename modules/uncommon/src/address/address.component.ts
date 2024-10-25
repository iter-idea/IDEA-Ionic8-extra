import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonAccordionGroup, IonAccordion, IonItem, IonInput, IonList, IonText } from '@ionic/angular/standalone';
import { Address, Countries, Suggestion } from 'idea-toolbox';
import { IDEASelectComponent, IDEATranslatePipe } from '@idea-ionic/common';

@Component({
  selector: 'idea-address',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IDEATranslatePipe,
    IDEASelectComponent,
    IonText,
    IonList,
    IonInput,
    IonItem,
    IonAccordion,
    IonAccordionGroup
  ],
  template: `
    @if (address) {
      <ion-accordion-group #accordion>
        <ion-accordion value="open">
          <ion-item slot="header" button [color]="color" [lines]="lines">
            @if (isCollapsed()) {
              <ion-input
                readonly
                [labelPlacement]="isCollapsed() ? 'stacked' : ''"
                [label]="label || ('IDEA_UNCOMMON.ADDRESS.COMPLETE_ADDRESS' | translate)"
                [title]="'IDEA_UNCOMMON.ADDRESS.COMPLETE_ADDRESS_HINT' | translate"
                [placeholder]="placeholder"
                [value]="address.getFullAddress()"
                (ionChange)="addressChange.emit(address)"
              />
            }
          </ion-item>
          <ion-list slot="content">
            @if (showContact) {
              <ion-item [color]="color">
                <ion-input
                  autocomplete="new"
                  labelPlacement="stacked"
                  [label]="'IDEA_UNCOMMON.ADDRESS.CONTACT' | translate"
                  [disabled]="!editMode"
                  [placeholder]="'IDEA_UNCOMMON.ADDRESS.CONTACT_HINT' | translate"
                  [title]="'IDEA_UNCOMMON.ADDRESS.CONTACT_HINT' | translate"
                  [(ngModel)]="address.contact"
                  (ionChange)="addressChange.emit(address)"
                />
              </ion-item>
            }
            @if (showEmail) {
              <ion-item [color]="color">
                <ion-input
                  autocomplete="new"
                  labelPlacement="stacked"
                  [label]="'IDEA_UNCOMMON.ADDRESS.EMAIL' | translate"
                  [disabled]="!editMode"
                  [placeholder]="'IDEA_UNCOMMON.ADDRESS.EMAIL_HINT' | translate"
                  [title]="'IDEA_UNCOMMON.ADDRESS.EMAIL_HINT' | translate"
                  [(ngModel)]="address.email"
                  (ionChange)="addressChange.emit(address)"
                />
              </ion-item>
            }
            @if (showPhone) {
              <ion-item [color]="color">
                <ion-input
                  autocomplete="new"
                  labelPlacement="stacked"
                  [label]="'IDEA_UNCOMMON.ADDRESS.PHONE' | translate"
                  [disabled]="!editMode"
                  [placeholder]="'IDEA_UNCOMMON.ADDRESS.PHONE_HINT' | translate"
                  [title]="'IDEA_UNCOMMON.ADDRESS.PHONE_HINT' | translate"
                  [(ngModel)]="address.phone"
                  (ionChange)="addressChange.emit(address)"
                />
              </ion-item>
            }
            <ion-item [color]="color">
              <ion-input
                autocomplete="new"
                labelPlacement="stacked"
                [disabled]="!editMode"
                [placeholder]="'IDEA_UNCOMMON.ADDRESS.ADDRESS_HINT' | translate"
                [title]="'IDEA_UNCOMMON.ADDRESS.ADDRESS_HINT' | translate"
                [(ngModel)]="address.address"
                (ionChange)="addressChange.emit(address)"
              >
                <div slot="label">
                  {{ 'IDEA_UNCOMMON.ADDRESS.ADDRESS' | translate }}
                  @if (editMode && obligatory) {
                    <ion-text class="obligatoryDot" />
                  }
                </div>
              </ion-input>
            </ion-item>
            @if (showAddress2) {
              <ion-item [color]="color">
                <ion-input
                  autocomplete="new"
                  labelPlacement="stacked"
                  [label]="'IDEA_UNCOMMON.ADDRESS.ADDRESS2' | translate"
                  [disabled]="!editMode"
                  [placeholder]="'IDEA_UNCOMMON.ADDRESS.ADDRESS2_HINT' | translate"
                  [title]="'IDEA_UNCOMMON.ADDRESS.ADDRESS2_HINT' | translate"
                  [(ngModel)]="address.address2"
                  (ionChange)="addressChange.emit(address)"
                />
              </ion-item>
            }
            <ion-item [color]="color">
              <ion-input
                autocomplete="new"
                labelPlacement="stacked"
                [label]="'IDEA_UNCOMMON.ADDRESS.POSTCODE' | translate"
                [disabled]="!editMode"
                [placeholder]="'IDEA_UNCOMMON.ADDRESS.POSTCODE_HINT' | translate"
                [title]="'IDEA_UNCOMMON.ADDRESS.POSTCODE_HINT' | translate"
                [(ngModel)]="address.postcode"
                (ionChange)="addressChange.emit(address)"
              />
            </ion-item>
            <ion-item [color]="color">
              <ion-input
                autocomplete="new"
                [disabled]="!editMode"
                labelPlacement="stacked"
                [placeholder]="'IDEA_UNCOMMON.ADDRESS.CITY_HINT' | translate"
                [title]="'IDEA_UNCOMMON.ADDRESS.CITY_HINT' | translate"
                [(ngModel)]="address.city"
                (ionChange)="addressChange.emit(address)"
              >
                <div slot="label">
                  {{ 'IDEA_UNCOMMON.ADDRESS.CITY' | translate }}
                  @if (editMode && obligatory) {
                    <ion-text class="obligatoryDot" />
                  }
                </div>
              </ion-input>
            </ion-item>
            <ion-item [color]="color">
              <ion-input
                autocomplete="new"
                labelPlacement="stacked"
                [label]="'IDEA_UNCOMMON.ADDRESS.PROVINCE' | translate"
                [disabled]="!editMode"
                [placeholder]="'IDEA_UNCOMMON.ADDRESS.PROVINCE_HINT' | translate"
                [title]="'IDEA_UNCOMMON.ADDRESS.PROVINCE_HINT' | translate"
                [(ngModel)]="address.province"
                (ionChange)="addressChange.emit(address)"
              />
            </ion-item>
            <idea-select
              [color]="color"
              [data]="countriesSuggestions"
              [label]="'IDEA_UNCOMMON.ADDRESS.COUNTRY' | translate"
              [lines]="editMode ? lines : null"
              [description]="getCountryName(address.country)"
              [placeholder]="'IDEA_UNCOMMON.ADDRESS.COUNTRY_HINT' | translate"
              [searchPlaceholder]="'IDEA_UNCOMMON.ADDRESS.COUNTRY_HINT' | translate"
              [hideIdFromUI]="true"
              [avoidAutoSelection]="true"
              [disabled]="!editMode"
              (select)="setCountryFromSuggestion($event)"
            />
          </ion-list>
        </ion-accordion>
      </ion-accordion-group>
    }
  `,
  styles: [
    `
      ion-item[slot='header'] ion-input {
        --highlight-color-focused: transparent;
        --highlight-color-valid: transparent;
        --highlight-color-invalid: transparent;
      }
      ion-list[slot='content'] {
        padding-top: 0;
        padding-left: 20px;
      }
    `
  ]
})
export class IDEAAddressComponent implements OnInit {
  /**
   * The address to manage.
   */
  @Input() address: Address;
  @Output() addressChange = new EventEmitter<Address>();
  /**
   * If true, show the field `contact`.
   */
  @Input() showContact = false;
  /**
   * If true, show the field `address2`.
   */
  @Input() showAddress2 = false;
  /**
   * If true, show the field `phone`.
   */
  @Input() showPhone = false;
  /**
   * If true, show the field `email`.
   */
  @Input() showEmail = false;
  /**
   * Whether the fields are editable or disabled.
   */
  @Input() editMode = true;
  /**
   * If true, show obligatory dots.
   */
  @Input() obligatory = false;
  /**
   * The lines attribute of the item.
   */
  @Input() lines: string;
  /**
   * The color for the component.
   */
  @Input() color: string;
  /**
   * The label to show for the field; if not set, it has a default value.
   */
  @Input() label: string;
  /**
   * The placeholder to show for the field.
   */
  @Input() placeholder: string;
  /**
   * To toggle the detailed view.
   */
  @Input() openByDefault = false;

  countriesSuggestions: Suggestion[];
  Countries = Countries;
  @ViewChild('accordion') accordion: IonAccordionGroup;

  ngOnInit(): void {
    this.countriesSuggestions = Object.keys(Countries).map(
      k => new Suggestion({ value: (Countries as any)[k], name: k })
    );
  }

  isCollapsed(): boolean {
    return this.accordion?.value !== 'open';
  }

  getCountryName(countryCode: Countries): string {
    if (!countryCode) return;
    const country = Object.entries(Countries).find(([_, value]): boolean => value === countryCode);
    return country ? country[0] : null;
  }
  setCountryFromSuggestion(suggestion: Suggestion): void {
    if (!suggestion) return;
    this.address.country = suggestion.value;
    this.addressChange.emit(this.address);
  }
}
