// Report the vertices of every wire on the current schematic sheet
using System.Collections.Generic;
using System.IO;
using DXP;
using SCH;

static partial class Examples
{
    static void Example_ISch_Wire()
    {
        // <example>
        if (SCH.GlobalVars.SchServer == null)
            return;
        ISch_Document schDoc = SCH.GlobalVars.SchServer.GetCurrentSchDocument();
        if (schDoc == null)
            return;

        // Set up an iterator to look for wire objects only.
        ISch_Iterator iterator = schDoc.SchIterator_Create();
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eWire });
        int wireCount = 0;
        var reportList = new List<string>();
        reportList.Add("Wires' Vertex report:");
        reportList.Add("______________________");
        reportList.Add("");
        try
        {
            var wire = iterator.FirstSchObject() as ISch_Wire;
            while (wire != null)
            {
                wireCount++;
                reportList.Add("Wire #" + wireCount);
                for (int index = 1; index <= wire.GetState_VerticesCount(); index++)
                {
                    DXP.Point location = wire.GetState_Vertex(index);
                    reportList.Add("X: " + location.X + ", Y: " + location.Y);
                }
                reportList.Add("");
                wire = iterator.NextSchObject() as ISch_Wire;
            }
        }
        finally
        {
            schDoc.SchIterator_Destroy(ref iterator);
        }

        string reportPath = Path.Combine(Path.GetTempPath(), "WireVertexReport.txt");
        File.WriteAllLines(reportPath, reportList);
        // Display the report.
        IClient client = DXP.GlobalVars.Client;
        IServerDocument document = client.OpenDocument("Text", reportPath);
        if (document != null)
            client.ShowDocument(document);
        // </example>
    }
}
