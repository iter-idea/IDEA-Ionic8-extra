import { Component } from '@angular/core';

import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-mde-toolbar',
  templateUrl: 'mdeToolbar.component.html',
  styleUrls: ['mdeToolbar.component.scss']
})
export class IDEAMDEToolbarComponent {
  constructor(public t: IDEATranslationsService) {}
}
