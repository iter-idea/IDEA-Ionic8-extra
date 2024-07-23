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
@import '@idea-ionic/map/css/global.scss';
```

Make sure that there is a path (tsconfig file) pointing to `@env` which contains the environment files (Angular standard).
Finally, add in the environments desired the variables you find in the `environment.ts` file of this module.
