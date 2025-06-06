import subprocess
import os
import re

def get_OSK_data():
    """
    Runs a QML file as a subprocess, captures its console output,
    and terminates the subprocess when '%QUIT%' is encountered.
    Captures lines containing 'calculatedPortraitOSKHeight' and
    'calculatedLandscapeOSKHeight'.

    Returns:
        list: A list of captured lines containing the specified keywords.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    keyboard_qml_path = os.path.join(script_dir, "keyboard.qml")

    if not os.path.exists(keyboard_qml_path):
        print(f"Error: keyboard.qml not found")
        return [] # Return an empty list if file not found

    print(f"Running QML file: keyboard.qml")
    print("-" * 30)

    process = None
    captured_lines = []  # Initialize an empty list to store the captured lines

    try:
        # Start the QML process, capturing stdout
        process = subprocess.Popen(
            ["qmlscene", keyboard_qml_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # Redirect stderr to stdout to capture all output
            text=True,  # Decode output as text
            bufsize=1,  # Line-buffered output
            universal_newlines=True # Ensure consistent newline handling
        )

        for line in process.stdout:
            print(f"QML Output: {line.strip()}")
            # Check if the line contains either of the keywords
            if "calculatedOSK" in line:
                captured_lines.append(line.strip())  # Add the stripped line to the list
            if "%QUIT%" in line:
                print("\n%QUIT% detected. Terminating QML process.")
                break

    except FileNotFoundError:
        print(f"Error: 'qmlscene' not found. "
              "Please ensure QML runtime is installed and in your system's PATH, "
              "or provide the full path to the executable.")
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
        print("-" * 30)
        print("QML process finished.")

    return clean_output(captured_lines)

def clean_output(captured_lines: list) -> dict:
    """
    Cleans a list of strings in the format "qml: key: value" and
    returns a dictionary with keys as strings and values as floats.
    Uses regular expressions for more robust parsing.

    Args:
        captured_lines: A list of strings, e.g.,
                        ['qml: calculatedPortraitOSKHeight: 640.00',
                         'qml: calculatedLandscapeOSKHeight: 352.80']

    Returns:
        A dictionary, e.g.,
        {
            "calculatedPortraitOSKHeight": 640.00,
            "calculatedLandscapeOSKHeight": 352.80
        }
    """
    if not captured_lines:
        return {}

    cleaned_data = {}
    # Regex to capture the key (anything after "qml: " and before the last ":")
    # and the float value (digits, optional dot, optional more digits)
    # It handles optional spaces around the colon and after "qml:".
    pattern = re.compile(r"qml:\s*(.*?):\s*(\d+\.?\d*)")

    for line in captured_lines:
        match = pattern.search(line)
        if match:
            key = match.group(1).strip()
            value_str = match.group(2).strip()
            try:
                value = float(value_str)
                cleaned_data[key] = value
            except ValueError:
                # This should ideally not happen if the regex correctly
                # captures only numeric strings, but it's good practice.
                print(f"Warning: Could not convert '{value_str}' to float for key '{key}'")
        else:
            print(f"Warning: Line did not match expected format: '{line}'")
    return cleaned_data