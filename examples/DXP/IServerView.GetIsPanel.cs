// Show the file name of the current document when its view is not a panel
using DXP;

static partial class Examples
{
    static void Example_IServerView_GetIsPanel()
    {
        // <example>
        IServerDocument serverDocument = DXP.GlobalVars.Client.GetCurrentView()?.GetOwnerDocument();
        if (serverDocument == null)
            return;

        IServerDocumentView serverDocumentView = serverDocument.GetView(0);
        if (!serverDocumentView.GetIsPanel())
            DXP.Utils.ShowMessage("Document Name " + serverDocument.GetFileName());
        // </example>
    }
}
