// Report the net, type, size and segments of every polygon on the current board
using System.Collections.Generic;
using System.IO;
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Polygon()
    {
        // <example>
        // Retrieve the current board.
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Search for polygons and, for each polygon found, collect
        // its attributes in a list to be saved as a text file.
        IPCB_BoardIterator iterator = board.BoardIterator_Create();
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.ePolyObject });
        iterator.AddFilter_AllLayers();
        iterator.AddFilter_Method(TIterationMethod.eProcessAll);

        int polyNo = 0;
        var polygonReport = new List<string>();
        var polygon = iterator.FirstPCBObject() as IPCB_Polygon;
        while (polygon != null)
        {
            polyNo++;
            polygonReport.Add("Polygon No : " + polyNo);
            // Check that the net exists before getting its name.
            if (polygon.GetState_Net() != null)
                polygonReport.Add(" Polygon Net : " + polygon.GetState_Net().GetState_Name());
            if (polygon.GetState_PolygonType() == TPolygonType.eSignalLayerPolygon)
                polygonReport.Add(" Polygon type : " + "Polygon on Signal Layer");
            else
                polygonReport.Add(" Polygon type : " + "Split plane polygon");
            polygonReport.Add(" Polygon BorderWidth : " + polygon.GetState_BorderWidth());
            polygonReport.Add(" Area size : " + polygon.GetState_AreaSize());

            // Segments of the polygon.
            for (int i = 0; i <= polygon.GetState_PointCount() - 1; i++)
            {
                PolySegment segment = polygon.GetState_Segments(i);
                if (segment.Kind == TPolySegmentType.ePolySegmentLine)
                {
                    polygonReport.Add(" Polygon Segment Line at X: " + segment.Vx);
                    polygonReport.Add(" Polygon Segment Line at Y: " + segment.Vy);
                }
                else
                {
                    polygonReport.Add(" Polygon Segment Arc 1 : " + segment.Angle1);
                    polygonReport.Add(" Polygon Segment Arc 2 : " + segment.Angle2);
                    polygonReport.Add(" Polygon Segment Radius : " + segment.Radius);
                }
            }
            polygonReport.Add("");
            polygon = iterator.NextPCBObject() as IPCB_Polygon;
        }
        board.BoardIterator_Destroy(ref iterator);

        // Save the polygon data as a text file next to the board file.
        string fileName = Path.ChangeExtension(board.GetState_FileName(), ".pol");
        File.WriteAllLines(fileName, polygonReport);

        // Display the polygons report.
        IClient client = DXP.GlobalVars.Client;
        IServerDocument document = client.OpenDocument("Text", fileName);
        if (document != null)
            client.ShowDocument(document);
        // </example>
    }
}
