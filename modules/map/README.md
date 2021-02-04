# IDEA Ionic extra ≫ Map

Map powered by Google Maps.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/map).

## To install

```
npm i --save @idea-ionic/map
```

_Be sure to install all the requested peer dependencies._

Then, add the following css to the `global.scss` file:

```
idea-map {
  display: none;
  width: 100%;
  height: 100%;
}
idea-map.mapReady {
  display: block;
}
.idea-map-clustericon {
   background: var(--cluster-color);
   color: #fff;
   border-radius: 100%;
   font-weight: bold;
   font-size: 15px;
   display: flex;
   align-items: center;
 }
 .idea-map-clustericon::before,
 .idea-map-clustericon::after {
   content: '';
   display: block;
   position: absolute;
   width: 100%;
   height: 100%;
   transform: translate(-50%, -50%);
   top: 50%;
   left: 50%;
   background: var(--cluster-color);
   opacity: 0.2;
   border-radius: 100%;
 }
 .idea-map-clustericon::before {
   padding: 7px;
 }
 .idea-map-clustericon::after {
   padding: 14px;
 }
 .idea-map-clustericon-1 {
   --cluster-color: #00a2d3;
 }
 .idea-map-clustericon-2 {
   --cluster-color: #ff9b00;
 }
 .idea-map-clustericon-3 {
   --cluster-color: #ff6969;
 }
```

Finally, add the according configuration in the `assets/configs/idea-config.js`:

```
declare const IDEA_API_VERSION: string;
declare const IDEA_GOOGLE_MAPS_API_KEY_PROD: string;
declare const IDEA_GOOGLE_MAPS_API_KEY_DEV: string;
```

## Components

- Map (Google Maps)

## Services

-
