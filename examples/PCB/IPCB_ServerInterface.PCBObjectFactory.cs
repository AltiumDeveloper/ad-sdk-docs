// Create a via and put it on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_ServerInterface_PCBObjectFactory()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        if (board == null)
            return;
        // Create a Via object
        var via = pcbServer.PCBObjectFactory(TObjectId.eViaObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Via;
        via.SetState_XLocation(EDP.Utils.MilsToCoord(7500));
        via.SetState_YLocation(EDP.Utils.MilsToCoord(7500));
        via.SetState_Size(EDP.Utils.MilsToCoord(50));
        via.SetState_HoleSize(EDP.Utils.MilsToCoord(20));
        via.SetState_LowLayer(new V7_Layer(TV6_Layer.eV6_TopLayer));
        via.SetState_HighLayer(new V7_Layer(TV6_Layer.eV6_BottomLayer));
        // Put the new Via object in the board object
        board.AddPCBObject(via);
        // Refresh the PCB screen
        DXP.Utils.RunCommand("PCB:Zoom", "Action=Redraw");
        // </example>
    }
}
