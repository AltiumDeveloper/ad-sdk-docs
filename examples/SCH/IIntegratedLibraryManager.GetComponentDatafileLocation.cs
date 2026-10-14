// Show where the footprint of a component of an integrated library is found
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_GetComponentDatafileLocation()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        // Placeholders: the library, the component and its footprint.
        string libraryPath = "<path of an .IntLib file>";
        string componentName = "<component name>";
        string footprintName = "<footprint name>";

        string foundLocation = "";
        intMan.GetComponentDatafileLocation(0, footprintName, "PCBLIB", componentName, libraryPath, ref foundLocation);
        DXP.Utils.ShowMessage(foundLocation + " for Component Datafile location");
        // </example>
    }
}
