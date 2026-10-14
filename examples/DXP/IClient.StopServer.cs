// Stop the PCB server
using DXP;

static partial class Examples
{
    static void Example_IClient_StopServer()
    {
        // <example>
        // Sample value: whether to unload the server's DLL as well.
        bool unloadDll = false;
        DXP.GlobalVars.Client.StopServer("PCB", unloadDll);
        // </example>
    }
}
