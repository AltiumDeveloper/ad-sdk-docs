// Show the number of components in the second available library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_GetComponentCount()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        DXP.Utils.ShowMessage(intMan.GetComponentCount(intMan.AvailableLibraryPath(1)).ToString());
        // </example>
    }
}
