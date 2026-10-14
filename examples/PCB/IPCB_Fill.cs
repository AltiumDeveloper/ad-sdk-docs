// Create a new PCB document and place a rotated fill on its bottom layer
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Fill()
    {
        // <example>
        // Create a new PCB document.
        IDXPWorkSpace workspace = DXP.GlobalVars.Client.GetDXPWorkspace();
        if (workspace == null)
            return;
        workspace.DM_CreateNewDocument("PCB");
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create a fill object.
        var fill = pcbServer.PCBObjectFactory(TObjectId.eFillObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Fill;
        fill.SetState_X1Location(EDP.Utils.MilsToCoord(2000));
        fill.SetState_Y1Location(EDP.Utils.MilsToCoord(2000));
        fill.SetState_X2Location(EDP.Utils.MilsToCoord(2500));
        fill.SetState_Y2Location(EDP.Utils.MilsToCoord(2500));
        fill.SetState_Layer(TV6_Layer.eV6_BottomLayer);
        fill.SetState_Rotation(45);

        // Add the new fill to the PCB design database.
        board.AddPCBObject(fill);

        // Refresh the PCB document.
        DXP.Utils.RunCommand("PCB:Zoom", "Action=All");
        // </example>
    }
}
