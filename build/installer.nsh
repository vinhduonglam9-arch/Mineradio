; Mineradio NSIS Installer Script
; Custom installer macros and safety checks

!include "MUI2.nsh"
!include "LogicLib.nsh"

; Default installation directory — prefer D:\Mineradio
!macro customInit
  ${If} ${FileExists} "D:\"
    StrCpy $INSTDIR "D:\Mineradio"
  ${ElseIf} ${FileExists} "E:\"
    StrCpy $INSTDIR "E:\Mineradio"
  ${ElseIf} ${FileExists} "F:\"
    StrCpy $INSTDIR "F:\Mineradio"
  ${Else}
    StrCpy $INSTDIR "$LOCALAPPDATA\Programs\Mineradio"
  ${EndIf}
!macroend

; Ensure the install path ends with a dedicated Mineradio folder
Function .onVerifyInstDir
  ${If} $INSTDIR == ""
    Abort "安装路径不能为空"
  ${EndIf}
FunctionEnd
