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
def get_lcd_density() -> int:
  # getprop vendor.display.lcd_density
  lcd_density = None
  process = None
  try:
    # Start the QML process, capturing stdout
    process = subprocess.Popen(
        ["getprop", "vendor.display.lcd_density"],
        stdout=subprocess.PIPE,
        text=True,  # Decode output as text
        bufsize=1,  # Line-buffered output
        universal_newlines=True # Ensure consistent newline handling
    )
    lcd_density = int(process.stdout.readline().strip())

  except Exception as e:
    print(f"An error occurred: {e}")
    return 0
  finally:
    if process and process.poll() is None:  # Check if the process is still running
        print("Killing process...")
        process.terminate()  # Send a terminate signal
        try:
          process.wait(timeout=5)  # Wait for the process to terminate
        except subprocess.TimeoutExpired:
          print("Process did not terminate gracefully, killing it.")
          process.kill()  # Force kill if termination fails
  
  return lcd_density

def scalingdevidor(GRID_PX : int = int(os.environ["GRID_UNIT_PX"])) -> int: # getprop vendor.display.lcd_density
  if GRID_PX >= 21: # seems to be what most need if above or at 21 grid px
    return 8
  elif GRID_PX <= 16: # this one i know because my phone is 16 so if it seems weird don't worry it works.
    return 12
  else: # throw in the dark but lets hope it works
    return 10


def is_tablet() -> int:
    # getprop vendor.display.lcd_density
    devicetype = None
    process = None
    try:
        # Start the QML process, capturing stdout
        process = subprocess.run(
            "device-info | awk -F': ' '/DeviceType:/ {print $2}'",
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        devicetype = process.stdout.strip()

    except process.CalledProcessError as e:
        # This handles errors if any command in the pipeline fails.
        print(f"Command failed with return code {e.returncode}:")
        print(e.stderr)
        return 0 # fallback to phone
    except FileNotFoundError as e:
        print(f"Error: A command in the pipeline was not found. Details: {e}")
        return 0 # fallback to phone
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return 0 # fallback to phone
    
    if devicetype == "tablet":
      return 1
    else:
      return 0


def is_usage_mode_staged() -> bool:
  # gesttings get com.lomiri.Shell usage-mode
  usage_mode = None
  process = None
  try:
    # Start the QML process, capturing stdout
    process = subprocess.Popen(
        ["gsettings", "get", "com.lomiri.Shell", "usage-mode"],
        stdout=subprocess.PIPE,
        text=True,  # Decode output as text
        bufsize=1,  # Line-buffered output
        universal_newlines=True # Ensure consistent newline handling
    )
    usage_mode = process.stdout.readline().strip()

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

  if usage_mode == r"'Staged'" or usage_mode == None: # check if staged, fallback if nothing was outputed to most likely.
    return True
  return False # if check fails then its not Staged


#### GLOBAL VARIABLES
scaling = 1.5
if get_lcd_density() == 0:
  print("falling back to GRID UNIT scaling.")
  scaling = str(max(0.7, min(float(os.environ["GRID_UNIT_PX"])/scalingdevidor(), 2.4))) # cap at 2.4max and 0.7min so avoid croping issues.
else:
  scaling = str(max(0.7, min(float(get_lcd_density()/240), 2.4))) # cap at 2.4max and 0.7min so avoid croping issues. (DPI Scaling)


#### profile stuff
system_var_dict = {
  "is-tablet" : is_tablet() # 0 for phone 1 for tablet
}
username = profile.get_whoami_output() # get username
if not username: # ensure username is not empty
  print("failed to find username defualting to phablet")
  username = "phablet"

current_profile = profile.get_librewolf_default_profile() # get default profile
if not current_profile or not current_profile[0]: # try to create a default profile if it is not present.
  print("profile not found, trying to create a new profile")
  try:
      # Use subprocess to create the profile
      result = subprocess.run(
          ["bin/AppRun", "-CreateProfile", username, "--headless"],
          check=True  # This will raise an exception if the command fails
      )
      print("Profile created successfully.")
      current_profile = profile.get_librewolf_default_profile()
  except subprocess.CalledProcessError as e: # handle exception
      print("An error occurred while trying to create the profile:", e)

dbus_monitor_thread = None
dbus_stop_event = None

if is_usage_mode_staged():
  chrome.INIT_CHROME(current_profile, system_var_dict) # copy custom css for adapting UI to default profile and read keyboard
  librewolf_overrides.copy_librewolf_overrides_cfg(current_profile) # copy librewolf settings overrides
  thread_obj, event_obj = focus_monitor.monitor_dbus_and_write_to_file(current_profile) # run monitor for osk focus pid in dbus
  # Assign them to global/module-level variables
  if thread_obj and event_obj: # Check if the function returned valid objects
      dbus_monitor_thread = thread_obj
      dbus_stop_event = event_obj
      dbus_monitor_thread.start() # start the thread, so monitor monitors.
      print("D-Bus monitor thread started.")
  else:
      print("Failed to initialize D-Bus monitor thread.")
else:
  chrome.delete(current_profile) # attempt to delete custom chrome files, so browser works unmodifed
  librewolf_overrides.copy_librewolf_overrides_cfg(current_profile, False) # copy librewolf settings overrides (True if Staged mode)


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