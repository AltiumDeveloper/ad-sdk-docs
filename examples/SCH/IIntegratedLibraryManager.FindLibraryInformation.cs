// Find the path of the library that holds a component
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_FindLibraryInformation()
    {
        // <example>
        IIntegratedLibraryManager integratedLibraryManager = EDP.Utils.LoadIntegratedLibraryManager();
        if (integratedLibraryManager == null)
            return;
        // Placeholders: the library identifier and the design item ID of the component.
        string aLibraryIdentifier = "<library identifier>";
        string aDesignItemID = "<design item ID>";

        string path, dbTableName;
        if (!integratedLibraryManager.FindLibraryInformation(EDP.TLibIdentifierKind.eLibIdentifierKind_NameWithType, aLibraryIdentifier,
                aDesignItemID, out path, out dbTableName))
            path = "";
        // </example>
    }
}
