import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAAddressComponent } from './address.component';
import { IDEADownloaderModule } from '../downloader/downloader.module';
import { IDEASelectModule } from '../select/select.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEADownloaderModule, IDEASelectModule],
  declarations: [IDEAAddressComponent],
  entryComponents: [IDEAAddressComponent],
  exports: [IDEAAddressComponent]
})
export class IDEAAddressModule {}
