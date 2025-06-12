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
import yaml
import subprocess
from profile import profile, chrome, librewolf_overrides


#### Functions
def scalingdevidor(GRID_PX : int = int(os.environ["GRID_UNIT_PX"])) -> int:
  if GRID_PX >= 21: # seems to be what most need if above or at 21 grid px
    return 8
  elif GRID_PX <= 16: # this one i know because my phone is 16 so if it seems weird don't worry it works.
    return 12
  else: # throw in the dark but lets hope it works
    return 10

def is_tablet() -> int:
  try:
      with open("/etc/deviceinfo/devices/halium.yaml", 'r') as file:
        yaml_data = yaml.safe_load(file) # pull deviceinfo
        for device, info in yaml_data.items():
          if info.get("DeviceType") != 'phone': # check if its a phone or not
            return 1 # tablet
  except yaml.YAMLError as e: # implement fallback to most likely option incase there is an error
    print(f"Error parsing YAML: {e}")
    print("Defaulting to phone, as to not completely break UI.")
  except FileNotFoundError:
    print("Error: /etc/deviceinfo/devices/halium.yaml not found.")
    print("Defaulting to phone, as to not completely break UI.")
  return 0 # phone

def is_usage_mode_staged() -> bool:
  # gesttings get com.lomiri.Shell usage-mode
  usage_mode = None
  process = None
  try:
    # Start the QML process, capturing stdout
    process = subprocess.Popen(
        "gsettings get com.lomiri.Shell usage-mode",
        stdout=subprocess.PIPE,
        text=True,  # Decode output as text
        bufsize=1,  # Line-buffered output
        universal_newlines=True # Ensure consistent newline handling
    )
    usage_mode = process.stdout[0]

  except Exception as e:
    print(f"An error occurred: {e}")
  finally:
    if process and process.poll() is None:  # Check if the process is still running
        print("Killing QML process...")
        process.terminate()  # Send a terminate signal
        try:
          process.wait(timeout=5)  # Wait for the process to terminate
        except subprocess.TimeoutExpired:
          print("Process did not terminate gracefully, killing it.")
          process.kill()  # Force kill if termination fails

  if usage_mode == "Staged" or usage_mode == None: # check if staged, fallback if nothing was outputed to most likely.
    return True
  return False # if check fails then its not Staged

#### GLOBAL VARIABLES
scaling = str(float(os.environ["GRID_UNIT_PX"])/scalingdevidor())

#### profile stuff
system_var_dict = {
  "scaling" : scaling,
  "is-tablet" : is_tablet() # 0 for phone 1 for tablet
}
profile = profile.get_librewolf_default_profile() # get default profile
if is_usage_mode_staged():
  chrome.INIT_CHROME(profile, system_var_dict) # copy custom css for adapting UI to default profile and read keyboard
  librewolf_overrides.copy_librewolf_overrides_cfg(profile) # copy librewolf settings overrides
else:
  chrome.delete(profile) # attempt to delete custom chrome files, so browser works unmodifed
  librewolf_overrides.copy_librewolf_overrides_cfg(profile, False) # copy librewolf settings overrides (False on Staged mode)


#### librewolf stuff
if is_usage_mode_staged():
  os.environ["MOZ_USE_XINPUT2"] = "1"
  #os.environ["GDK_SCALE"]=str(float(os.environ["GRID_UNIT_PX"]/8)) # old
  os.environ["GDK_DPI_SCALE"]=scaling
  os.environ["GTK_IM_MODULE"] = "Maliit"
  os.environ["GTK_IM_MODULE_FILE"] = "lib/@CLICK_ARCH@/gtk-3.0/3.0.0/immodules/immodules.cache"

# Explicitly force X11 backend for GTK applications like LibreWolf (will remove when mir2.x comes out)
os.environ["GDK_BACKEND"] = "x11" 
os.environ["DISABLE_WAYLAND"] = "1"

# Force Wayland
# os.environ["MOZ_ENABLE_WAYLAND"] = "1"


if len(sys.argv) > 1:
    url_to_open = sys.argv[1]
    # Pass the URL as an argument to librewolf
    # The first argument to execlp after the executable name is argv[0] for the new process,
    # so we repeat "bin/librewolf" and then add the actual arguments.
    os.execlp("bin/AppRun", "bin/AppRun", url_to_open)
else:
    # If no URL is provided, just launch librewolf normally
    os.execlp("bin/librewolf","bin/AppRun")
