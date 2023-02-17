import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Suggestion } from 'idea-toolbox';

import { IDEASuggestionsComponent } from '../select/suggestions.component';

import { IDEATranslationsService } from '../translations/translations.service';

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
  @Input() fill: string;

  constructor(private modalCtrl: ModalController, private t: IDEATranslationsService) {}

  getFlagURL(): string {
    return `assets/flags/${this.t.getCurrentLang()}.png`;
  }

  async pickLanguage(): Promise<void> {
    const componentProps = {
      data: this.t.getLangs().map(l => new Suggestion({ value: l, name: this.t.getLanguageNameByKey(l) })),
      searchPlaceholder: this.t._('IDEA_COMMON.LANGUAGE_PICKER.CHANGE_LANGUAGE'),
      sortData: true,
      hideIdFromUI: true,
      hideClearButton: true
    };
    const modal = await this.modalCtrl.create({ component: IDEASuggestionsComponent, componentProps });
    modal.onDidDismiss().then(({ data }): void => {
      if (data && data.value) this.t.use(data.value);
    });
    await modal.present();
  }
}
