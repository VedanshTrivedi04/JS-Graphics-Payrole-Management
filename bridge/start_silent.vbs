Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\atandance record system"
WshShell.Run "node bridge\identix_bridge.js", 0, False
