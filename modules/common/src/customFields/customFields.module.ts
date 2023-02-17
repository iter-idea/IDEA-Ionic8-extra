import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEALabelerModule } from '../labeler/labeler.module';
import { IDEAIconsModule } from '../icons/icons.module';
import { IDEASelectModule } from '../select/select.module';

import { IDEACustomBlockMetaComponent } from './customBlockMeta.component';
import { IDEACustomSectionMetaComponent } from './customSectionMeta.component';
import { IDEACustomFieldMetaComponent } from './customFieldMeta.component';
import { IDEACustomBlockComponent } from './customBlock.component';
import { IDEACustomSectionComponent } from './customSection.component';

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
  exports: [
    IDEACustomBlockMetaComponent,
    IDEACustomSectionMetaComponent,
    IDEACustomFieldMetaComponent,
    IDEACustomBlockComponent,
    IDEACustomSectionComponent
  ],
  declarations: [
    IDEACustomBlockMetaComponent,
    IDEACustomSectionMetaComponent,
    IDEACustomFieldMetaComponent,
    IDEACustomBlockComponent,
    IDEACustomSectionComponent
  ]
})
export class IDEACustomFieldsModule {}
