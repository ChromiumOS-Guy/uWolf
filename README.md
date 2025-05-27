# uWolf

A UT LibreWolf Wrapper for LibreWolf Firefox Based Browser.
this is still in early development, help welcome!

It's important to note that without full hardware acceleration, performance isn't stellar, but it's generally good enough for basic Browse without heavy demands.

The setup process is straightforward:
 -  Stage 1: On your very first launch, uWolf will download necessary extensions. This takes a moment.
 -  Stage 2: After extensions are ready, a quick restart is needed. This loads the custom mobile UI to make things look right.

Youtube Short Demo: https://youtube.com/shorts/8IigTL3g1t8

if the browser is too small or too big please send me the output of this:
```echo $GRID_UNIT_PX```  with device name as issue 

## know Issues
* Extra screen on launch due to xwayland
* No hardware acceleration (coming with mir2.x on Noble)
* Fixed ratio scaling issues
* buggy suggestion/autofill menu on searchbar

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
