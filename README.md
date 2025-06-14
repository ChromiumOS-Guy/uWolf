# uWolf

A UT Wrapper for LibreWolf Firefox Based Browser.
this is still in early development, help welcome!

It's important to note that without full hardware acceleration, performance isn't stellar, but it's generally good enough for basic Browse without heavy demands.

The setup process is straightforward:
 -  Stage 1: On your very first launch, uWolf will download necessary extensions. This takes a moment.
 -  Stage 2: After extensions are ready, a quick restart is needed. This loads the custom mobile UI to make things look right.

It is Important to note that every version update you are encouraged to clear startup cache here: about:support, if there are any problems.

Youtube Short Demo: https://youtube.com/shorts/8IigTL3g1t8

if the browser is too small or too big please send me the output of this:
```echo $GRID_UNIT_PX```  with device name as issue ```getprop ro.product.name```, you are encouraged to provide more details about device.


## Support:
you can either create an Issue on github (faster), or you can ask in the forum [here](https://forums.ubports.com/topic/11060/uwolf-librewolf).


## know Issues
* No hardware acceleration (fix coming with mir2.x subsurface support on Noble)
* Opening uwolf from url dispatcher crashes uwolf, this also affects opening from openstore. (fix coming with mir2.x subsurface support on Noble)
* Seperate Clipboard (copy/paste) then rest of system (fix coming with mir2.x subsurface support on Noble)
* There are no default search engines due to a [bug in fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig/issues/79) (userchrome.js loader).

## circumventing bug 4:
this will delete you're current profile (passwords/bookmark/ect), this is guaranteed to work though.
run this:
``` shell
rm -rf ~/.librewolf/
sudo mv /opt/click.ubuntu.com/uwolf.chromiumos-guy/current/bin/defaults/pref/config-prefs.js /opt/click.ubuntu.com/uwolf.chromiumos-guy/current/bin/defaults/pref/config-prefs.js.disabled
```
then run librewolf, follow setup process step 1,
when step 1 is finished close librewolf and run this:
```shell
sudo mv /opt/click.ubuntu.com/uwolf.chromiumos-guy/current/bin/defaults/pref/config-prefs.js.disabled /opt/click.ubuntu.com/uwolf.chromiumos-guy/current/bin/defaults/pref/config-prefs.js
```
if this still doesn't work try running this:
``` shell
cd ~/.librewolf
sudo chown -R phablet:phablet *.default-default/
find *.default-default/ -type d -exec chmod u+rwx {} +
find *.default-default/ -type f -exec chmod u+rw {} + 
```

## TODO:
* fix bug 4 as you cannot properly use the browser with it being in effect.
* implement url_dispatcher for link opening functionality (requiers fixing bug 2)


important to mention the dynamic OSK currently only works on browser UI elements NOT webcontent, this is not a bug just lack of implementation.

### License

Copyright (C) 2025  ChromiumOS-Guy

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License version 3, as published by the
Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranties of MERCHANTABILITY, SATISFACTORY
QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.
