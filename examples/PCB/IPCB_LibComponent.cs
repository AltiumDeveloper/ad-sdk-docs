// Write the name, height and description of every footprint in the current PCB library to a CSV report
using System.Collections.Generic;
using System.IO;
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_LibComponent()
    {
        // <example>
        IPCB_Library currentLib = PCB.GlobalVars.PCBServer?.GetCurrentPCBLibrary();
        if (currentLib == null)
            return;

        string fileName = Path.Combine(Path.GetDirectoryName(currentLib.GetState_Board().GetState_FileName()), "PCBLib_Report.csv");
        string s = "";
        var footprintList = new List<string>();
        IPCB_LibraryIterator footprintIterator = currentLib.LibraryIterator_Create();
        footprintIterator.SetState_FilterAll();
        try
        {
            var footprint = footprintIterator.FirstPCBObject() as IPCB_LibComponent;
            while (footprint != null)
            {
                // The height is reported in mils when the display unit is metric,
                // and in millimeters otherwise.
                if (currentLib.GetState_Board().GetState_DisplayUnit() == TUnit.eMetric)
                    s = footprint.GetState_Pattern()
                        + ","
                        + EDP.Utils.CoordToMils(footprint.GetState_Height())
                        + ","
                        + footprint.GetState_Description();
                else
                    s = footprint.GetState_Pattern()
                        + ","
                        + EDP.Utils.CoordToMMs(footprint.GetState_Height())
                        + ","
                        + footprint.GetState_Description();
                footprintList.Add(s);
                footprint = footprintIterator.NextPCBObject() as IPCB_LibComponent;
            }
        }
        finally
        {
            currentLib.LibraryIterator_Destroy(ref footprintIterator);
            File.WriteAllLines(fileName, footprintList);
        }

        // Display the saved report.
        IClient client = DXP.GlobalVars.Client;
        IServerDocument reportDocument = client.OpenDocument("Text", fileName);
        if (reportDocument != null)
            client.ShowDocument(reportDocument);
        // </example>
    }
}
