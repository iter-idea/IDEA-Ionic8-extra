import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IDEATranslationsModule } from '@idea-ionic/common';

import { IDEASetupMFAModalComponent } from './setupMFAModal.component';
import { IDEASetupMFAButtonComponent } from './setupMFAButton.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEASetupMFAModalComponent, IDEASetupMFAButtonComponent],
  exports: [IDEASetupMFAModalComponent, IDEASetupMFAButtonComponent]
})
export class IDEASetupMFAModule {}
