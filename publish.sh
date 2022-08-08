#!/bin/bash

MODULES_DIR='./modules'
TYPE=$1

# set the script to exit in case of errors
set -o errexit

# check the version bump type
if [ "${TYPE}" != "major" ] && [ "${TYPE}" != "minor" ] && [ "${TYPE}" != "patch" ]
then
  echo "Version bump type: major|minor|patch"
  exit -1
fi

# lint the modules
for MODULE in ${MODULES_DIR}/*/;
do
  ng lint $(basename ${MODULE}) --fix
done

# build the modules (for production)
for MODULE in ${MODULES_DIR}/*/;
do
  ng build $(basename ${MODULE}) --configuration production
done

# bump the module's versions
for MODULE in ${MODULES_DIR}/*/;
do
  echo "Bumping to new ${TYPE} version $(basename ${MODULE})..."
  # source
  cd ${MODULE}
  npm version ${TYPE} --git-tag-version=false
  cd ../../
  # dist
  cd dist/$(basename ${MODULE})
  npm version ${TYPE} --git-tag-version=false
  cd ../../
done

# publish the new versions
for MODULE in ${MODULES_DIR}/*/;
do
  cd dist/$(basename ${MODULE})
  npm publish --access public
  cd ../../
done

# bump version of main package
npm version ${TYPE} --git-tag-version=false