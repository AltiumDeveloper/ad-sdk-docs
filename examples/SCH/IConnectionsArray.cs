// Iterate over the bus connections of the current schematic sheet
using SCH;

static partial class Examples
{
    static void Example_IConnectionsArray()
    {
        // <example>
        var currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument() as ISch_Sheet;
        if (currentSheet == null)
            return;
        IConnectionsArray theBusConnections = currentSheet.GetState_BusConnections();

        for (int j = 0; j < theBusConnections.GetState_ConnectionsCount(); j++)
        {
            IConnection busConnection = theBusConnections.GetState_Connection(j);
            if (busConnection != null)
            {
                // Process the bus connection here.
            }
        }
        // </example>
    }
}
