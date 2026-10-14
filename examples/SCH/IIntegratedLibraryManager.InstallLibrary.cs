// Install an integrated library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_InstallLibrary()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        intMan.InstallLibrary("<path of an .IntLib file>");
        // </example>
    }
}
