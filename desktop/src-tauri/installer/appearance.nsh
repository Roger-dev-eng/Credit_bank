; Visual customization only. Installation/update logic stays in Tauri's template.
SetFont "Segoe UI" 9
!define MUI_BGCOLOR "FFFFFF"
!define MUI_TEXTCOLOR "1A2035"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_INSTFILESPAGE_COLORS "3E5C9A F4F6FB"
!define MUI_WELCOMEPAGE_TITLE "Vamos começar."
!define MUI_WELCOMEPAGE_TEXT "Instale seu espaço de trabalho para administrar clientes, contratos e recebimentos.$\r$\n$\r$\nSeus dados ficam neste computador. O aplicativo funciona offline.$\r$\n$\r$\nContinue para escolher onde instalar."
!define MUI_FINISHPAGE_TITLE "Tudo pronto para começar."
!define MUI_FINISHPAGE_TEXT "O Gestão de Crédito está instalado.$\r$\n$\r$\nAbra o aplicativo para cadastrar seus clientes e organizar suas operações."
!define MUI_FINISHPAGE_LINK_COLOR "3E5C9A"
!define MUI_CUSTOMFUNCTION_GUIINIT CreditoInstallerInit

Function CreditoInstallerInit
  ; Keep the interface focused on the application instead of the installer engine.
  GetDlgItem $0 $HWNDPARENT 1034
  ShowWindow $0 0
FunctionEnd
