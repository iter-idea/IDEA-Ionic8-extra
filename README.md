# IDEA Ionic extra

IDEA's extra components and services built on Ionic 5, and distributed with different NPM packages.

_The old version, compatible with Ionic 3, [is available here](https://github.com/uatisdeproblem/IDEA-Ionic3-extra)_.

## Modules

- [common](modules/common)
- [agenda](modules/agenda)
- [auth](modules/auth)
- [map](modules/map)
- [plans-subscription](modules/plans-subscription)
- [speechRecognition](modules/speech-recognition)
- [teams](modules/teams)

## Use

To use a module in a project, install it through NPM (together with its dependencies):

```
npm i --save @idea-ionic/<module>
```

Make sure to install also the translations (see below).

## Translations

Every component requires the `IDEATranslationsService` module and the `i18n` translations folder (with subfolders `idea` and `variables`) set up in the project, following IDEA's standard.

The **translations for the components are available (and should be kept updated) in the `i18n` folder** of this repository.

When changes are made, the entire translations files should be copied into the IDEA's projects.

## Development

When you need to develop changes or new components, you can create a symlink so that an IDEA's project [can temporarily point directly to this repository](https://medium.com/dailyjs/how-to-use-npm-link-7375b6219557), instead on the default _node_modules_ folder.

To do so, firstly run (root folder):

```
ng build --watch
```

Then, open the module in the dist folder (e.g `dist/common`) and init the link between the global node_module and the developed module:

```
cd dist/<module>
npn link
```

Now, in the IDEA's project that we are developing, establish the link created so that the current build of the node_module is used instead of the default one:

```
cd client
npm link @idea-ionic/<module>
```

Note: make sure that in the `angular.json` file of the project the following option is set:

```
"projects": {
    "app": {
      "architect": {
        "build": {
          "options": {
            // ...
            "preserveSymlinks": true
          }
        }
      }
    }
}
```

_Note: running `npm i` on a project's client deletes the link and replaces the module with NPM's latest version._

## Release

_**Note well: before to release, test everything and make a pull request with the changes to be approved.**_

To release a new version of a module, set the according version in the `package.json` file of the module (_not the file in the root directory!_) and then run

```
cd modules/<module>
npm i
cd ../../
ng build <module> --prod
cd dist/<module>
npm publish
```

Then, **commit the changes** (commit message: `vX.Y.Z`).
