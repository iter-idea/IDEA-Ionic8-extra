import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IDEARCPickerComponent } from './RCPicker.component';
import { IDEARCConfiguratorComponent } from './RCConfigurator.component';
import { IDEASelectModule } from '../select/select.module';
import { IDEADownloaderModule } from '../downloader/downloader.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule.forChild(), IDEASelectModule, IDEADownloaderModule],
  declarations: [IDEARCPickerComponent, IDEARCConfiguratorComponent],
  entryComponents: [IDEARCPickerComponent, IDEARCConfiguratorComponent],
  exports: [IDEARCPickerComponent, IDEARCConfiguratorComponent]
})
export class IDEARCModule {}
