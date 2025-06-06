#!/bin/sh
set -e

fxautoconfig_dir=$BUILD_DIR/fx-autoconfig

cd $BUILD_DIR
/usr/bin/git clone https://github.com/MrOtherGuy/fx-autoconfig.git # trust me i tried to make it downlaod into fxautoconfig_dir, but it complains about the dir not existing when it very much does, so who cares.

if [ ! -d "${fxautoconfig_dir}" ]; then # sanity check git clone worked
  echo "directory (${fxautoconfig_dir}) does not exist!!"
  exit 1
fi

if [ ! -d "${INSTALL_DIR}/bin" ]; then # sanity check librewolf-d.sh worked
  echo "directory (${INSTALL_DIR}/bin) does not exist!!"
  exit 1
fi

/bin/cp -r $fxautoconfig_dir/program/* $INSTALL_DIR/bin/ #copy loading script

/bin/mkdir -p $INSTALL_DIR/profile/chrome # make sure dir exists

/bin/cp -r $fxautoconfig_dir/profile/chrome/* $INSTALL_DIR/profile/chrome/ # copy profile config files

exit 0