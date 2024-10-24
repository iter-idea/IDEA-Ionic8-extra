import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IDEASelectComponent, IDEATranslationsModule } from '@idea-ionic/common';

import { IDEAAddressComponent } from './address.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectComponent],
  declarations: [IDEAAddressComponent],
  exports: [IDEAAddressComponent]
})
export class IDEAAddressModule {}
