$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

python -m pip install -r requirements.txt
python app.py

Read-Host "Press Enter to close"
