import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import IdeaX = require('idea-toolbox');

import { IDEATranslationsService } from '../translations/translations.service';

import { IDEASuggestionsComponent } from '../select/suggestions.component';

// requires two assets folders:
//   1. flags, containing the pngs of each country's flags
//   2. i18n, containing the json of each country's translation

@Component({
  selector: 'idea-language-picker',
  templateUrl: 'languagePicker.component.html',
  styleUrls: ['languagePicker.component.scss']
})
export class IDEALanguagePickerComponent {
  /**
   * Button fill preference.
   */
  @Input() public fill: string;

  constructor(public t: IDEATranslationsService, public modalCtrl: ModalController) {}

  /**
   * Get the URL to the flag of the current language.
   */
  public getFlagURL(): string {
    return `assets/flags/${this.t.getCurrentLang()}.png`;
  }

  /**
   * Show the list of languages, to choose one.
   */
  public pickLanguage() {
    this.modalCtrl
      .create({
        component: IDEASuggestionsComponent,
        componentProps: {
          data: this.t.getLangs().map(l => new IdeaX.Suggestion({ value: l, name: this.t.getLangNameByKey(l) })),
          searchPlaceholder: this.t._('IDEA.LANGUAGE_PICKER.CHANGE_LANGUAGE'),
          sortData: true,
          hideIdFromUI: true,
          hideClearButton: true
        }
      })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          if (res.data && res.data.value) this.t.use(res.data.value);
        });
        modal.present();
      });
  }
}
