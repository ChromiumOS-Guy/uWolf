import threading
import subprocess
import os
import time

def monitor_dbus_and_write_to_file(profile_info):
    """
    Monitors dbus for specific output and directly appends the filtered output to a file.

    This function runs a `dbus-monitor` command piped to `grep` directly,
    with the output redirected to the specified file using shell redirection (`>>`).
    The Python thread's primary role is to start and manage the lifecycle of this
    long-running shell command.

    Args:
        profile_info (list): A list where the first element is the base profile path.
                             Example: `['/home/user/.config/my_app_profile']`

    Returns:
        tuple: A tuple containing:
               - `threading.Thread` object: The active thread running the monitoring.
               - `threading.Event` object: An event to signal the thread to stop.
               Returns `(None, None)` if the provided profile path is invalid.
    """
    # Check if profile_info has content and a valid path
    if not profile_info or not profile_info[0]:
        print("Could not find a valid profile path. Probably first start or an error occurred.")
        return None, None

    profile_path = profile_info[0]

    if not os.path.exists(profile_path):
        print(f"Error: Profile path does not exist! ({profile_path})")
        return None, None

    output_filepath = os.path.join(profile_path, "chrome", "JS", "osk_overlay_config.js")

    stop_event = threading.Event()

    def _worker_function():
        """
        The main function executed by the monitoring thread.
        It runs the dbus command with direct file redirection.
        """
        print(f"D-Bus monitoring thread started. Output will be appended directly to: {output_filepath}")

        # Construct the command string including shell redirection.
        # --line-buffered for grep is important to ensure output is flushed frequently.
        # '>> {output_filepath}' appends the output to the file.
        command_string = """dbus-monitor | grep --line-buffered -i "com.canonical.Unity.FocusInfo.*isPidFocused" >> {output_filepath}""".format(output_filepath=output_filepath)
        process = None

        try:
            # Start the subprocess. stdout/stderr are not captured by Python
            # as they are redirected by the shell command itself.
            process = subprocess.Popen(
                command_string,
                shell=True,
                # No stdout=subprocess.PIPE or stderr=subprocess.PIPE here,
                # as shell redirection handles the output.
                # text=True and bufsize=1 are also not relevant for Popen itself,
                # but bufsize=1 is implicitly handled by grep --line-buffered.
            )

            # Wait for the stop event or for the process to terminate unexpectedly.
            # Using stop_event.wait() with a timeout allows checking if the process
            # terminated on its own.
            while not stop_event.is_set():
                if process.poll() is not None:
                    # Process terminated unexpectedly
                    print(f"D-Bus monitor process terminated unexpectedly with exit code: {process.returncode}")
                    break
                time.sleep(1) # Check every second

        except FileNotFoundError as e:
            print(f"Error: Command not found. Ensure 'dbus-monitor' and 'grep' are in your system's PATH. ({e})")
        except Exception as e:
            print(f"An unexpected error occurred in the D-Bus monitoring thread: {e}")
        finally:
            # Ensure the subprocess is terminated upon thread exit
            if process and process.poll() is None: # If the process is still running
                print("Terminating D-Bus monitor process...")
                process.terminate() # Send SIGTERM
                try:
                    process.wait(timeout=5) # Wait for a few seconds for it to terminate gracefully
                except subprocess.TimeoutExpired:
                    print("Process did not terminate gracefully, force killing...")
                    process.kill() # Send SIGKILL if it didn't terminate in time
                    process.wait() # Wait for the kill to complete
            print("D-Bus monitoring thread finished.")

    thread = threading.Thread(target=_worker_function)
    return thread, stop_event