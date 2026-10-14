// Place a resistor from an integrated library on the current schematic sheet
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_PlaceLibraryComponent()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        if (schServer == null)
            return;
        if (schServer.GetCurrentSchDocument() == null)
            return;
        IIntegratedLibraryManager integratedLibraryManager = EDP.Utils.LoadIntegratedLibraryManager();
        if (integratedLibraryManager == null)
            return;
        // Integrated Library object model is used to place a
        // component from the library onto the schematic sheet.
        integratedLibraryManager.PlaceLibraryComponent(
            "Res2",
            "Miscellaneous Devices.IntLib",
            "ModelType=SIM|ModelParameterName0=Value|" +
            "ModelParameterValue0=1K|Orientation=1|Location.X=10000000|Location.Y=20000000");
        // Refresh screen
        schServer.GetCurrentSchDocument().GraphicallyInvalidate();
        // </example>
    }
}
