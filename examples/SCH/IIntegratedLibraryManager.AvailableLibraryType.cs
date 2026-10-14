// Show the type of the first available library
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_AvailableLibraryType()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        TLibraryType libType = intMan.AvailableLibraryType(0);
        switch (libType)
        {
            case TLibraryType.eLibIntegrated: DXP.Utils.ShowMessage("Integrated"); break;
            case TLibraryType.eLibSource: DXP.Utils.ShowMessage("Lib Source"); break;
            case TLibraryType.eLibDatafile: DXP.Utils.ShowMessage("Lib data File"); break;
            case TLibraryType.eLibDatabase: DXP.Utils.ShowMessage("Database"); break;
            case TLibraryType.eLibNone: DXP.Utils.ShowMessage("None"); break;
            case TLibraryType.eLibQuery: DXP.Utils.ShowMessage("Query"); break;
            case TLibraryType.eLibDesignItems: DXP.Utils.ShowMessage("Design Items"); break;
        }
        // </example>
    }
}
