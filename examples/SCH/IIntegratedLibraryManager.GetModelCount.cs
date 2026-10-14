// Show the number of models of the first component in a library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_GetModelCount()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        string libraryPath = "<path of an .IntLib file>";
        DXP.Utils.ShowMessage(intMan.GetModelCount(libraryPath, 0).ToString());
        // </example>
    }
}
