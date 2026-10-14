// Create a via with custom pad cache settings on a new PCB document
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Via()
    {
        // <example>
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

        // Create a via object.
        var via = pcbServer.PCBObjectFactory(TObjectId.eViaObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Via;
        via.SetState_XLocation(EDP.Utils.MilsToCoord(2000));
        via.SetState_YLocation(EDP.Utils.MilsToCoord(2000));
        via.SetState_Size(EDP.Utils.MilsToCoord(50));
        via.SetState_HoleSize(EDP.Utils.MilsToCoord(20));
        via.SetState_LowLayer(new V7_Layer(TV6_Layer.eV6_TopLayer));
        via.SetState_HighLayer(new V7_Layer(TV6_Layer.eV6_BottomLayer));

        // Set up a pad cache.
        V7_PadCache viaCache = via.GetState_Cache();
        viaCache.ReliefAirGap = EDP.Utils.MilsToCoord(11);
        viaCache.PowerPlaneReliefExpansion = EDP.Utils.MilsToCoord(11);
        viaCache.PowerPlaneClearance = EDP.Utils.MilsToCoord(11);
        viaCache.ReliefConductorWidth = EDP.Utils.MilsToCoord(11);
        viaCache.SolderMaskExpansion = EDP.Utils.MilsToCoord(11);
        viaCache.SolderMaskExpansionValid = TCacheState.eCacheManual;
        viaCache.PasteMaskExpansion = EDP.Utils.MilsToCoord(11);
        viaCache.PasteMaskExpansionValid = TCacheState.eCacheManual;

        // Assign the new via cache to the via.
        via.SetState_Cache(viaCache);
        board.AddPCBObject(via);

        // Refresh the PCB document.
        string parameters = "";
        DXP.Utils.SetParamterValue(ref parameters, "Action", "All");
        DXP.Utils.RunCommand("PCB:Zoom", parameters);
        // </example>
    }
}
