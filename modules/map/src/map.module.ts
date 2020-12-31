import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEAMapComponent } from './map.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [IDEAMapComponent],
  entryComponents: [IDEAMapComponent],
  exports: [IDEAMapComponent]
})
export class IDEAMapModule {}
