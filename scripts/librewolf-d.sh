#!/bin/sh
set -e

case $ARCH in # make sure its the format i want while logging
  aarch64|arm64) echo -e "aarch64 architecture detected\n" && ARCH="aarch64";;
  amd64|x86_64) echo -e "amd64/x86_64 architecture detected\n" && ARCH="x86_64" ;;
  *) echo "Error: Unknown architecture ${ARCH}" && exit 1 ;;
esac

URL="https://gitlab.com/api/v4/projects/24386000/packages/generic/librewolf/latest/LibreWolf.${ARCH}.AppImage" # get download URL for appimage

echo -e "download url: (${URL})\n" # logging

/bin/wget "${URL}" -P "${INSTALL_DIR}" # download it

APPIMAGE=`/bin/find "$INSTALL_DIR" -type f -name "*.AppImage" -print -quit` # get INSTALL_DIR to appimage

if [ -f "${APPIMAGE}" ]; then # check if appimage downloaded
  :
else
  echo "Error: NO APPIMAGE FOUND, did download go wrong?"
  exit 1
fi

/bin/chmod +x ${APPIMAGE} # grant it permissions

QEMU_STATIC=`/bin/sh -lc "/bin/which qemu-${ARCH}-static" 2>/dev/null` # get qemu-$ARCH-static INSTALL_DIR

if [ -z "$QEMU_STATIC" ]; then
  echo -e "Error: qemu-${ARCH}-static not found\n"
  echo "       try installing qemu-user-static"
  /bin/rm -rf ${APPIMAGE}
  exit 1
fi

cd $INSTALL_DIR # needed to control extract dir
$QEMU_STATIC $APPIMAGE --appimage-extract # extract with qemu emulation

# cd $INSTALL_DIR # will fail (only work if target and host arch are the same)
# $APPIMAGE --appimage-extract

if [ ! -d "$INSTALL_DIR/squashfs-root" ]; then # check for extraction
  echo "Error: appimage not extracted properly!"
  /bin/rm -rf ${APPIMAGE}
  exit 1
fi

/bin/cp -r $INSTALL_DIR/squashfs-root/* $INSTALL_DIR/bin # move librewolf binary to its place (with merging)
/bin/rm -rf $INSTALL_DIR/squashfs-root 

if [ ! -d "${INSTALL_DIR}/bin" ]; then # sanity check mv worked
  echo "directory (${INSTALL_DIR}/bin) does not exist!!"
  exit 1
fi

/bin/rm -rf ${APPIMAGE} # remove appimage as its not needed anymore.

if [ -f "${APPIMAGE}" ]; then # check if appimage remove, as this is not catastrophic script does not fail.
  echo "Failed to Remove APPIMAGE (${APPIMAGE}) please remove manually"
fi

exit 0