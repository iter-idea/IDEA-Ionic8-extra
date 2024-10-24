import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ColorsPaletteComponent, IDEAColorPickerComponent } from './colorPicker.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [IDEAColorPickerComponent, ColorsPaletteComponent],
  exports: [IDEAColorPickerComponent, ColorsPaletteComponent]
})
export class IDEAColorPickerModule {}
