// Extract the source libraries of every integrated library in a folder
using System;
using System.IO;
using System.Linq;
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_ExtractSources()
    {
        // <example>
        IIntegratedLibraryManager integratedLibraryManager = EDP.Utils.LoadIntegratedLibraryManager();
        if (integratedLibraryManager == null)
            return;
        // Placeholder: the folder that contains the .IntLib files.
        string sourceFolder = "<folder containing IntLib files>";

        if (Directory.Exists(sourceFolder))
        {
            string[] filesList = Directory.GetFiles(sourceFolder, "*.IntLib")
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
                .ToArray();
            for (int i = 0; i < filesList.Length; i++)
                integratedLibraryManager.ExtractSources(filesList[i]);
        }
        // </example>
    }
}
