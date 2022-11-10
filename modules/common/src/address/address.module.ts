import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEASelectModule } from '../select/select.module';

import { IDEAAddressComponent } from './address.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectModule],
  declarations: [IDEAAddressComponent],
  exports: [IDEAAddressComponent]
})
export class IDEAAddressModule {}
