import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEASendEmailComponent } from './sendEmail.component';
import { IDEAMDEModule } from '../mde/mde.module';
import { IDEASelectModule } from '../select/select.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEAMDEModule, IDEASelectModule],
  declarations: [IDEASendEmailComponent],
  entryComponents: [IDEASendEmailComponent],
  exports: [IDEASendEmailComponent]
})
export class IDEASendEmailModule {}
