import { Component } from '@angular/core';
import { AlertController, IonFab } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';

// requires two assets folders:
//   1. flags, containing the pngs of each country's flags
//   2. i18n, containing the json of each country's translation

@Component({
  selector: 'idea-language-picker',
  templateUrl: 'languagePicker.component.html',
  styleUrls: ['languagePicker.component.scss']
})
export class IDEALanguagePickerComponent {
  protected languages: Array<string>;

  constructor(
    protected t: TranslateService,
    protected storage: Storage,
    protected alertCtrl: AlertController
  ) {}
  protected ngOnInit() {
    this.languages = this.t.getLangs();
  }

  public changeLanguage(lang: string, fab: IonFab) {
    this.alertCtrl.create({
      header: this.t.instant('IDEA.LANGUAGE_PICKER.APP_WILL_RESTART'),
      buttons: [
        { text: this.t.instant('COMMON.CANCEL'), role: 'cancel', handler: () => fab.close() },
        { text: this.t.instant('COMMON.CONFIRM'),
          // needed cause sometimes the language isn't update in the interface (random)
          handler: () => this.storage.set('language', lang).then(() => window.location.assign(''))
        }
      ]
    })
    .then(alert => alert.present());
  }
}
