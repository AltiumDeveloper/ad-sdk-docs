// Uninstall every installed library and keep a list of their paths
using System.Collections.Generic;
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_InstalledLibraryPath()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        var originalInstalledList = new List<string>();
        for (int i = 0; i < intMan.InstalledLibraryCount(); i++)
            originalInstalledList.Add(intMan.InstalledLibraryPath(i));
        // Uninstall after collecting the paths: uninstalling changes the indexes of the remaining libraries.
        foreach (string path in originalInstalledList)
            intMan.UninstallLibrary(path);
        // do what you want with the originalInstalledList
        // </example>
    }
}
