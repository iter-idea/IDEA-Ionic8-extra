#!/bin/bash

MODULES_DIR='./modules'

for MODULE in ${MODULES_DIR}/*/;
do
  echo "Installing npm modules of $(basename ${MODULE})..."
  cd ${MODULE}
  npm i
  cd ../../
done