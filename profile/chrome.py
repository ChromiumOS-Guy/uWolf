import os
import shutil
import filecmp # For comparing file contents
from .keyboard import get_OSK_data # must be relative


#### START CHROME INIT ####

def INIT_CHROME(profile_info : list, system_var_dict : dict):
    if not profile_info or not profile_info[0]:
        print("Could not find a valid profile path. Probably first start or an error occurred.")
        return

    profile_path, profile_name = profile_info[0], profile_info[1]

    print(f"Attempting to synchronize/generate custom 'chrome' files for profile: {profile_name}")

    if not os.path.exists(profile_path):
        print(f"Error: Profile path does not exist! ({profile_path})")
        return

    inject_search_engines_database(profile_path) # inject working DB of search engines as a workaround to this bug: (https://github.com/MrOtherGuy/fx-autoconfig/issues/79)

    destination_chrome_root = os.path.join(profile_path, "chrome") # save destination chrome folder path

    copy_custom_chrome_files(destination_chrome_root) # copy chrome .css files

    generate_css_variables(destination_chrome_root, system_var_dict) ## generate css keyboard files

#### END CHROME INIT ####

#### START SEARCH ENGINE INJECTION ####

import os
import fnmatch
import shutil
import filecmp

def inject_search_engines_database(profile_path):
    searchenginepath = os.path.join(profile_path, "storage", "permanent", "chrome", "idb")
    destination_search_engine_file = None  # Initialize to None, in case no match is found

    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_search_engine_file = os.path.join(script_dir, "3870112724rsegmnoittet-es.sqlite")

    try:
        if not os.path.isdir(searchenginepath):
            print(f"Warning: Directory not found: {searchenginepath}. Cannot inject search engines.")
            return

        for filename in os.listdir(searchenginepath):
            # Use fnmatch for wildcards, matching "anything" followed by "rsegmnoittet-es.sqlite"
            if fnmatch.fnmatch(filename, "*rsegmnoittet-es.sqlite"):
                destination_search_engine_file = os.path.join(searchenginepath, filename)
                break  # Found the file, no need to search further

        if destination_search_engine_file is None:
            print(f"Info: No existing search engine database matching '*rsegmnoittet-es.sqlite' found in {searchenginepath}. Will attempt to copy a new one.")
            destination_search_engine_file = os.path.join(searchenginepath, os.path.basename(source_search_engine_file))
            
        # Ensure the source file exists before proceeding
        if not os.path.exists(source_search_engine_file):
            print(f"Error: Source search engine file not found: {source_search_engine_file}. Cannot inject.")
            return

        # Check if destination file exists and is different from source
        if os.path.exists(destination_search_engine_file):
            try:
                if not filecmp.cmp(source_search_engine_file, destination_search_engine_file, shallow=False):
                    print(f"Existing database at {destination_search_engine_file} is different. Attempting to replace.")
                    try:
                        os.remove(destination_search_engine_file)
                        if os.path.exists(destination_search_engine_file):
                            print("Error: Failed to delete defunct search engine database when attempting removal.")
                            return
                    except OSError as e:
                        print(f"Error deleting old database {destination_search_engine_file}: {e}")
                        return
                else:
                    print(f"Search engine database at {destination_search_engine_file} is already up to date. No action needed.")
                    return # File is already the same, no injection needed
            except OSError as e:
                print(f"Error comparing files {source_search_engine_file} and {destination_search_engine_file}: {e}")
                return
            
        # Copy the file
        try:
            shutil.copy2(source_search_engine_file, destination_search_engine_file)
            print("Successfully injected working search engine database.")
        except IOError as e:
            print(f"Error copying search engine database from {source_search_engine_file} to {destination_search_engine_file}: {e}")

    except Exception as e:
        print(f"An unexpected error occurred during database injection: {e}")


#### END SEARCH ENGINE INJECTION ####

#### START GENERATE KEYBOARD PARAMETERS ####

def generate_css_variables(destination_chrome_root, system_var_dict,  data_dict: dict = get_OSK_data(), filename="system-parameters"):
    """
    Generates a CSS file with variables from a Python dictionary.

    Args:
        destination_chrome_root (path): path to chrome.
        system_var_dict (dict): has info about screen type/scaling amount.
        data_dict (dict): The dictionary containing your values.
        filename (str): The name of the CSS file to create.
    """

    # For testing purposes, you can uncomment this:
    #data_dict = {
    #    'calculatedPortraitOSKHeight': 640.00,
    #    'calculatedLandscapeOSKHeight': 352.80
    #}

    # Construct the full path to the file
    full_filepath = os.path.join(destination_chrome_root, "CSS" , filename + ".css")

    # Extract the directory path from the full file path
    file_directory = os.path.dirname(full_filepath)

    # Add header comment
    css_content = f"""/* {filename}.css */
/* This file defines CSS variables for custom UI to use (AUTO GENERATED). */\n""".format(filename=filename)
    # Now, attempt to create/write the file
    css_content += "\n:root {\n"

    #### Keyboard (OSK)
    for key, value in data_dict.items():
        # Convert camelCase to kebab-case for CSS variable names
        css_key = ''.join(['-' + c.lower() if c.isupper() else c for c in key]).lstrip('-')

        # Add 'px' or other units if appropriate.
        # You might need more sophisticated logic here if units vary.
        if isinstance(value, (int, float)):
            css_content += f"  --{css_key}: {value}px;\n"
        else:
            css_content += f"  --{css_key}: {value};\n"
    
    #### ENV VARIABLES (no fromating for full control)
    for key, value in system_var_dict.items():
        # Convert camelCase to kebab-case for CSS variable names
        css_key = ''.join(['-' + c.lower() if c.isupper() else c for c in key]).lstrip('-')
        css_content += f"  --{css_key}: {value};\n"

    css_content += "}\n"

    try:
        with open(full_filepath, "w") as f:
            f.write(css_content)
        print(f"CSS variables saved to {full_filepath}")
    except OSError as e:
        print(f"Error writing to file '{full_filepath}': {e}")

#### END GENERATE KEYBOARD PARAMETERS ####

#### START CUSTOM PROFILE CREATION ####
def copy_custom_chrome_files(destination_chrome_root):
    """
    Copies files from the script's 'chrome/' directory to the specified
    Librewolf profile's 'chrome/' directory. Only copies files that are new
    or have changed content. It also creates necessary subdirectories.

    Args:
        destination_chrome_root (path): a path to profile/chrome.
    """
    
    # Define paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_chrome_dir = os.path.join(script_dir, "chrome")

    # 1. Check if the source 'chrome' directory exists
    if not os.path.exists(source_chrome_dir):
        print(f"Warning: Source 'chrome' directory not found at {source_chrome_dir}. Skipping copy.")
        return
    if not os.path.isdir(source_chrome_dir):
        print(f"Error: Source '{source_chrome_dir}' is not a directory. Skipping copy.")
        return

    # Ensure the root destination 'chrome' directory exists
    if not os.path.exists(destination_chrome_root):
        print(f"Creating destination 'chrome' root directory: {destination_chrome_root}")
        try:
            os.makedirs(destination_chrome_root)
        except OSError as e:
            print(f"Error creating destination 'chrome' root directory: {e}")
            return

    # Walk through the source 'chrome' directory tree
    for dirpath, dirnames, filenames in os.walk(source_chrome_dir):
        # Calculate the relative path from the source_chrome_dir to the current directory (dirpath)
        # E.g., if source_chrome_dir is /path/to/script/chrome
        # and dirpath is /path/to/script/chrome/subfolder
        # rel_path will be "subfolder"
        rel_path = os.path.relpath(dirpath, source_chrome_dir)

        # Construct the corresponding full path in the destination profile's 'chrome' directory
        current_destination_dir = os.path.join(destination_chrome_root, rel_path)

        # Ensure the current destination subdirectory exists
        if not os.path.exists(current_destination_dir):
            print(f"Creating directory: {current_destination_dir}")
            try:
                os.makedirs(current_destination_dir)
            except OSError as e:
                print(f"Error creating directory {current_destination_dir}: {e}. Skipping files in this directory.")
                continue # Skip processing files in this problematic directory

        # Process each file in the current directory
        for filename in filenames:
            source_file_path = os.path.join(dirpath, filename)
            destination_file_path = os.path.join(current_destination_dir, filename)

            should_copy = False
            if os.path.exists(destination_file_path):
                # Compare file contents (shallow=False for full content comparison)
                try:
                    if filecmp.cmp(source_file_path, destination_file_path, shallow=False):
                        # print(f"File '{filename}' is identical. Skipping.") # Uncomment for verbose output of identical files
                        pass
                    else:
                        print(f"File '{filename}' differs. Overwriting...")
                        should_copy = True
                        # Remove existing file before copying new one to avoid potential issues
                        try:
                            os.remove(destination_file_path)
                        except OSError as e:
                            print(f"Error removing existing file {destination_file_path} before overwrite: {e}. Skipping this file.")
                            continue # Skip this file if removal fails
                except OSError as e:
                    print(f"Error comparing files '{source_file_path}' and '{destination_file_path}': {e}. Attempting to overwrite.")
                    should_copy = True # Assume different if comparison fails
            else:
                print(f"File '{filename}' does not exist in destination. Copying...")
                should_copy = True

            if should_copy:
                try:
                    # shutil.copy2 preserves metadata (like modification times, permissions)
                    shutil.copy2(source_file_path, destination_file_path)
                    print(f"Copied: {source_file_path} to {destination_file_path}")
                except Exception as e:
                    print(f"Error copying file {source_file_path} to {destination_file_path}: {e}")
        
        for dirpath, dirnames, filenames in os.walk(destination_chrome_root, topdown=False): # topdown=False for deleting subdirs first
            rel_path = os.path.relpath(dirpath, destination_chrome_root)
            current_source_dir = os.path.join(source_chrome_dir, rel_path)

            # Delete extraneous files
            for filename in filenames:
                destination_file_path = os.path.join(dirpath, filename)
                source_file_path = os.path.join(current_source_dir, filename)

                if not os.path.exists(source_file_path):
                    print(f"Deleting extraneous file: {destination_file_path}")
                    try:
                        os.remove(destination_file_path)
                    except OSError as e:
                        print(f"Error deleting file {destination_file_path}: {e}")

            # Delete extraneous directories (only if empty after file deletions, or if not in source)
            if dirpath != destination_chrome_root: # Don't delete the root destination_chrome_root itself
                if not os.path.exists(current_source_dir):
                    if not os.listdir(dirpath): # Check if directory is empty
                        print(f"Deleting extraneous empty directory: {dirpath}")
                        try:
                            os.rmdir(dirpath)
                        except OSError as e:
                            print(f"Error deleting empty directory {dirpath}: {e}")
                    else:
                        pass # Leave non-empty extraneous directories if they weren't in source

#### END CUSTOM PROFILE CREATION ####

#### START DELETE CHROME ####

def delete(profile_info):
    """
    deletes profile/chrome for the specifed librewolf profile

    Args:
        profile_info (tuple): A tuple containing (profile_full_path, profile_name).
                              (e.g., ('/home/user/.librewolf/xxxxxxxx.default', 'default'))
    """
    
    if not profile_info or not profile_info[0]:
        print("Could not find a valid profile path. Probably first start or an error occurred.")
        return

    profile_path, profile_name = profile_info[0], profile_info[1]

    print(f"Attempting to delete custom 'chrome' files for profile: {profile_name}")

    # Define paths
    destination_chrome_root = os.path.join(profile_path, "chrome")

    # Ensure the root destination 'chrome' directory exists
    if not os.path.exists(destination_chrome_root):
        print(f"Error destination 'chrome' root directory does not exist, nothing to do.")
    
    try:
        os.rmdir(destination_chrome_root)
    except OSError as e:
        print(f"Error deleting root 'chrome' directory {destination_chrome_root}: {e}")

#### END DELETE CHROME ####