import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEADownloaderComponent } from './downloader.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule],
  declarations: [IDEADownloaderComponent],
  entryComponents: [IDEADownloaderComponent],
  exports: [IDEADownloaderComponent]
})
export class IDEADownloaderModule {}
