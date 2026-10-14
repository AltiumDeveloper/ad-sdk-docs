// Create a schematic library from the components of the current project
using SCH;

static partial class Examples
{
    static void Example_ISch_Document_CreateLibraryFromProject()
    {
        // <example>
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if ((currentSheet == null) || (currentSheet.GetState_ObjectId() == TObjectId.eSchLib))
        {
            DXP.Utils.ShowError("Please run this on a schematic document.", "Create library");
            return;
        }
        currentSheet.CreateLibraryFromProject(true, "NewLibrary.SchLib", false);
        // </example>
    }
}
