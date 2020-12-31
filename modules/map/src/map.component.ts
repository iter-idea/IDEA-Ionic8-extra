import { Component, ElementRef, Input, Renderer2 } from '@angular/core';
import { Platform } from '@ionic/angular';
import { get } from 'scriptjs';
import { Plugins, PluginListenerHandle, GeolocationPosition } from '@capacitor/core';
const { Geolocation, Network } = Plugins;
import { google } from '@google/maps';
import { IDEATinCanService } from '@idea-ionic/common';

import { MAP_DARK_MODE_STYLE } from './darkMode.style';

// class loaded together with the SDK
declare const MarkerClusterer: any;

// from idea-config.js
declare const IDEA_API_VERSION: string;
declare const IDEA_GOOGLE_MAPS_API_KEY_PROD: string;
declare const IDEA_GOOGLE_MAPS_API_KEY_DEV: string;

/**
 * Default geolocation: ITER IDEA's office.
 */
const DEFAULT_POSITION = {
  lat: 44.709551,
  long: 10.6483528
};

/**
 * The default zoom level for the map.
 *   - 1: World
 *   - 5: Landmass/continent
 *   - 10: City
 *   - 15: Streets
 *   - 20: Buildings
 */
const DEFAULT_ZOOM = 8;

@Component({
  selector: 'idea-map',
  template: ''
})
export class IDEAMapComponent {
  /**
   * The Google Maps' map object.
   */
  private map: google.maps.Map;
  /**
   * Whether the service is ready (the SDK is fully loaded).
   */
  private isReady: boolean;
  /**
   * If set, handles the changes in the network connection.
   */
  private networkHandler: PluginListenerHandle;
  /**
   * The markers set on the map.
   */
  private markers: Array<google.maps.Marker>;
  /**
   * The marker cluster.
   * Ref: https://developers.google.com/maps/documentation/javascript/marker-clustering.
   */
  private markerCluster: any;

  /**
   * Whether to disable the default UI.
   */
  @Input() public disableDefaultUI: boolean;
  /**
   * Whether to center the location based on the current position.
   */
  @Input() public centerOnCurrentPosition: boolean;

  ///
  /// Initialization.
  ///

  constructor(
    private platform: Platform,
    private element: ElementRef,
    private renderer: Renderer2,
    private tc: IDEATinCanService
  ) {}
  public ngOnInit() {
    // wait for the SDK to be available
    this.init().then(() => {
      // if needed, acquire the current geolocation position; note: it won't work on localhost (resolves `null`)
      this.getLocationSafely().then(location => {
        // initialize the map's options
        const mapOptions: google.maps.MapOptions = { zoom: DEFAULT_ZOOM };
        if (this.disableDefaultUI) mapOptions.disableDefaultUI = true;
        else mapOptions.fullscreenControl = false;
        // if we successfully acquired the position, set it as the map's center; otherwise, set the default position
        if (location) mapOptions.center = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
        else mapOptions.center = new google.maps.LatLng(DEFAULT_POSITION.lat, DEFAULT_POSITION.long);
        // optionally set the dark mode
        if (this.tc.get('darkMode')) mapOptions.styles = MAP_DARK_MODE_STYLE;
        // initialize the map
        this.map = new google.maps.Map(this.element.nativeElement, mapOptions);
        this.renderer.addClass(this.element.nativeElement, 'mapReady');
        // set the helpers
        this.markers = new Array<google.maps.Marker>();
        // the component is ready
        this.isReady = true;
      });
    });
  }

  /**
   * Initialize the component by loading the SDK.
   */
  private init(): Promise<void> {
    return new Promise(resolve => {
      this.platform.ready().then(() => {
        // if the SKD is ready, skip the import
        if (this.isReady) resolve();
        // otherwise, try to load it; in case we are offline, delegates to a network-status-changes handler
        else this.loadSKD(resolve);
      });
    });
  }
  /**
   * Load the SDK and resolve the chosen promise when it's fully loaded.
   */
  private loadSKD(resolve: any) {
    // check whether we are online (and so we can download the SDK)
    Network.getStatus().then(status => {
      // if we have connection, inject the script and load the SDK
      if (status.connected) this.injectSDK(resolve);
      // if we aren't online, set a listener (if it's not set already) for when the network status changes
      else if (this.networkHandler === null)
        this.networkHandler = Network.addListener('networkStatusChange', s => {
          // when the network status changes, if we are connected, we load the SDK
          if (s.connected) {
            // the handler isn't needed anymore
            this.networkHandler.remove();
            // run the method again: this time we will have connection and so the SDK loading will succeed
            this.loadSKD(resolve);
          }
        });
    });
  }
  /**
   * Inject the SDK scripts, using the right API key, based on the current configuration.
   * Resolve the chosen promise when the SDK is fully loaded.
   */
  private injectSDK(resolve: any) {
    if (this.tc.get('ideaMapLibsLoaded')) return resolve();
    // use the correct API key, based on the current configuration
    let key: string;
    if (IDEA_API_VERSION === 'dev') key = IDEA_GOOGLE_MAPS_API_KEY_DEV;
    else key = IDEA_GOOGLE_MAPS_API_KEY_PROD;
    // load the library using the correct API key and set the service as "ready" when the loading ends
    get('https://maps.googleapis.com/maps/api/js?key='.concat(key), () =>
      // load the markers cluster library
      get('https://unpkg.com/@google/markerclustererplus@4.0.1/dist/markerclustererplus.min.js', () => {
        this.tc.set('ideaMapLibsLoaded', true);
        resolve();
      })
    );
  }

  /**
   * Get a gegolocation position; if it fails (e.g. permissions are missing), resolve null, rather than throwing errors.
   */
  private getLocationSafely(highAccuracy?: boolean): Promise<GeolocationPosition> {
    return new Promise(resolve => {
      if (!this.centerOnCurrentPosition) return resolve(null);
      Geolocation.getCurrentPosition({ enableHighAccuracy: highAccuracy })
        .then(position => resolve(position))
        .catch(() => resolve(null));
    });
  }

  /**
   * Resolves when the component is ready.
   */
  public ready(): Promise<void> {
    return new Promise(resolve => this.readyHelper(resolve));
  }
  /**
   * Retry checking whether the component is ready until it is.
   */
  private readyHelper(resolve: any) {
    if (this.isReady) resolve();
    else setTimeout(() => this.readyHelper(resolve), 1000);
  }

  ///
  /// Operating on the map.
  ///

  /**
   * Return the geolocation of the current center of the map.
   */
  public getCenter(): google.maps.LatLng {
    return this.map.getCenter();
  }
  /**
   * Set the map's center in a geolocation position.
   */
  public setCenter(lat: number, lng: number, zoom?: number) {
    this.map.setCenter(new google.maps.LatLng(lat, lng));
    if (zoom) this.map.setZoom(zoom);
  }
  /**
   * Set the map's center to the current position.
   */
  public setCenterToCurrentLocation(highAccuracy?: boolean): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition({ enableHighAccuracy: highAccuracy })
        .then(location => {
          this.setCenter(location.coords.latitude, location.coords.longitude);
          // zoom to show the center
          this.map.setZoom(15);
          resolve(location);
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Add a marker to the map, by latitude and longitude and build its info window.
   */
  public addMarker(lat: number, lng: number, title?: string, animate?: boolean) {
    // create the marker
    const marker = new google.maps.Marker({
      map: this.map,
      animation: animate ? google.maps.Animation.DROP : undefined,
      position: new google.maps.LatLng(lat, lng),
      title
    });
    // prepare a window to show for when the marker is clicked
    const infoWindow = new google.maps.InfoWindow({ content: `<p style="color: black">${title}</p>` });
    marker.addListener('click', () => infoWindow.open(this.map, marker));
    // add the marker to the list
    this.markers.push(marker);
  }
  /**
   * Clear the current markers on the map.
   */
  public clearMarkers() {
    this.markers = this.markers.slice(0, 0);
    // in case the marker cluster is set, clear it as well
    if (this.markerCluster) this.markerCluster.clearMarkers();
  }
  /**
   * Create/update the markers cluster based on the defined markers.
   */
  public setMarkersClusters() {
    if (this.markerCluster) this.markerCluster.addMarkers(this.markers);
    else
      this.markerCluster = new MarkerClusterer(this.map, this.markers, {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
      });
  }

  /**
   * Zoom and center to fit all the current markers.
   */
  public fitMarkersBounds() {
    if (!this.markers.length) return;
    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach(m => bounds.extend(m.getPosition()));
    this.map.fitBounds(bounds);
  }
}
