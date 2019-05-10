import { Component, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'idea-list',
  templateUrl: 'list.component.html',
  styleUrls: ['list.component.scss']
})
export class IDEAListComponent {
  @Input() protected list: Array<string | number>;
  @Input() protected title: string;

  constructor(
    protected modalCtrl: ModalController,
    protected alertCtrl: AlertController,
    protected t: TranslateService,
  ) {}
  protected ngOnInit() {
    // use a copy of the array, to confirm it only when saving
    this.list = Array.from(this.list || new Array<string>());
  }

  /**
   * Add a new element to the list.
   */
  protected addElement() {
    this.alertCtrl.create({
      header: this.t.instant('IDEA.LIST.NEW_ELEMENT'),
      inputs: [ { name: 'element', placeholder: this.t.instant('IDEA.LIST.ELEMENT') } ],
      buttons: [
        { text: this.t.instant('COMMON.CANCEL'), role: 'cancel' },
        { text: this.t.instant('COMMON.SAVE'),
          handler: data => {
            if (data.element && data.element.trim()) {
              this.list.push(data.element);
              this.list = this.list.sort();
            }
          }
        }
      ]
    })
    .then(alert => alert.present().then(() => {
      const firstInput: any = document.querySelector('ion-alert input');
      firstInput.focus();
      return;
    }));
  }
  /**
   * Remove the selected element from the list.
   */
  protected removeElement(element: any) {
    this.list.splice(this.list.indexOf(element), 1);
  }

  /**
   * Close and save or simply dismiss.
   */
  protected close(save?: boolean) {
    this.modalCtrl.dismiss(save ? this.list : null);
  }
}
