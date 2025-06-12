# uWolf

A UT LibreWolf Wrapper for LibreWolf Firefox Based Browser.
this is still in early development, help welcome!

It's important to note that without full hardware acceleration, performance isn't stellar, but it's generally good enough for basic Browse without heavy demands.

The setup process is straightforward:
 -  Stage 1: On your very first launch, uWolf will download necessary extensions. This takes a moment.
 -  Stage 2: After extensions are ready, a quick restart is needed. This loads the custom mobile UI to make things look right.
 -  Stage 3: Then you need to launch again (it's not a bug it's a feature)

It is Important to note that every version update you are encouraged to clear startup cache here: about:support, if there are any problems.

Youtube Short Demo: https://youtube.com/shorts/8IigTL3g1t8

if the browser is too small or too big please send me the output of this:
```echo $GRID_UNIT_PX```  with device name as issue ```getprop ro.product.name```, you are encouraged to provide more details about device


## know Issues
* No hardware acceleration (fix coming with mir2.x on Noble)
* Opening uwolf from openstore crashes uwolf. (fix coming with mir2.x on Noble)
* Seperate Clipboard (copy/paste) then rest of system (fix coming with mir2.x on Noble)
* OSK hides webcontent (this will only happen on webcontent not UI like searchbar, hiding tabbar is a actually a feature so it doesn't count)
* On some devices OSK theme changes based on browser theme. (some mitigation added)
* On second launch crashes, after that everything is fine.

if uWolf does not have search engines any default run this to agressivly set premissions 
``` shell
cd ~/.librewolf
sudo chown -R phablet:phablet a5xdbzal.default-default/
find a5xdbzal.default-default/ -type d -exec chmod u+rwx {} +
find a5xdbzal.default-default/ -type f -exec chmod u+rw {} + 
```

## TODO:
* implement OSK dynamic reactions into webcontent. (will also get rid of bug 4)
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
