// Add an embedded object with a name and a description to the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Embedded()
    {
        // <example>
        // Check that a PCB board exists.
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        if (board == null)
        {
            DXP.Utils.ShowWarning("This document is not a PCB document!", "Embedded Object");
            return;
        }

        // Create the embedded object.
        var embeddedObject = pcbServer.PCBObjectFactory(TObjectId.eEmbeddedObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Embedded;
        embeddedObject.SetState_Name("Embedded Object Name");
        embeddedObject.SetState_Description("Embedded object can store many chars.");
        board.AddPCBObject(embeddedObject);
        // </example>
    }
}
