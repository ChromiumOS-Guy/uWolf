import os
import shutil
import filecmp # Make sure filecmp is imported if not already

# (Keep your existing copy_custom_chrome_files function here as is)

def copy_librewolf_overrides_cfg(profile_info):
    """
    Copies 'librewolf.overrides.cfg' from the script's 'profile/' directory
    to the ~/.librewolf/ directory (parent of the specific profile).
    Copies only if the file is new or has changed content.

    Args:
        profile_info (tuple): A tuple containing (profile_full_path, profile_name).
                              (e.g., ('/home/user/.librewolf/xxxxxxxx.default', 'default'))
    """
    if not profile_info or not profile_info[0]:
        print("Could not find a valid profile path. Cannot copy librewolf.overrides.cfg.")
        return

    profile_path, profile_name = profile_info[0], profile_info[1]

    print(f"\nAttempting to manage librewolf.overrides.cfg")

    # The ~/.librewolf/ directory is the parent of the full profile path
    destination_dir = os.path.dirname(profile_path)
    if not os.path.exists(destination_dir):
        print(f"Error: Destination directory does not exist! ({destination_dir}). Cannot copy overrides.cfg.")
        return

    # Define source and destination paths for librewolf.overrides.cfg
    script_dir = os.path.dirname(os.path.abspath(__file__)) # Get the directory of the current script
    source_overrides_cfg = os.path.join(script_dir,  "librewolf.overrides.cfg")
    destination_overrides_cfg = os.path.join(destination_dir, "librewolf.overrides.cfg")

    # 1. Check if the source librewolf.overrides.cfg exists
    if not os.path.exists(source_overrides_cfg):
        print(f"Warning: Source librewolf.overrides.cfg not found at {source_overrides_cfg}. Skipping copy.")
        return
    if not os.path.isfile(source_overrides_cfg):
        print(f"Error: Source '{source_overrides_cfg}' is not a file. Skipping copy.")
        return

    # 2. Check if destination file exists and compare its content
    should_copy = False
    if os.path.exists(destination_overrides_cfg):
        # Compare file contents (shallow=False for full content comparison)
        try:
            if filecmp.cmp(source_overrides_cfg, destination_overrides_cfg, shallow=False):
                print(f"librewolf.overrides.cfg at {destination_overrides_cfg} is identical. Skipping copy.")
            else:
                print(f"librewolf.overrides.cfg at {destination_overrides_cfg} differs from source. Overwriting...")
                should_copy = True
                # Remove existing file before copying new one to avoid potential issues
                try:
                    os.remove(destination_overrides_cfg)
                except OSError as e:
                    print(f"Error removing existing librewolf.overrides.cfg before overwrite: {e}. Skipping this file.")
                    return # Stop if we can't remove the old file
        except OSError as e:
            print(f"Error comparing files '{source_overrides_cfg}' and '{destination_overrides_cfg}': {e}. Attempting to overwrite.")
            should_copy = True # Assume different if comparison fails
    else:
        print(f"No librewolf.overrides.cfg found at {destination_overrides_cfg}. Copying new file.")
        should_copy = True

    # 3. Copy the new librewolf.overrides.cfg if needed
    if should_copy:
        print(f"Copying {source_overrides_cfg} to {destination_overrides_cfg}")
        try:
            shutil.copy2(source_overrides_cfg, destination_overrides_cfg) # copy2 preserves metadata
            print("librewolf.overrides.cfg copied successfully.")
        except Exception as e:
            print(f"Error copying librewolf.overrides.cfg: {e}")