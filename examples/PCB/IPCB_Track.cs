// Create a track on a new PCB document
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Track()
    {
        // <example>
        // Sample values: track coordinates and width in mils, and the track layer.
        double x1 = 1000, y1 = 1000, x2 = 3000, y2 = 1000, width = 10;
        TV6_Layer layer = TV6_Layer.eV6_TopLayer;

        // Create a new PCB document.
        var workspace = DXP.GlobalVars.Client.GetDXPWorkspace() as EDP.IWorkspace;
        if (workspace == null)
            return;
        workspace.DM_CreateNewDocument("PCB");

        // Check whether the new PCB document exists.
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create a track object with dimensions in mils.
        var track = pcbServer.PCBObjectFactory(TObjectId.eTrackObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Track;
        track.SetState_X1(EDP.Utils.MilsToCoord(x1));
        track.SetState_Y1(EDP.Utils.MilsToCoord(y1));
        track.SetState_X2(EDP.Utils.MilsToCoord(x2));
        track.SetState_Y2(EDP.Utils.MilsToCoord(y2));
        track.SetState_Layer(layer);
        track.SetState_Width(EDP.Utils.MilsToCoord(width));

        // Add the new track to the PCB document.
        board.AddPCBObject(track);

        // Refresh the PCB document.
        string parameters = "";
        DXP.Utils.SetParamterValue(ref parameters, "Action", "All");
        DXP.Utils.RunCommand("PCB:Zoom", parameters);
        // </example>
    }
}
