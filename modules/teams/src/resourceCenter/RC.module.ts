import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEASelectModule, IDEATranslationsModule } from '@idea-ionic/common';

import { IDEARCPickerComponent } from './RCPicker.component';
import { IDEARCConfiguratorComponent } from './RCConfigurator.component';
import { IDEARCFoldersComponent } from './RCFolders.component';
import { IDEARCResourcesComponent } from './RCResources.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEASelectModule],
  declarations: [IDEARCPickerComponent, IDEARCConfiguratorComponent, IDEARCFoldersComponent, IDEARCResourcesComponent],
  exports: [IDEARCPickerComponent, IDEARCConfiguratorComponent, IDEARCFoldersComponent, IDEARCResourcesComponent]
})
export class IDEARCModule {}
