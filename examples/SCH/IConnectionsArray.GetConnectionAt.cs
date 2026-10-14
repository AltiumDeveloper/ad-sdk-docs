// Show how many objects meet at a wire connection of the current schematic sheet
using SCH;

static partial class Examples
{
    static void Example_IConnectionsArray_GetConnectionAt()
    {
        // <example>
        var currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument() as ISch_Sheet;
        if (currentSheet == null)
            return;
        IConnectionsArray connections = currentSheet.GetState_WireConnections();
        // Sample values: the location to look at.
        var location = new DXP.Point(new DXP.SPoint { X = EDP.Utils.MilsToCoord(1000), Y = EDP.Utils.MilsToCoord(1000) });

        IConnection connection = connections.GetConnectionAt(location);
        if (connection != null)
            DXP.Utils.ShowMessage(connection.GetState_ObjectsCount().ToString());
        // </example>
    }
}
