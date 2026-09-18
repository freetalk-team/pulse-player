!macro customInstall
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="Pulse Player" dir=in action=allow program="$INSTDIR\pulse-player.exe" enable=yes profile=private protocol=TCP localport=4321'
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="Pulse Player"'
!macroend
