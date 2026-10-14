// List the names of the components in the second available library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_GetComponentName()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        string s = "";
        string availLibPath = intMan.AvailableLibraryPath(1);
        int componentCount = intMan.GetComponentCount(intMan.AvailableLibraryPath(1));
        for (int i = 0; i < componentCount; i++)
            s = s + " " + intMan.GetComponentName(availLibPath, i);
        DXP.Utils.ShowMessage(s);
        // </example>
    }
}
