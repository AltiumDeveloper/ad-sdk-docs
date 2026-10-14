// Install a footprint library and find a footprint in the installed libraries
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_FindDatafileInStandardLibs()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        intMan.InstallLibrary("<path of a .PcbLib file>");
        bool inIntLib = false;
        string foundLocation = "";
        intMan.FindDatafileInStandardLibs("<footprint name>", "PCBLIB", "", inIntLib, ref foundLocation);
        DXP.Utils.ShowMessage(foundLocation);
        // </example>
    }
}
