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
```

Add the following attribute to the `tsconfig.json` file:

```
{
  // ...
  "compilerOptions": {
    // ...
    "types": ["googlemaps"]
  }
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
