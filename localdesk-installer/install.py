"""Local Desk per-user Windows setup. Standard library only; inspect before running."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

PACKAGE = Path(__file__).resolve().parent
PAYLOAD = PACKAGE / 'app'

def verify():
    manifest = json.loads((PACKAGE / 'package-manifest.json').read_text('utf-8'))
    for name, expected in manifest['files'].items():
        path = (PAYLOAD / name).resolve()
        if not path.is_relative_to(PAYLOAD.resolve()): raise RuntimeError('Invalid package path.')
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise RuntimeError('Package verification failed: ' + name + '. Download and extract the ZIP again.')
    return manifest

def refresh_path():
    import winreg
    paths = []
    for hive, key in [(winreg.HKEY_LOCAL_MACHINE, r'SYSTEM\CurrentControlSet\Control\Session Manager\Environment'), (winreg.HKEY_CURRENT_USER, r'Environment')]:
        try:
            with winreg.OpenKey(hive, key) as entry: paths.append(os.path.expandvars(winreg.QueryValueEx(entry, 'Path')[0]))
        except OSError: pass
    paths += [os.environ.get('PATH', ''), str(Path(os.environ['LOCALAPPDATA']) / 'Microsoft/WindowsApps')]
    os.environ['PATH'] = os.pathsep.join(paths)

def run(args):
    result = subprocess.run([str(a) for a in args], check=False)
    if result.returncode: raise RuntimeError('Command did not finish successfully (exit ' + str(result.returncode) + '). You can rerun this installer.')

def ps_string(value):
    return "'" + str(value).replace("'", "''") + "'"

def shortcuts(destination, python):
    # These are explicit local paths, quoted as PowerShell literals; no shell interpolation of user input.
    pyw = python.with_name('pythonw.exe')
    target = pyw if pyw.exists() else python
    paths = [Path(os.environ['APPDATA']) / 'Microsoft/Windows/Start Menu/Programs/Local Desk.lnk']
    # Resolve the user's actual Desktop (which may be redirected to OneDrive).
    script = '$w=New-Object -ComObject WScript.Shell; $desk=[Environment]::GetFolderPath("Desktop"); '
    script += '$paths=@(' + ps_string(paths[0]) + '); if($desk){$paths+=Join-Path $desk "Local Desk.lnk"}; '
    script += 'foreach($path in $paths){$s=$w.CreateShortcut($path);$s.TargetPath=' + ps_string(target) + ';'
    script += '$s.Arguments=' + ps_string('"' + str(destination / 'launch.py') + '"') + ';'
    script += '$s.WorkingDirectory=' + ps_string(destination) + ';$s.WindowStyle=7;$s.Description="Open Local Desk on this PC";$s.Save()}'
    subprocess.run(['powershell.exe', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', script], check=True)

def main():
    manifest = verify()
    if '--check-package' in sys.argv:
        print('Package hashes verified:', len(manifest['files']), 'application files. No installation performed.')
        return
    if os.name != 'nt' or sys.getwindowsversion().build < 26100:
        raise RuntimeError('Local Desk requires Windows 11 24H2 or newer (build 26100+).')
    destination = Path(os.environ['LOCALAPPDATA']) / 'LocalDesk'
    if shutil.disk_usage(destination.parent).free < 6 * 1024**3:
        raise RuntimeError('Please free at least 6 GB for dependencies and starter models.')
    print('\nLocal Desk installs in:', destination)
    print('Python is already available. Foundry Local will be installed if missing.')
    print('Starter downloads: Qwen 2.5 1.5B and Whisper Base; size depends on hardware.')
    print('Images/video and cloud CLI accounts require separate setup. No accounts or keys are bundled.')
    if input('Install Local Desk and download starter models? [y/N] ').strip().lower() != 'y':
        print('Cancelled.'); return
    refresh_path()
    if not shutil.which('foundry'):
        winget = shutil.which('winget')
        if not winget: raise RuntimeError('Install Windows App Installer (winget) from Microsoft Store, then rerun setup.')
        print('\nInstalling Microsoft Foundry Local. Review any package agreement or Windows prompt.')
        run([winget, 'install', '--id', 'Microsoft.FoundryLocal', '--exact', '--source', 'winget'])
        refresh_path()
    foundry = shutil.which('foundry')
    if not foundry: raise RuntimeError('Foundry was installed but is not on PATH. Close setup and run it again in a new session.')
    # Copy only manifest-listed app files; never delete or replace existing data/models/provider settings.
    destination.mkdir(parents=True, exist_ok=True)
    for name in manifest['files']:
        target = destination / name
        if name == 'assistant-providers.json' and target.exists(): continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(PAYLOAD / name, target)
    python = Path(sys.executable).resolve()
    pyw = python.with_name('pythonw.exe')
    runner = pyw if pyw.exists() else python
    (destination / 'Start Local Desk.cmd').write_text('@echo off\r\ncd /d "%~dp0"\r\nstart "" "' + str(runner) + '" "%~dp0launch.py"\r\n', encoding='utf-8')
    (destination / 'runtime').mkdir(exist_ok=True)
    shortcuts(destination, python)
    print('\nDownloading starter models. Keep this window open; first-time runtime downloads may take several minutes.')
    try:
        run([foundry, 'server', 'start'])
        run([foundry, 'model', 'download', 'qwen2.5-1.5b'])
        run([foundry, 'model', 'download', 'whisper-base'])
    except RuntimeError:
        print('\nThe app and shortcuts are installed, but starter model setup is incomplete.')
        print('Check the error above and rerun this installer to resume. Existing data is preserved.')
        raise
    print('\nInstalled. Open Local Desk from the Desktop or Start menu.')
    subprocess.Popen([str(runner), str(destination / 'launch.py')], cwd=destination, creationflags=0x08000000)

if __name__ == '__main__':
    try: main()
    except Exception as error:
        print('\nSETUP STOPPED:', error)
        sys.exit(1)
