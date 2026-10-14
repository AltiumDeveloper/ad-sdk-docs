// Add a new footprint to the current PCB library and make it the current one
using PCB;

static partial class Examples
{
    static void Example_IPCB_Library_RegisterComponent()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        if (pcbServer == null)
            return;
        IPCB_Library currentLib = pcbServer.GetCurrentPCBLibrary();
        if (currentLib == null)
            return;
        IPCB_LibComponent newPCBLibComp = pcbServer.CreatePCBLibComp();
        newPCBLibComp.SetState_Pattern("ANewComponent");
        currentLib.RegisterComponent(newPCBLibComp);
        currentLib.SetState_CurrentComponent(newPCBLibComp);
        // </example>
    }
}
