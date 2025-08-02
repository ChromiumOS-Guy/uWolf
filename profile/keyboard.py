import subprocess
import os
import re


def is_wordribbon_enabled() -> bool:
  # gesttings get com.lomiri.Shell usage-mode
  spellchecking = None
  predictivetext = None
  process = None
  try:
    # Start the QML process, capturing stdout
    process = subprocess.Popen(
        ["gsettings", "get", "com.lomiri.keyboard.maliit", "spell-checking"],
        stdout=subprocess.PIPE,
        text=True,  # Decode output as text
        bufsize=1,  # Line-buffered output
        universal_newlines=True # Ensure consistent newline handling
    )

    spellchecking = process.stdout.readline().strip()

    process = subprocess.Popen(
        ["gsettings", "get", "com.lomiri.keyboard.maliit", "predictive-text"],
        stdout=subprocess.PIPE,
        text=True,  # Decode output as text
        bufsize=1,  # Line-buffered output
        universal_newlines=True # Ensure consistent newline handling
    )

    predictivetext = process.stdout.readline().strip()

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

  if spellchecking == "true" or spellchecking == None or predictivetext == "true" or predictivetext == None: # check if true, fallback if nothing was outputed to least UI breaking.
    return True
  return False # if check fails then its enabled

def get_vertical_resolution() -> int:
    # getprop vendor.display.lcd_density
    vertical_resolution = None
    process = None
    try:
        # Start the QML process, capturing stdout
        process = subprocess.run(
            "cat /sys/class/drm/card0-DSI-1/modes | awk -F 'x' '{print $2}' | sort -u",
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        vertical_resolution = int(process.stdout.strip())

    except process.CalledProcessError as e:
        # This handles errors if any command in the pipeline fails.
        print(f"Command failed with return code {e.returncode}:")
        print(e.stderr)
        return 0
    except FileNotFoundError as e:
        print(f"Error: A command in the pipeline was not found. Details: {e}")
        return 0
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return 0
  
    return vertical_resolution

def get_horizontal_resolution() -> int:
    # getprop vendor.display.lcd_density
    horizontal_resolution = None
    process = None
    try:
        # Start the QML process, capturing stdout
        process = subprocess.run(
            "cat /sys/class/drm/card0-DSI-1/modes | awk -F 'x' '{print $1}' | sort -u",
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        horizontal_resolution = int(process.stdout.strip())

    except process.CalledProcessError as e:
        # This handles errors if any command in the pipeline fails.
        print(f"Command failed with return code {e.returncode}:")
        print(e.stderr)
        return 0
    except FileNotFoundError as e:
        print(f"Error: A command in the pipeline was not found. Details: {e}")
        return 0
        
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return 0
  
    return horizontal_resolution

def get_keyboard_heights() -> dict:
    """
    Reads a JavaScript file and extracts specific keyboard height variables into a dictionary.

    Returns:
        A dictionary containing the extracted keyboard height values.
        Returns an empty dictionary if the file cannot be read or variables are not found.
    """
    keyboard_heights = {}
    file_path = "/usr/share/maliit/plugins/lomiri-keyboard/keys/key_constants.js"

    # The variables we want to extract
    variables_to_find = [
        "tabletWordribbonHeight",
        "phoneWordribbonHeight",
        "phoneKeyboardHeightPortrait",
        "tabletKeyboardHeightLandscape",
        "phoneKeyboardHeightLandscape",
        "tabletKeyboardHeightPortrait"
    ]

    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: The file {file_path} was not found.")
        return {}
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return {}

    for var_name in variables_to_find:
        # We use a regular expression to find the variable and its value.
        # The pattern looks for 'var', the variable name, '=', and then captures the number.
        # It handles both integers and floats.
        pattern = rf'var\s+{re.escape(var_name)}\s*=\s*([0-9.]+);'
        match = re.search(pattern, content)
        if match:
            # We try to convert the matched string to a float.
            # If it's a whole number, it will be an integer.
            try:
                value_str = match.group(1)
                if '.' in value_str:
                    keyboard_heights[var_name] = float(value_str)
                else:
                    keyboard_heights[var_name] = int(value_str)
            except (ValueError, IndexError) as e:
                print(f"Could not parse value for {var_name}: {e}")
                continue
    
    return keyboard_heights


def get_OSK_data() -> dict:
    keyboard_heights = get_keyboard_heights()
    vertical_resolution = get_vertical_resolution()
    horizontal_resolution = get_horizontal_resolution()
    print(horizontal_resolution,vertical_resolution)
    Phonewordribbon = 0
    Tabletwordribbon = 0
    output_dict = { # fallback in case it doesn't work, will use my phone's values with wordribbon ON.
        "calculated-o-s-kphone-portrait-height" : 704.0,
        "calculated-o-s-ktablet-portrait-height" : 592.0,
        "calculated-o-s-kphone-landscape-height" : 474.4,
        "calculated-o-s-ktablet-landscape-height" : 434.4
    }

    try:
        if is_wordribbon_enabled():
            Phonewordribbon = int(keyboard_heights["phoneWordribbonHeight"]) * int(os.environ["GRID_UNIT_PX"])
            Tabletwordribbon = int(keyboard_heights["tabletWordribbonHeight"]) * int(os.environ["GRID_UNIT_PX"])

        output_dict = {
            "calculated-o-s-kphone-portrait-height" : (float(keyboard_heights["phoneKeyboardHeightPortrait"]) * vertical_resolution) - Phonewordribbon, # we are removing the height of wordribbon because CSS implementation was easier this way
            "calculated-o-s-ktablet-portrait-height" : (float(keyboard_heights["tabletKeyboardHeightPortrait"]) * vertical_resolution) - Tabletwordribbon,
            "calculated-o-s-kphone-landscape-height" : (float(keyboard_heights["phoneKeyboardHeightLandscape"]) * horizontal_resolution) - Phonewordribbon,
            "calculated-o-s-ktablet-landscape-height" : (float(keyboard_heights["tabletKeyboardHeightLandscape"]) * horizontal_resolution) - Tabletwordribbon
        }
    except TypeError:
        # This block only runs if a TypeError occurs in the 'try' block.
        print("Error: You cannot add a number and a string together.")


    return output_dict