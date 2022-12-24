import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IDEALabelerComponent } from './labeler.component';
import { IDEAMDEModule } from '../mde/mde.module';
import { IDEATranslationsModule } from '../translations/translations.module';
import { IDEALabelComponent } from './label.component';
import { IDEAVariablesModule } from '../variables/variables.module';

@NgModule({
    imports: [IonicModule, CommonModule, FormsModule, IDEATranslationsModule, IDEAMDEModule, IDEAVariablesModule],
    declarations: [IDEALabelerComponent, IDEALabelComponent],
    exports: [IDEALabelerComponent, IDEALabelComponent]
})
export class IDEALabelerModule {}
