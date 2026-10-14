// Show the name of the first model of the first component in a library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_GetModelName()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        string libraryPath = "<path of an .IntLib file>";
        DXP.Utils.ShowMessage(intMan.GetModelName(libraryPath, 0, 0));
        // </example>
    }
}
