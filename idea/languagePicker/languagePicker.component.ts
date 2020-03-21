import { Component } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { OverlayEventDetail } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import IdeaX = require('idea-toolbox');

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
  constructor(
    public t: TranslateService,
    public storage: Storage,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController
  ) {}

  /**
   * Show the list of languages, to choose one.
   */
  public pickLanguage() {
    this.modalCtrl
      .create({
        component: IDEASuggestionsComponent,
        componentProps: {
          data: this.t
            .getLangs()
            .map(l => new IdeaX.Suggestion({ value: l, name: this.t.instant('LANGUAGES.'.concat(l.toUpperCase())) })),
          searchPlaceholder: this.t.instant('IDEA.LANGUAGE_PICKER.CHANGE_LANGUAGE'),
          sortData: true,
          hideIdFromUI: true,
          hideClearButton: true
        }
      })
      .then(modal => {
        modal.onDidDismiss().then((res: OverlayEventDetail) => {
          if (res.data && res.data.value) this.changeLanguage(res.data.value);
        });
        modal.present();
      });
  }

  /**
   * Ask for confirmation and change the language.
   */
  public changeLanguage(lang: string) {
    this.alertCtrl
      .create({
        header: this.t.instant('IDEA.LANGUAGE_PICKER.APP_WILL_RESTART'),
        buttons: [
          { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
          {
            text: this.t.instant('COMMON.CONFIRM'),
            // needed cause sometimes the language isn't update in the interface (random)
            handler: () => this.storage.set('language', lang).then(() => window.location.assign(''))
          }
        ]
      })
      .then(alert => alert.present());
  }
}
