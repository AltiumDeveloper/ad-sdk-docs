// Check whether the first component of a library has a footprint model
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_ComponentHasModelOfType()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        string libraryPath = "<library path>";

        int componentIndex = 0;
        bool status = intMan.ComponentHasModelOfType(libraryPath, componentIndex, "PCBLIB");
        if (status)
            DXP.Utils.ShowMessage("True");
        else
            DXP.Utils.ShowMessage("False");
        // </example>
    }
}
