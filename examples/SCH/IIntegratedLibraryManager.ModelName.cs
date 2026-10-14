// List the footprint models of a component in an integrated library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_ModelName()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        // Placeholders: the library and the component.
        string libraryPath = "<path of an .IntLib file>";
        string componentName = "<component name>";

        int modelCount = intMan.ModelCount(componentName, libraryPath, "PCBLIB");
        DXP.Utils.ShowMessage(componentName + "'s ModelCount : " + modelCount);
        string s = "";
        for (int i = 0; i < modelCount; i++)
            s = s + "\r" + intMan.ModelName(componentName, libraryPath, "PCBLIB", i);
        DXP.Utils.ShowMessage(s);
        // </example>
    }
}
