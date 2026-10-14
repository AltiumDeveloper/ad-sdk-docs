// Create a pad with custom pad cache settings on a new PCB document
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Pad()
    {
        // <example>
        // Create a new PCB document.
        var workspace = DXP.GlobalVars.Client.GetDXPWorkspace() as EDP.IWorkspace;
        if (workspace == null)
            return;
        workspace.DM_CreateNewDocument("PCB");
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        if (pcbServer == null)
            return;
        IPCB_Board board = pcbServer.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create a pad object.
        var pad = pcbServer.PCBObjectFactory(TObjectId.ePadObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Pad;
        pad.SetState_XLocation(EDP.Utils.MilsToCoord(3000));
        pad.SetState_YLocation(EDP.Utils.MilsToCoord(3000));

        // Set up a pad cache which has common values.
        V7_PadCache padCache = pad.GetState_Cache();
        padCache.ReliefAirGap = EDP.Utils.MilsToCoord(11);
        padCache.PowerPlaneReliefExpansion = EDP.Utils.MilsToCoord(11);
        padCache.PowerPlaneClearance = EDP.Utils.MilsToCoord(11);
        padCache.ReliefConductorWidth = EDP.Utils.MilsToCoord(11);
        padCache.SolderMaskExpansion = EDP.Utils.MilsToCoord(11);
        padCache.SolderMaskExpansionValid = TCacheState.eCacheManual;
        padCache.PasteMaskExpansion = EDP.Utils.MilsToCoord(11);
        padCache.PasteMaskExpansionValid = TCacheState.eCacheManual;

        // Assign the new pad cache to the pad.
        pad.SetState_Cache(padCache);
        int topLayerWidth = pad.GetState_WidthOnLayer(TV6_Layer.eV6_BottomLayer);
        board.AddPCBObject(pad);

        // Refresh the PCB document.
        string parameters = "";
        DXP.Utils.SetParamterValue(ref parameters, "Action", "All");
        DXP.Utils.RunCommand("PCB:Zoom", parameters);
        // </example>
    }
}
