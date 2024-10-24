import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IDEASelectModule, IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAAddressComponent } from './address.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectModule],
  declarations: [IDEAAddressComponent],
  exports: [IDEAAddressComponent]
})
export class IDEAAddressModule {}
