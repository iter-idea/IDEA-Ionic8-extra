# IDEA Ionic extra

IDEA's extra components and services built on **Ionic 8**, and distributed with different NPM packages.

_The last version fully compatible with **Ionic 7** is [v7.3.0](https://github.com/iter-idea/IDEA-Ionic8-extra/releases/tag/v7.3.0)._
_The last version fully compatible with **Ionic 6** is [v6.13.0](https://github.com/iter-idea/IDEA-Ionic8-extra/releases/tag/v6.13.0)._
_The last version fully compatible with **Ionic 5** is [v5.29.4](https://github.com/iter-idea/IDEA-Ionic8-extra/releases/tag/v5.29.4)._

## Standalone components vs modules

In preparation for Angular 19, we separated the repository into two branches.

1. The `main` one (rif. `v8.2.x` — in the future `v9.x.x`) mainly works with **standalone components** and the new Angular compiler; for this reason, when updating, **most of the imports will change from modules to components**; `Agenda` and `Auth0` are the only packages that will continue working with modules. This newer version is faster, lighter and follows the latest Angular standards. You can use this version also in applications organized in modules, but we suggest refactoring to use standalone components to get the most out of it in terms of performance.
2. The `modules` branch (rif. `v8.1.x`) will continue working with modules; today, there are no differences in features compared with the `main` branch.

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
