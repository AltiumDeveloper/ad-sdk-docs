// Open the dialog that adds and removes libraries
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_AddRemoveLibraries()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        intMan.AddRemoveLibraries();
        // </example>
    }
}
