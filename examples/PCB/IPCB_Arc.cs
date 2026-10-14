// Create a new PCB document and place an arc on its bottom layer
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Arc()
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

        var arc = pcbServer.PCBObjectFactory(TObjectId.eArcObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Arc;
        // The board origin marker must be present on the PCB document
        // to obtain the board's XOrigin and YOrigin values.
        arc.SetState_CenterX(EDP.Utils.MilsToCoord(board.GetState_XOrigin() + 1800));
        arc.SetState_CenterY(EDP.Utils.MilsToCoord(board.GetState_YOrigin() + 1800));
        arc.SetState_Radius(EDP.Utils.MilsToCoord(200));
        arc.SetState_LineWidth(EDP.Utils.MilsToCoord(50));
        arc.SetState_StartAngle(0);
        arc.SetState_EndAngle(270);
        arc.SetState_Layer(TV6_Layer.eV6_BottomLayer);

        // Add the new arc object to the PCB database.
        board.AddPCBObject(arc);

        // Repaint the PCB document.
        DXP.Utils.RunCommand("PCB:Zoom", "Action=All");
        // </example>
    }
}
