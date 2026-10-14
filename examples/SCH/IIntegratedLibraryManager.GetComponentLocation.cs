// Show where a component of an integrated library is found
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_GetComponentLocation()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        // Placeholders: the library file name and the component name.
        string libraryName = "<library file name>.IntLib";
        string componentName = "<component name>";

        string foundLocation = "";
        intMan.GetComponentLocation(libraryName, componentName, ref foundLocation);
        DXP.Utils.ShowMessage(foundLocation
            + "\r"
            + "for "
            + componentName);
        // </example>
    }
}
