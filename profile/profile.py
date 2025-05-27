import subprocess
import configparser
import os

def get_whoami_output():
    """
    Executes the 'whoami' command and captures its standard output.
    """
    try:
        # subprocess.run is the recommended way to run external commands.
        # capture_output=True will capture stdout and stderr.
        # text=True decodes stdout/stderr as text using default encoding.
        result = subprocess.run(['whoami'], capture_output=True, text=True, check=True)

        # The output is in the .stdout attribute of the result object.
        # .strip() is used to remove any trailing newline characters.
        username = result.stdout.strip()
        return username
    except subprocess.CalledProcessError as e:
        # This error is raised if check=True and the command returns a non-zero exit code.
        print(f"Error executing command: {e}")
        print(f"Stderr: {e.stderr}")
        return None
    except FileNotFoundError:
        print("Error: 'whoami' command not found. Make sure it's in your system's PATH.")
        return None


def get_librewolf_default_profile():
    """
    Detects the default Librewolf profile from an existing profiles.ini.
    It does NOT create directories or profiles.ini if they don't exist.
    Returns a tuple: (full_profile_path, profile_name), or (None, None) if not found.
    """
    username = get_whoami_output()
    if not username:
        print("Could not determine current user. Exiting.")
        return None, None # Return (None, None) on error

    base_path = os.path.join("/home", username, ".librewolf")
    profiles_ini_path = os.path.join(base_path, "profiles.ini")
    
    determined_profile_path = None
    determined_profile_name = None
    
    print(f"Checking for base directory: {base_path}")

    # 1. Ensure .librewolf directory exists (only check, no creation)
    if not os.path.exists(base_path):
        print(f"Directory '{base_path}' does not exist. Cannot find profiles.ini.")
        return None

    # 2. Attempt to read existing profiles.ini
    config = configparser.ConfigParser()
    
    if os.path.exists(profiles_ini_path):
        print(f"Found existing profiles.ini at: {profiles_ini_path}. Attempting to read default profile...")
        try:
            config.read(profiles_ini_path)

            # Prioritize [Install...] section's 'Default' for the active profile path
            for section in config.sections():
                if section.startswith('Install') and 'Default' in config[section]:
                    default_profile_path_relative = config[section]['Default']
                    # Now, find the corresponding profile name from a [ProfileX] section
                    for profile_section in config.sections():
                        if profile_section.startswith('Profile') and config.has_option(profile_section, 'Path') and config[profile_section]['Path'] == default_profile_path_relative:
                            determined_profile_name = config[profile_section].get('Name') # Get the 'Name' from that profile section
                            break
                    
                    if determined_profile_name:
                        determined_profile_path = os.path.join(base_path, default_profile_path_relative)
                        print(f"Found default profile '{determined_profile_name}' with path: {determined_profile_path}")
                        break

            if not determined_profile_path: # If not found via Install section
                # Fallback to [ProfileX] with Default=1
                for section in config.sections():
                    if section.startswith('Profile') and config.has_option(section, 'Default') and config[section]['Default'] == '1':
                        if config.has_option(section, 'Path') and config.has_option(section, 'Name'):
                            determined_profile_path = os.path.join(base_path, config[section]['Path'])
                            determined_profile_name = config[section]['Name']
                            print(f"Found default profile '{determined_profile_name}' from [{section}] (Default=1): {determined_profile_path}")
                            break
            
            if determined_profile_path and determined_profile_name:
                # Ensure the directory exists if it's referenced in profiles.ini
                # We only check and print, not create, as per the strict requirement.
                if not os.path.exists(determined_profile_path):
                    print(f"Warning: Default profile directory '{determined_profile_path}' referenced in profiles.ini does not exist. It might be corrupted or missing.")
                return determined_profile_path, determined_profile_name
            else:
                print("Could not find a default profile definition in profiles.ini.")
                return None

        except configparser.Error as e:
            print(f"Error parsing profiles.ini: {e}. It might be corrupted.")
            return None
    else:
        print(f"profiles.ini not found at: {profiles_ini_path}. Cannot determine default profile.")
        return None