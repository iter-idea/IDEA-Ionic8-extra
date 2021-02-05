# IDEA Ionic extra ≫ Map

Map powered by Google Maps.

[Package on NPM](https://www.npmjs.com/package/@idea-ionic/map).

## To install

```
npm i --save @idea-ionic/map
```

_Be sure to install all the requested peer dependencies._

Then, add this imports into the `global.scss` file, after the import on the top of the page:

```
@import '../node_modules/@idea-ionic/map/css/global.scss';
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
