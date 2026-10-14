// Report the components of the current schematic library
using System.Collections.Generic;
using System.IO;
using DXP;
using SCH;

static partial class Examples
{
    static void Example_ISch_ServerInterface_CreateLibCompInfoReader()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        if (schServer == null)
            return;

        ISch_Document currentLib = schServer.GetCurrentSchDocument();
        if (currentLib == null)
            return;
        // Check whether the current document is a schematic library.
        if (currentLib.GetState_ObjectId() != TObjectId.eSchLib)
        {
            DXP.Utils.ShowError("Please open a schematic library.", "Library components");
            return;
        }
        string fileName = currentLib.GetState_DocumentName();

        // Set up the library component reader.
        ILibCompInfoReader reader = schServer.CreateLibCompInfoReader(fileName);
        if (reader == null)
            return;
        reader.ReadAllComponentInfo();

        var report = new List<string> { "Schematic Libraries and Their Components Report", "-----------------------------------------------", "" };
        // Go through each component found by the reader.
        int componentCount = reader.NumComponentInfos();
        for (int j = 0; j < componentCount; j++)
        {
            IComponentInfo info = reader.GetState_ComponentInfo(j);
            report.Add(fileName);
            report.Add(" Name : " + info.GetState_CompName());
            report.Add(" Alias Name : " + info.GetState_AliasName());
            report.Add(" Part Count : " + info.GetState_PartCount());
            report.Add(" Description : " + info.GetState_Description());
            report.Add(" Offset : " + info.GetState_Offset());
            report.Add("");
        }
        schServer.DestroyCompInfoReader(ref reader);

        // Save the report and open it in Altium Designer.
        string reportPath = Path.Combine(Path.GetTempPath(), "SchLibCompReport.txt");
        File.WriteAllLines(reportPath, report);
        IClient client = DXP.GlobalVars.Client;
        IServerDocument document = client?.OpenDocument("Text", reportPath);
        if (document != null)
            client.ShowDocument(document);
        // </example>
    }
}
