#!/usr/bin/python3
'''
 Copyright (C) 2022  UBPorts

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 3.

 udeb is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
'''
import os
import sys
from profile import profile, chrome, librewolf_overrides

#### profile stuff
profile = profile.get_librewolf_default_profile() # get default profile
chrome.copy_custom_chrome_files(profile) # copy custom css for adapting UI to default profile
librewolf_overrides.copy_librewolf_overrides_cfg(profile) # copy librewolf settings overrides

#### librewolf stuff
os.environ["MOZ_USE_XINPUT2"] = "1"
#os.environ["GDK_SCALE"]=str(float(os.environ["GRID_UNIT_PX"]/8)) # old
os.environ["GDK_DPI_SCALE"]=str(float(os.environ["GRID_UNIT_PX"])/12)
os.environ["GTK_IM_MODULE"] = "Maliit"
os.environ["GTK_IM_MODULE_FILE"] = "lib/@CLICK_ARCH@/gtk-3.0/3.0.0/immodules/immodules.cache"

# Force Wayland
# os.environ["MOZ_ENABLE_WAYLAND"] = "1"


if len(sys.argv) > 1:
    url_to_open = sys.argv[1]
    # Pass the URL as an argument to librewolf
    # The first argument to execlp after the executable name is argv[0] for the new process,
    # so we repeat "bin/librewolf" and then add the actual arguments.
    os.execlp("bin/librewolf", "bin/librewolf", url_to_open)
else:
    # If no URL is provided, just launch librewolf normally
    os.execlp("bin/librewolf","bin/librewolf")
