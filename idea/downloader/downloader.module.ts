import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEADownloaderComponent } from './downloader.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild()],
  declarations: [IDEADownloaderComponent],
  entryComponents: [IDEADownloaderComponent],
  exports: [IDEADownloaderComponent]
})
export class IDEADownloaderModule {}
