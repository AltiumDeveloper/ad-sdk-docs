// Mark the document of the current view as modified
using DXP;

static partial class Examples
{
    static void Example_IServerDocument_Modified()
    {
        // <example>
        IClient client = DXP.GlobalVars.Client;
        if (client == null)
            return;
        // Get the current document view from the client.
        IServerDocumentView view = client.GetCurrentView();
        // Get the server document that owns the view.
        IServerDocument serverDocument = view.GetOwnerDocument();
        // Set the document dirty.
        serverDocument.SetModified(true);
        // </example>
    }
}
