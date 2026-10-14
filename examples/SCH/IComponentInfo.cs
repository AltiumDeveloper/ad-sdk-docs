// List the name, alias, part count, description and offset of each component in a schematic library
using System.Collections.Generic;
using System.IO;
using DXP;
using SCH;

static partial class Examples
{
    static void Example_IComponentInfo()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document currentLib = schServer?.GetCurrentSchDocument();
        if (currentLib == null)
            return;
        string fileName = currentLib.GetState_DocumentName();
        ILibCompInfoReader aLibCompReader = schServer.CreateLibCompInfoReader(fileName);
        aLibCompReader.ReadAllComponentInfo();
        var reportInfo = new List<string>();

        // Obtain the number of components in the specified schematic library.
        int compNum = aLibCompReader.NumComponentInfos();
        // Go through each component obtained by the library component reader.
        for (int j = 0; j < compNum; j++)
        {
            reportInfo.Add(fileName);
            IComponentInfo compInfo = aLibCompReader.GetState_ComponentInfo(j);
            reportInfo.Add(" Name : " + compInfo.GetState_CompName());
            reportInfo.Add(" Alias Name : " + compInfo.GetState_AliasName());
            reportInfo.Add(" Part Count : " + compInfo.GetState_PartCount());
            reportInfo.Add(" Description : " + compInfo.GetState_Description());
            reportInfo.Add(" Offset : " + compInfo.GetState_Offset());
            reportInfo.Add("");
        }

        string reportPath = Path.Combine(Path.GetTempPath(), "SchLibCompReport.txt");
        File.WriteAllLines(reportPath, reportInfo);
        IClient client = DXP.GlobalVars.Client;
        IServerDocument reportDocument = client.OpenDocument("Text", reportPath);
        if (reportDocument != null)
            client.ShowDocument(reportDocument);
        // </example>
    }
}
