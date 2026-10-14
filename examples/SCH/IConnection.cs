// Report the wire connections of the focused schematic document
using System.Collections.Generic;
using System.IO;
using DXP;
using EDP;
using SCH;

static partial class Examples
{
    static void Example_IConnection()
    {
        // <example>
        var ws = DXP.GlobalVars.Client.GetDXPWorkspace() as EDP.IWorkspace;
        if (ws == null)
            return;
        IProject prj = ws.DM_FocusedProject();
        if (prj == null)
            return;
        prj.DM_Compile();
        IDocument doc = ws.DM_FocusedDocument();
        var connectionsList = new List<string>();
        if (doc.DM_DocumentKind() == "SCH")
        {
            var currentSch = SCH.GlobalVars.SchServer.GetSchDocumentByPath(doc.DM_FullPath()) as ISch_Sheet;
            if (currentSch != null)
            {
                IConnectionsArray theWireConnections = currentSch.GetState_WireConnections();
                // Collect data for the wire connections.
                connectionsList.Add("Wire Connections");
                for (int j = 0; j < theWireConnections.GetState_ConnectionsCount(); j++)
                {
                    IConnection wireConnection = theWireConnections.GetState_Connection(j);
                    if (wireConnection != null)
                    {
                        DXP.Point location = wireConnection.GetState_Location();
                        connectionsList.Add("Wire Connection Count: " + wireConnection.GetState_ObjectsCount());
                        connectionsList.Add("Wire Connection Location: " + location.X + ", " + location.Y);
                        connectionsList.Add("Wire Connection has a manual junction: " + wireConnection.GetState_IsManualJunction());
                        connectionsList.Add("Wire Connection size: " + wireConnection.GetState_Size());
                        connectionsList.Add("");
                    }
                }
            }
        }
        string filePath = Path.GetDirectoryName(doc.DM_FullPath());
        string fileName = Path.Combine(filePath, "ConnectionsReport.txt");
        File.WriteAllLines(fileName, connectionsList);
        IClient client = DXP.GlobalVars.Client;
        IServerDocument reportDocument = client.OpenDocument("Text", fileName);
        if (reportDocument != null)
            client.ShowDocument(reportDocument);
        // </example>
    }
}
