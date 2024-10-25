import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { IonItem, IonLabel, IonIcon, IonSpinner } from '@ionic/angular/standalone';

import { IDEAOfflineDataService, CacheableResource } from './offlineData.service';

@Component({
  selector: 'idea-cacheable-resource',
  standalone: true,
  imports: [CommonModule, IonSpinner, IonIcon, IonLabel, IonItem],
  template: `
    <ion-item class="cacheableResourceItem">
      <ion-label>{{ resource.description }}</ion-label>
      @if (resource.error) {
        <ion-icon slot="end" name="alert-circle" color="danger" />
      }
      @if (!resource.error && _offline.synchronizing && resource.synchronizing) {
        <ion-spinner slot="end" name="dots" />
      }
      @if (!resource.error && !resource.synchronizing && !_offline.requiresManualConfirmation) {
        <ion-icon slot="end" name="checkmark" color="success" />
      }
      @if (!resource.error && !resource.synchronizing && _offline.requiresManualConfirmation) {
        <ion-icon slot="end" name="pause" color="dark" />
      }
    </ion-item>
  `
})
export class IDEACacheableResourceComponent {
  _offline = inject(IDEAOfflineDataService);

  /**
   * The resouece to manage.
   */
  @Input() resource: CacheableResource;
}
