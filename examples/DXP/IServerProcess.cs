// Report the processes of a server and their parameters
using System.Collections.Generic;
using System.IO;
using DXP;

static partial class Examples
{
    static void Example_IServerProcess()
    {
        // <example>
        IClient client = DXP.GlobalVars.Client;
        IServerRecord serverRecord = client.GetServerRecord(0);
        var report = new List<string>();

        string s = "";
        int commandCount = serverRecord.GetCommandCount();
        for (int j = 0; j < commandCount; j++)
        {
            IServerProcess serverProcess = serverRecord.GetCommand(j);
            report.Add(" Process #" + (j + 1) + " Name = " +
                serverProcess.GetOriginalId() + " LongSummary = " + serverProcess.GetLongSummary());
            int parameterCount = serverProcess.GetParameterCount();
            for (int k = 0; k < parameterCount; k++)
                s = s + serverProcess.GetParameter(k) + ", ";
            report.Add(" Parameters = " + s);
        }

        string reportPath = Path.Combine(Path.GetTempPath(), "ServerProcesses.txt");
        File.WriteAllLines(reportPath, report);
        IServerDocument reportDocument = client.OpenDocument("Text", reportPath);
        if (reportDocument != null)
            client.ShowDocument(reportDocument);
        // </example>
    }
}
