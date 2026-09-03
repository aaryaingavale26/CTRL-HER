import os
import sys

# Hotfix for PyInstaller Streamlit Metadata Bug
# This explicitly injects a mock version string before Streamlit initializes
import sys
if 'importlib.metadata' in sys.modules or 'importlib_metadata' in sys.modules:
    import importlib.metadata
    def mock_version(package_name):
        if package_name == 'streamlit':
            return '1.35.0'  # Injects a stable version string to bypass the check
        try:
            return original_version(package_name)
        except Exception:
            raise importlib.metadata.PackageNotFoundError(package_name)
    
    original_version = importlib.metadata.version
    importlib.metadata.version = mock_version

import streamlit.web.cli as stcli

if __name__ == '__main__':
    base_path = os.path.dirname(__file__)
    target_script = os.path.join(base_path, 'app.py')
    
    sys.argv = ["streamlit", "run", target_script, "--global.developmentMode=false"]
    sys.exit(stcli.main())