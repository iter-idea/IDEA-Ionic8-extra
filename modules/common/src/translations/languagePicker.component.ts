import { Component, Input, OnInit, inject } from '@angular/core';
import { Suggestion } from 'idea-toolbox';
import { IonButton, IonItem, IonLabel, IonList, IonListHeader, IonPopover } from '@ionic/angular/standalone';

import { IDEATranslationsService } from '../translations/translations.service';
import { IDEATranslatePipe } from './translate.pipe';

// requires two assets folders:
//   1. flags, containing the pngs of each country's flags
//   2. i18n, containing the json of each country's translation

@Component({
  selector: 'idea-language-picker',
  imports: [IonButton, IonPopover, IonList, IonListHeader, IonItem, IonLabel, IDEATranslatePipe],
  template: `
    <ion-button id="click-trigger" [fill]="fill" [title]="'IDEA_COMMON.LANGUAGE_PICKER.CHANGE_LANGUAGE' | translate">
      <img [src]="getFlagURL()" />
    </ion-button>
    <ion-popover #popover trigger="click-trigger" triggerAction="click">
      <ng-template>
        <ion-list>
          <ion-list-header>
            <ion-label>{{ 'IDEA_COMMON.LANGUAGE_PICKER.CHANGE_LANGUAGE' | translate }}</ion-label>
          </ion-list-header>
          @for (language of languages; track language.value) {
            <ion-item button (click)="pickLanguage(language.value, popover)">
              <img slot="start" [src]="getFlagURL(language.value)" />
              <ion-label>{{ language.name }}</ion-label>
            </ion-item>
          }
        </ion-list>
      </ng-template>
    </ion-popover>
  `,
  styles: [
    `
      img {
        border: 1px solid transparent;
        border-radius: 20px;
        width: 25px;
      }
    `
  ]
})
export class IDEALanguagePickerComponent implements OnInit {
  private _translate = inject(IDEATranslationsService);

  /**
   * Button fill preference.
   */
  @Input() fill: string;

  languages: { value: string; name: string }[] = [];

  ngOnInit(): void {
    this.languages = this._translate
      .getLangs()
      .map(l => new Suggestion({ value: l, name: this._translate.getLanguageNameByKey(l) }));
  }

  getFlagURL(languageCode?: string): string {
    return `assets/flags/${languageCode || this._translate.getCurrentLang()}.png`;
  }

  pickLanguage(languageCode: string, popover: IonPopover): void {
    if (languageCode) this._translate.use(languageCode);
    if (popover) popover.dismiss();
  }
}
