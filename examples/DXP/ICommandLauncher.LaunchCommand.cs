// Move the cursor to the top of the current text document
using System;
using DXP;

static partial class Examples
{
    static void Example_ICommandLauncher_LaunchCommand()
    {
        // <example>
        IServerDocument serverDocument = DXP.GlobalVars.Client.GetCurrentView()?.GetOwnerDocument();
        if (serverDocument == null)
            return;
        IServerModule serverModule = serverDocument.GetServerModule();

        if (string.Equals(serverModule.GetModuleName(), "TextEdit", StringComparison.OrdinalIgnoreCase))
        {
            string parameters = "";
            serverModule.GetCommandLauncher().LaunchCommand("TextEdit:MoveCursorToTopOfDocument",
                ref parameters, serverDocument.GetView(0));
        }
        // </example>
    }
}
