// Show the number of available libraries
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_AvailableLibraryCount()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        DXP.Utils.ShowMessage(intMan.AvailableLibraryCount().ToString());
        // </example>
    }
}
