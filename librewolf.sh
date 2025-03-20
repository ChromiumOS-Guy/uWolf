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

os.environ["MOZ_USE_XINPUT2"] = "1"
os.environ["GDK_SCALE"]=str(float(os.environ["GRID_UNIT_PX"])/8)
os.environ["GTK_IM_MODULE"] = "Maliit"
os.environ["GTK_IM_MODULE_FILE"] = "lib/@CLICK_ARCH@/gtk-3.0/3.0.0/immodules/immodules.cache"
os.execlp("bin/librewolf","bin/librewolf")
