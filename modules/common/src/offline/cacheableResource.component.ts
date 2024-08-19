import { Component, Input, inject } from '@angular/core';

import { IDEAOfflineDataService, CacheableResource } from './offlineData.service';

@Component({
  selector: 'idea-cacheable-resource',
  templateUrl: 'cacheableResource.component.html',
  styleUrls: ['cacheableResource.component.scss']
})
export class IDEACacheableResourceComponent {
  _offline = inject(IDEAOfflineDataService);

  /**
   * The resouece to manage.
   */
  @Input() resource: CacheableResource;
}
