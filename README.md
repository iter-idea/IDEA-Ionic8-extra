### ⚠️⚠️⚠️ This branch is not maintained anymore; we suggest switching to standalone components (from modules) and using the main branch

# IDEA Ionic extra

IDEA's extra components and services built on **Ionic 8**, and distributed with different NPM packages.

_The last version fully compatible with **Ionic 7** is [v7.3.0](https://github.com/iter-idea/IDEA-Ionic8-extra/releases/tag/v7.3.0)._
_The last version fully compatible with **Ionic 6** is [v6.13.0](https://github.com/iter-idea/IDEA-Ionic8-extra/releases/tag/v6.13.0)._
_The last version fully compatible with **Ionic 5** is [v5.29.4](https://github.com/iter-idea/IDEA-Ionic8-extra/releases/tag/v5.29.4)._

## Packages

**[Documentation](modules.md)**.

- [common](modules/common)
- [agenda](modules/agenda)
- [auth](modules/auth)
- [auth0](modules/auth0)
- [barcode](modules/barcode)
- [map](modules/map)
- [teams](modules/teams)
- [uncommon](modules/uncommon)

## Use

To use a module in a project, install it through NPM (together with its dependencies):

```
npm i --save @idea-ionic/<module>
```

Make sure to install to follow the instructions of each specific module.

## Release

_**Note well: before to release, test everything and make a pull request with the changes to be approved.**_

Note: the versions of this lib's modules should advance together (Angular's standard); therefore, **all the modules (also unchanged ones) will publish a new version!**

To release a new version, make sure all the files are committed, then run (depending on the version type):

```
./publish.sh major|minor|patch
```

Then, **commit the changes** (commit message: `vX.Y.Z`).
