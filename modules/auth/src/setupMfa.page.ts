import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'idea-mfa-setup',
  templateUrl: 'setupMFA.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASetupMFAPage {
  constructor(private navCtrl: NavController) {}

  reloadApp(): void {
    window.location.assign('');
  }
  goToAuth(): void {
    this.navCtrl.navigateBack(['auth']);
  }
}
