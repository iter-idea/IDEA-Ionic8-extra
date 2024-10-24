import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEALabelerComponent } from '../labeler/labeler.component';
import { IDEAIconsModule } from '../icons/icons.module';
import { IDEASelectComponent } from '../select/select.component';

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
    IDEALabelerComponent,
    IDEAIconsModule,
    IDEASelectComponent
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
