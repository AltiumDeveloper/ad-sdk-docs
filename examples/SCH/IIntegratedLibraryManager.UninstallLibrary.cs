// Uninstall an integrated library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_UninstallLibrary()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        intMan.UninstallLibrary("<path of an .IntLib file>");
        // </example>
    }
}
