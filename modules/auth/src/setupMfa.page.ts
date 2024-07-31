import { Component, inject } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'idea-mfa-setup',
  templateUrl: 'setupMFA.page.html',
  styleUrls: ['auth.scss']
})
export class IDEASetupMFAPage {
  private _nav = inject(NavController);

  reloadApp(): void {
    window.location.assign('');
  }
  goToAuth(): void {
    this._nav.navigateBack(['auth']);
  }
}
