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
import { IDEACustomBlockComponent } from './customBlock.component';
import { IDEASelectModule } from '../select/select.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IDEATranslationsModule,
    IDEALabelerModule,
    IDEAIconsModule,
    IDEASelectModule
  ],
  entryComponents: [
    IDEACustomBlockMetaComponent,
    IDEACustomSectionMetaComponent,
    IDEACustomFieldMetaComponent,
    IDEACustomBlockComponent
  ],
  exports: [
    IDEACustomBlockMetaComponent,
    IDEACustomSectionMetaComponent,
    IDEACustomFieldMetaComponent,
    IDEACustomBlockComponent
  ],
  declarations: [
    IDEACustomBlockMetaComponent,
    IDEACustomSectionMetaComponent,
    IDEACustomFieldMetaComponent,
    IDEACustomBlockComponent
  ]
})
export class IDEACustomFieldsModule {}
