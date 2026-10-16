LOCAL DESK - WINDOWS STARTER INSTALLER

1. Download the ZIP and choose Extract All in Windows Explorer.
2. Open the extracted LocalDesk-Windows folder.
3. Double-click Install Local Desk.cmd and follow the prompts.
4. Open Local Desk from the Desktop or Start menu next time.

Requires Windows 11 24H2 (build 26100+) on ARM64 or x64, Windows App Installer
(winget), internet for setup, and at least 6 GB free for starter dependencies.
Windows/package-manager agreement prompts may appear; review them yourself.
Use your organisation's normal software installation policy. These setup
scripts are source-readable and unsigned, not a signed MSI/Store package.

Setup installs Python 3.13 when it is not in its standard folders, installs
Microsoft Foundry Local if missing, and downloads Qwen 2.5 1.5B and Whisper Base.
The app installs under %LOCALAPPDATA%\LocalDesk; model weights are stored in
Foundry's shared per-user cache. Model sizes vary with the hardware variant.
The Python scripts are standard-library only. The PDF parser, pypdf 6.20.1,
is bundled with its license under app/vendor. The downloaded package contains
no chats, uploaded files, account credentials, API keys or model weights.

The starter supports chat, PDF text extraction/retrieval and Whisper speech.
Large chat models can be added in the app's star panel under Explore & download
local models. The catalog/download feature does not need a cloud account.
Image and video generation need their own sd-cli runtime and model weights;
these multi-GB components are NOT included or installed by this starter.
Availability is shown in the app. Cloud chat requires the relevant CLI and
your own account login. OpenAI auto-detects a separately installed Codex CLI;
Claude/xAI require their own configuration. See app/ASSISTANT.md.

Your chats are saved in your browser. Extracted PDFs and generated media stay
under the installed app's data folder. Cloud-panel messages and model inventory
are sent to your selected cloud provider only when you send a message there.

Rerunning setup overwrites app code but preserves local data, models and an
existing assistant-providers.json. Stop an existing Local Desk server before
updating so the new code is loaded next time you open it. Removing Local Desk
means removing its app folder and shortcuts; uninstall Python/Foundry separately
only if you no longer need them for any application. Do not remove their shared
model cache unless you mean to remove those models for all local applications.

Package integrity: SHA256SUMS.txt beside the download contains the ZIP checksum.
The included package-manifest.json is verified before app files are copied.
These checks detect changed files; they do not provide a publisher signature.
You can inspect the application code inside app/ before installing.

Installation has been checked for package completeness and source integrity;
clean-machine installation across Windows hardware has not been certified.

Official Foundry installation documentation:
https://learn.microsoft.com/en-us/azure/foundry-local/how-to/how-to-use-foundry-local-cli
