// Show the path of the first available library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_AvailableLibraryPath()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        DXP.Utils.ShowMessage(intMan.AvailableLibraryPath(0));
        // </example>
    }
}
