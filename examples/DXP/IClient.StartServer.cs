// Start the PCB server
using DXP;

static partial class Examples
{
    static void Example_IClient_StartServer()
    {
        // <example>
        DXP.GlobalVars.Client.StartServer("PCB");
        // </example>
    }
}
