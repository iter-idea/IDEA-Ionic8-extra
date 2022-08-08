import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEABarcodeCameraReaderComponent } from './cameraReader.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule],
  declarations: [IDEABarcodeCameraReaderComponent],
  exports: [IDEABarcodeCameraReaderComponent]
})
export class IDEABarcodeCameraReaderModule {}
