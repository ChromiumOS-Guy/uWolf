# uWolf

A UT Wrapper for LibreWolf Firefox Based Browser.
this is still in early development, help welcome!

It's important to note that without full hardware acceleration, performance isn't stellar, but it's generally good enough for basic Browse without heavy demands.

Youtube Short Demo: https://youtube.com/shorts/8IigTL3g1t8

## Setup:
The setup process is straightforward:
 -  Stage 1: On your very first launch, uWolf will download necessary extensions. This takes a moment.
 -  Stage 2: After extensions are ready, a quick restart is needed. This loads the custom mobile UI to make things look right.

It is Important to note that every version update you are encouraged to clear startup cache here: about:support, if there are any problems.

## Support:
you can either create an Issue on github (faster), or you can ask in the forum [here](https://forums.ubports.com/topic/11060/uwolf-librewolf) (doubles as DEVLOG).

if the browser is too small or too big please send me the output of this:
```echo $GRID_UNIT_PX```  with device name as issue ```getprop ro.product.name```, you are encouraged to provide more details about device.

## Known Issues:
* OSK takes a bit of time to load due to plugin initalizing last. (not fixable)
* No hardware acceleration (fix coming with mir2.x subsurface support on Noble)
* Opening uwolf from url dispatcher crashes uwolf, this also affects opening from openstore. (fix coming with mir2.x subsurface support on Noble)
* Seperate Clipboard (copy/paste) then rest of system (fix coming with mir2.x subsurface support on Noble)
* uWolf crashes when writing changes to profile (only noticable when updating uWolf, or on second launch of browser)
* ### LANDSCAPE Issues:
    * Inputs on the right side of the screen do not work in landscape mode (fix PROBABLY MAYBE coming with mir2.x subsurface support on Noble)
    * Settings can only be access in portrait mode (fix PROBABLY MAYBE coming with mir2.x subsurface support on Noble)
    * Tabbar broken on Landscape
    * OSK broken on Landscape

if you want to contribute or check on the progress on the subsurface support go [here](https://gitlab.com/ubports/development/core/qtmir/-/merge_requests/83)



## TODO:
* implement url_dispatcher for link opening functionality (requiers fixing bug 3)
* #### completly turn UI to mobile with userchrome.js settings no UIX element will be spared (please help me if you're good at CSS or JavaScript, its not hard just time consuming work.):
    * add desktop/mobile mode for websites on panelUI settings menu.
    * changes tabbar into a tab drawer.
    * change the layout of every about: page with custom CSS injection to make it work for mobile.


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
