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
import re
import subprocess
from profile import profile, chrome, librewolf_overrides
import focus_monitor


#### Functions
def scalingdevidor(GRID_PX : int = int(os.environ["GRID_UNIT_PX"])) -> int:
  if GRID_PX >= 21: # seems to be what most need if above or at 21 grid px
    return 8
  elif GRID_PX <= 16: # this one i know because my phone is 16 so if it seems weird don't worry it works.
    return 12
  else: # throw in the dark but lets hope it works
    return 10

def is_tablet() -> int:
  process = None
  try:
    yaml_path = "/etc/deviceinfo/devices/halium.yaml" # will be use as fallback if device is not native device.
    process = subprocess.Popen(
        "getprop ro.product.name",
        stdout=subprocess.PIPE,
        text=True,  # Decode output as text
        bufsize=1,  # Line-buffered output
        universal_newlines=True # Ensure consistent newline handling
    )

    # Read the first line of stdout and strip whitespace
    devicename_raw = process.stdout.readline().strip()
    
    # Normalize devicename
    devicename_normalized = devicename_raw.lower().replace(" ", "").replace("-", "").replace("_", "") # Added _ as well

    all_entries = os.listdir("/etc/deviceinfo/devices/")

    print("\nComparing device name with filenames in /etc/deviceinfo/devices/:")
    for entry in all_entries:
      filename_without_ext = os.path.splitext(entry)[0]
      filename_normalized = filename_without_ext.lower().replace(" ", "").replace("-", "").replace("_", "") # Added _ as well
      if devicename_normalized == filename_normalized: # check if device is native and if so, use its deviceinfo yaml
        yaml_path = os.path.join("/etc/deviceinfo/devices", entry)
        break

    with open(yaml_path, 'r') as file:
      yaml_data = yaml.safe_load(file) # pull deviceinfo
      if not yaml_data:
        print("Error: {path} is empty (no attribute items).".format(path=yaml_path))
        print("Defaulting to phone, as to not completely break UI.")
        return 0 # phone
      for device, info in yaml_data.items():
        if info.get("DeviceType") != 'phone': # check if its a phone or not
          return 1 # tablet
  
  except yaml.YAMLError as e: # implement fallback to most likely option incase there is an error
    print(f"Error parsing YAML: {e}")
    print("Defaulting to phone, as to not completely break UI.")
  
  except FileNotFoundError:
    print("Error: /etc/deviceinfo/devices/halium.yaml not found.")
    print("Defaulting to phone, as to not completely break UI.")
  
  except Exception as e:
    print(f"An error occurred: {e}")
    print("Defaulting to phone, as to not completely break UI.")
  
  finally:
    if process and process.poll() is None:  # Check if the process is still running
        print("Killing process...")
        process.terminate()  # Send a terminate signal
        try:
          process.wait(timeout=5)  # Wait for the process to terminate
        except subprocess.TimeoutExpired:
          print("Process did not terminate gracefully, killing it.")
          process.kill()  # Force kill if termination fails
  
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
        print("Killing process...")
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
scaling = str(max(0.7, min(float(os.environ["GRID_UNIT_PX"])/scalingdevidor(), 2.4)))

#### profile stuff
system_var_dict = {
  "scaling" : scaling,
  "is-tablet" : is_tablet() # 0 for phone 1 for tablet
}
profile = profile.get_librewolf_default_profile() # get default profile
dbus_monitor_thread = None
dbus_stop_event = None
if is_usage_mode_staged():
  chrome.INIT_CHROME(profile, system_var_dict) # copy custom css for adapting UI to default profile and read keyboard
  librewolf_overrides.copy_librewolf_overrides_cfg(profile) # copy librewolf settings overrides
  thread_obj, event_obj = focus_monitor.monitor_dbus_and_write_to_file(profile) # run monitor for osk focus pid in dbus
  # Assign them to global/module-level variables
  if thread_obj and event_obj: # Check if the function returned valid objects
      dbus_monitor_thread = thread_obj
      dbus_stop_event = event_obj
      dbus_monitor_thread.start() # start the thread, so monitor monitors.
      print("D-Bus monitor thread started.")
  else:
      print("Failed to initialize D-Bus monitor thread.")
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

try:
  if len(sys.argv) > 1:
      url_to_open = sys.argv[1]
      # Pass the URL as an argument to librewolf
      # The first argument to execlp after the executable name is argv[0] for the new process,
      # so we repeat "bin/librewolf" and then add the actual arguments.
      os.execlp("bin/AppRun", "bin/AppRun", url_to_open)
  else:
      # If no URL is provided, just launch librewolf normally
      os.execlp("bin/AppRun","bin/AppRun")
except:
  pass


# stop dbus monitor
if dbus_monitor_thread and dbus_monitor_thread.is_alive():
    print("Signaling D-Bus monitor thread to stop...")
    dbus_stop_event.set() # Set the event to tell the thread to exit its loop
    dbus_monitor_thread.join() # Wait for the thread to finish its execution and cleanup
    print("D-Bus monitor thread stopped successfully.")
else:
    print("D-Bus monitor thread was not running or not initialized, so no need to stop it.")