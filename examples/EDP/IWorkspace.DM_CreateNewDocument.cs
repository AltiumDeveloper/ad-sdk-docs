// Create a new PCB document
using DXP;
using EDP;

static partial class Examples
{
    static void Example_IWorkspace_DM_CreateNewDocument()
    {
        // <example>
        var workspace = DXP.GlobalVars.Client.GetDXPWorkspace() as IWorkspace;
        if (workspace == null)
            return;
        workspace.DM_CreateNewDocument("PCB");
        // </example>
    }
}
