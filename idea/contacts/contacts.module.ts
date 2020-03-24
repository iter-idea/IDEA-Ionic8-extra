import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEAContactsComponent } from './contacts.component';
import { IDEADownloaderModule } from '../downloader/downloader.module';
import { IDEASelectModule } from '../select/select.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEADownloaderModule, IDEASelectModule],
  declarations: [IDEAContactsComponent],
  entryComponents: [IDEAContactsComponent],
  exports: [IDEAContactsComponent]
})
export class IDEAContactsModule {}
