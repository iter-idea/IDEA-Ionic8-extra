import { Component, Input } from '@angular/core';

import { IDEAOfflineDataService, CacheableResource } from './offlineData.service';
import { IDEATranslationsService } from '../translations/translations.service';

@Component({
  selector: 'idea-cacheable-resource',
  templateUrl: 'cacheableResource.component.html',
  styleUrls: ['cacheableResource.component.scss']
})
export class IDEACacheableResourceComponent {
  /**
   * The resouece to manage.
   */
  @Input() public resource: CacheableResource;

  constructor(public offline: IDEAOfflineDataService, public t: IDEATranslationsService) {}
}
