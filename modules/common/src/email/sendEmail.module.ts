import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEASendEmailComponent } from './sendEmail.component';
import { IDEASelectComponent } from '../select/select.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectComponent],
  declarations: [IDEASendEmailComponent],
  exports: [IDEASendEmailComponent]
})
export class IDEASendEmailModule {}
