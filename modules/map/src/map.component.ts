import { Component, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Loader } from '@googlemaps/js-api-loader';
import MarkerClusterer from '@googlemaps/markerclustererplus';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { IDEATinCanService } from '@idea-ionic/common';

import { MAP_DARK_MODE_STYLE } from './darkMode.style';

import { environment as env } from '@env';

/**
 * Default geolocation: ITER IDEA's office.
 */
const DEFAULT_POSITION = {
  lat: 44.709551,
  long: 10.6483528
};

/**
 * The style for markers, defined in `global.scss`.
 */
const MARKERS_STYLES = [
  { width: 30, height: 30, className: 'idea-map-clustericon-1' },
  { width: 40, height: 40, className: 'idea-map-clustericon-2' },
  { width: 50, height: 50, className: 'idea-map-clustericon-3' }
];

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
export class IDEAMapComponent implements OnInit {
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
  private networkHandler: any;
  /**
   * The markers set on the map.
   */
  private markers: google.maps.Marker[];
  /**
   * The marker cluster.
   */
  private markerCluster: MarkerClusterer;
  /**
   * The info window to show when a marker is clicked (default behaviour if markerClickFn isn't set).
   */
  private infoWindow: google.maps.InfoWindow;

  /**
   * Whether to disable the default UI.
   */
  @Input() public disableDefaultUI: boolean;
  /**
   * Whether to center the location based on the current position.
   */
  @Input() public centerOnCurrentPosition: boolean;
  /**
   * If set, when a marker is clicked, trigger this function instead of showing the default infoWindow.
   */
  @Input() public markerClickFn: (event: any, marker: google.maps.Marker) => void;

  darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

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
        const mapOptions: any = { zoom: DEFAULT_ZOOM };
        if (this.disableDefaultUI) mapOptions.disableDefaultUI = true;
        else mapOptions.fullscreenControl = false;
        // if we successfully acquired the position, set it as the map's center; otherwise, set the default position
        if (location) mapOptions.center = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
        else mapOptions.center = new google.maps.LatLng(DEFAULT_POSITION.lat, DEFAULT_POSITION.long);
        // optionally set the dark mode
        if (this.darkMode) mapOptions.styles = MAP_DARK_MODE_STYLE;
        // initialize the map
        this.map = new google.maps.Map(this.element.nativeElement, mapOptions);
        // initialise the markers list and the cluster
        this.markers = new Array<google.maps.Marker>();
        this.markerCluster = new MarkerClusterer(this.map, this.markers, {
          styles: MARKERS_STYLES,
          // the class should be defined in `global.scss`
          clusterClass: 'idea-map-clustericon'
        });
        // initialise the info window (popup) to open when a marker is clicked (default behaviour)
        this.infoWindow = new google.maps.InfoWindow();
        // mark the component as ready
        this.renderer.addClass(this.element.nativeElement, 'mapReady');
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
    // load the library using the correct API key and set the service as "ready" when the loading ends
    new Loader({ apiKey: env.google.mapsApiKey }).load().then(() => {
      this.tc.set('ideaMapLibsLoaded', true);
      resolve();
    });
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
  public addMarker(lat: number, lng: number, options: { title?: string; attributes?: any; animate?: boolean }) {
    // create the marker, that will be added to the map later on
    const marker = new google.maps.Marker({ position: new google.maps.LatLng(lat, lng) });
    // set the title if required
    if (options.title) marker.setTitle(options.title);
    // set additional attributes to the marker, if required
    if (options.attributes)
      for (const prop in options.attributes) if (options.attributes[prop]) marker.set(prop, options.attributes[prop]);
    // animate the marker on insertion, if required
    if (options.animate) marker.setAnimation(google.maps.Animation.DROP);
    // add the click handler to the marker (default or custom function)
    if (options.title || this.markerClickFn)
      google.maps.event.addListener(marker, 'click', (event: any) =>
        this.markerClickFn ? this.markerClickFn(event, marker) : this.defaultMarkerClickFn(event, marker)
      );
    // add the marker to the list
    this.markers.push(marker);
  }
  /**
   * The defailt click handler function for the marker: display a popup with containing the title.
   */
  private defaultMarkerClickFn(e: any, marker: google.maps.Marker) {
    e.cancelBubble = true;
    e.returnValue = false;
    if (e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    // open the popup to display the title
    const content = `<p style="color: black">${marker.getTitle()}</p>`;
    this.openInfoWindow(content, marker.getPosition());
  }

  /**
   * Open a popup in the map, to display some HTML content.
   */
  public openInfoWindow(htmlContent: string, position?: google.maps.LatLng) {
    this.infoWindow.setContent(htmlContent);
    if (position) this.infoWindow.setPosition(position);
    this.infoWindow.open(this.map);
  }

  /**
   * Clear the current markers on the map.
   */
  public clearMarkers() {
    this.markers = this.markers.slice(0, 0);
    this.markerCluster.clearMarkers();
  }
  /**
   * Create/update the markers cluster based on the defined markers.
   */
  public setMarkersClusters(fitToMarkersBounds = false) {
    this.markerCluster.addMarkers(this.markers);
    if (fitToMarkersBounds) this.fitMarkersBounds();
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
