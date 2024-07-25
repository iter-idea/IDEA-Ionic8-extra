import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEASignatureComponent } from './signature.component';
import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEASelectModule } from '../select/select.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectModule],
  declarations: [IDEASignatureComponent],
  exports: [IDEASignatureComponent]
})
export class IDEASignatureModule {}
