import { NgModule } from '@angular/core';

import { IDEAHiglightedVariables } from './highlightedVariables.pipe';

@NgModule({
  declarations: [IDEAHiglightedVariables],
  exports: [IDEAHiglightedVariables]
})
export class IDEAVariablesModule {}
