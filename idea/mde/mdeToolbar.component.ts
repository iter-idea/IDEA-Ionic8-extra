import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'idea-mde-toolbar',
  templateUrl: 'mdeToolbar.component.html',
  styleUrls: ['mdeToolbar.component.scss']
})
export class IDEAMDEToolbarComponent {
  constructor(public t: TranslateService) {}
}
