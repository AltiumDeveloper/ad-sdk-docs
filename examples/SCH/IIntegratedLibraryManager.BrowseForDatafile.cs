// Let the user browse for a footprint in an integrated library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_BrowseForDatafile()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        // Placeholders: the library and the footprint to start from.
        string libraryPath = "<path of an .IntLib file>";
        string modelType = "PCBLIB";
        string aFootprintName = "<footprint name>";

        intMan.BrowseForDatafile(ref aFootprintName, ref libraryPath, ref libraryPath, ref modelType, true);
        // </example>
    }
}
