// Report the cross reference of every port on the current schematic sheet
using System.Collections.Generic;
using System.IO;
using DXP;
using SCH;

static partial class Examples
{
    static void ISch_Port_CrossRef()
    {
        // <example>
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;

        var report = new List<string>();
        ISch_Iterator iterator = currentSheet.SchIterator_Create();
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.ePort });
        try
        {
            for (var port = iterator.FirstSchObject() as ISch_Port; port != null; port = iterator.NextSchObject() as ISch_Port)
            {
                if (port.GetState_CrossRef() != "")
                    report.Add("Port:" + port.GetState_Name() + "'s cross reference: " + port.GetState_CrossRef());
                else
                    report.Add("Port:" + port.GetState_Name() + " does not have a cross reference.");
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref iterator);
        }

        string reportPath = Path.Combine(Path.GetTempPath(), "PortReport.txt");
        File.WriteAllLines(reportPath, report);
        IClient client = DXP.GlobalVars.Client;
        IServerDocument reportDocument = client.OpenDocument("Text", reportPath);
        if (reportDocument != null)
            client.ShowDocument(reportDocument);
        // </example>
    }
}
