import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEASendEmailComponent } from './sendEmail.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEASendEmailComponent],
  entryComponents: [IDEASendEmailComponent],
  exports: [IDEASendEmailComponent]
})
export class IDEASendEmailModule {}
