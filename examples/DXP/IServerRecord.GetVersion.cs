// Find the version of the Client server
using DXP;

static partial class Examples
{
    static void Example_IServerRecord_GetVersion()
    {
        // <example>
        IClient client = DXP.GlobalVars.Client;
        string version = "";
        int recordCount = client.GetServerRecordCount();
        for (int i = 0; i < recordCount; i++)
        {
            IServerRecord serverRecord = client.GetServerRecord(i);
            if (serverRecord.GetName() == "Client")
            {
                version = serverRecord.GetVersion();
                break;
            }
        }
        // </example>
    }
}
