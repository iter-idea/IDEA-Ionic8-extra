# IDEA Ionic extra

IDEA's extra components and services built on Ionic 5, and distributed with different NPM packages.

_The old version, compatible with Ionic 3, [is available here](https://github.com/uatisdeproblem/IDEA-Ionic3-extra)_.

## Modules

- [common](modules/common)
- [agenda](modules/agenda)
- [auth](modules/auth)
- [map](modules/map)
- [teams](modules/teams)

## Use

To use a module in a project, install it through NPM (together with its dependencies):

```
npm i --save @idea-ionic/<module>
```

Make sure to install to follow the instructions of each specific module.

## Development

When you need to develop changes or new components, you can create a symlink so that an IDEA's project [can temporarily point directly to this repository](https://medium.com/dailyjs/how-to-use-npm-link-7375b6219557), instead on the default _node_modules_ folder.

To do so, firstly run (root folder):

```
ng build <module> --watch
```

After, open the module in the dist folder (e.g `dist/common`) and init the link between the global node_module and the developed module:

```
cd dist/<module>
npm link
```

Now, in the IDEA's project that we are developing, make sure that in the `angular.json` file the following option is set:

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

Then, (in the project) establish the link created so that the current build of the node_module is used instead of the default one:

```
cd client
npm link @idea-ionic/<module>
```

In case the project's compiler starts looping, you may also need to **temporarily** turn Ivy off in the project's `tsconfig.json` file; **when you commit changes, Ivy must be active!!**

```
 "angularCompilerOptions": {
    //
    "enableIvy": false
  }
```

_Note: running `npm i` on a project's client deletes the link and replaces the module with NPM's latest version._

## Release

_**Note well: before to release, test everything and make a pull request with the changes to be approved.**_

Note: the versions of this lib's modules should advance together (Angular's standard); therefore, **all the modules (also unchanged ones) will publish a new version!**

To release a new version, make sure all the files are committed, then run (depending on the version type):

```
./publish.sh major|minor|patch
```

Then, **commit the changes** (commit message: `vX.Y.Z`).
