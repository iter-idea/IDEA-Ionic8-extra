import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEACustomBlockMetaComponent } from './customBlockMeta.component';
import { IDEACustomSectionMetaComponent } from './customSectionMeta.component';
import { IDEACustomFieldMetaComponent } from './customFieldMeta.component';
import { IDEALabelerModule } from '../labeler/labeler.module';
import { IDEAIconsModule } from '../icons/icons.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IDEATranslationsModule, IDEALabelerModule, IDEAIconsModule],
  entryComponents: [IDEACustomBlockMetaComponent, IDEACustomSectionMetaComponent, IDEACustomFieldMetaComponent],
  exports: [IDEACustomBlockMetaComponent, IDEACustomSectionMetaComponent, IDEACustomFieldMetaComponent],
  declarations: [IDEACustomBlockMetaComponent, IDEACustomSectionMetaComponent, IDEACustomFieldMetaComponent]
})
export class IDEACustomFieldsModule {}
