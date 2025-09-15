#!/bin/sh

## fail codes
FAIL_DOWNLAOD=3
FAIL_MOVING=2


## crackle tool
${ROOT}/crackle/crackle update
${ROOT}/crackle/crackle click maliit-inputcontext-gtk3


## export
export ARCH=${ARCH_TRIPLET%%-*}


# logging
LOG_FILE=${BUILD_DIR}`/bin/date +"%Y-%m-%d_%H-%M-%S"`_build.log
echo "--->logging at " + `/bin/date +"%Y-%m-%d_%H-%M-%S"` >> $LOG_FILE


## file managment
echo "--->managing files" >> $LOG_FILE
/bin/cp $ROOT/* $BUILD_DIR 2>/dev/null >> $LOG_FILE

/bin/cp $ROOT/assets/uwolf-logo.png $BUILD_DIR 2>/dev/null >> $LOG_FILE # copy uwolf logo into click package

/bin/sed -i "s/@CLICK_ARCH@/${ARCH_TRIPLET}/" ${BUILD_DIR}/librewolf.sh >> $LOG_FILE # change arch for launch script

/bin/cp -rn $BUILD_DIR/usr/lib/* $INSTALL_DIR/lib 2>/dev/null >> $LOG_FILE # copy maliit libs to install dir

/bin/chmod -R +x $INSTALL_DIR/lib/$ARCH_TRIPLET/* # make sure there is no permission problem for libs
/bin/chmod -R +x $INSTALL_DIR/lib/* 

/bin/mkdir -p ${CLICK_LD_LIBRARY_PATH}/gtk-3.0/3.0.0/immodules/ >> $LOG_FILE # make sure it exists before running
/bin/cp $ROOT/scripts/immodules.cache ${CLICK_LD_LIBRARY_PATH}/gtk-3.0/3.0.0/immodules/immodules.cache >> $LOG_FILE # copy gtk cache

/bin/sed -i "s/@CLICK_ARCH@/${ARCH_TRIPLET}/" ${CLICK_LD_LIBRARY_PATH}/gtk-3.0/3.0.0/immodules/immodules.cache >> $LOG_FILE # change arch for maliit in gtk cache

/bin/cp $BUILD_DIR/* $INSTALL_DIR 2>/dev/null >> $LOG_FILE # copying leftovers

/bin/mkdir -p ${INSTALL_DIR}/bin/browser/defaults/preferences/ >> $LOG_FILE # directory for syspref.js


## scripts
echo "--->copying scripts" >> $LOG_FILE
/bin/cp -r ${ROOT}/scripts $BUILD_DIR

if [ ! -d "$BUILD_DIR/scripts" ]; then # sanity check cp worked
  echo "directory ($BUILD_DIR/script) does not exist!, failed to copy build scripts" >> $LOG_FILE
  exit 1
fi

# librewolf binariy downloader
echo "--->running librewolf download script" >> $LOG_FILE
if ! $BUILD_DIR/scripts/librewolf-d.sh >> $LOG_FILE; then # move app files to build
  echo "Error: librewolf download script failed with exit code $?" >> $LOG_FILE
  exit $FAIL_DOWNLAOD
else
  echo "Successfully downloaded librewolf binaries!" >> $LOG_FILE
fi

# make sure there is no permission problem for librewolf
/bin/chmod -R +x $INSTALL_DIR/bin/* 

# fx-autoconfig script downloader
echo "--->running fx-autoconfig download script" >> $LOG_FILE
if ! $BUILD_DIR/scripts/fx-autoconfig-d.sh >> $LOG_FILE; then # move app files to build
  echo "Error: fx-autoconfig download script failed with exit code $?" >> $LOG_FILE
  exit $FAIL_DOWNLAOD
else
  echo "Successfully downloaded fx-autoconfig scripts!" >> $LOG_FILE
fi


## browser settings
echo "---> copying browser settings" >> $LOG_FILE
/bin/cp ${ROOT}/settings/syspref.js ${INSTALL_DIR}/bin/browser/defaults/preferences/syspref.js >> $LOG_FILE # copy syspref.js
/bin/cp ${ROOT}/settings/custom-prefs.js ${INSTALL_DIR}/bin/browser/defaults/preferences/custom-prefs.js >> $LOG_FILE # copy custom-prefs.js
/bin/cp ${ROOT}/settings/policies.json ${INSTALL_DIR}/bin/distribution/policies.json >> $LOG_FILE # copy policies.js


## userChrome.css/userChrome.js (adapting UI to mobile)
echo "---> copying browser chrome profile" >> $LOG_FILE
/bin/cp ${ROOT}/profile/* ${INSTALL_DIR}/profile >> $LOG_FILE # copy scripts to apply chrome on user profile and calc OSK
## cleab examples from JS and CSS subfolders.
/bin/rm -r ${INSTALL_DIR}/profile/chrome/CSS/* >> $LOG_FILE
/bin/rm -r ${INSTALL_DIR}/profile/chrome/JS/* >> $LOG_FILE
## copy CSS/JS scripts
/bin/cp ${ROOT}/profile/chrome/*.css ${INSTALL_DIR}/profile/chrome/CSS/ >> $LOG_FILE # copy CSS (userChrome.css) scripts
/bin/cp ${ROOT}/profile/chrome/*.js ${INSTALL_DIR}/profile/chrome/JS/ >> $LOG_FILE # copy CSS (userChrome.js) scripts
/bin/cp ${ROOT}/profile/chrome/*.mjs ${INSTALL_DIR}/profile/chrome/JS/ >> $LOG_FILE # copy CSS (userChrome.js) scripts


exit 0