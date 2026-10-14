// Put a via with custom pad cache settings near the bottom left corner of the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_AddPCBObject()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        // Grab the board interface representing the current PCB document.
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        // If the board interface doesnt exist (no PCB document) then exit.
        if (board == null)
            return;
        // Initialize the systems in the PCB Editor.
        pcbServer.PreProcess();
        IPCB_Sheet sheet = board.GetState_PCBSheet();
        // Create a Via object with the PCBObjectFactory method
        // and then with the new attributes.
        // Note we convert values in Mils to internal coordinates
        // using the MilsToCoord function. All PCB objects locations and sizes
        // have internal coordinate units where 1 mil = 10000 internal units
        var via = pcbServer.PCBObjectFactory(TObjectId.eViaObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Via;
        // obtain the bottom left coordinates of the board outline
        CoordRect br = board.GetState_BoardOutline().BoundingRectangle();
        via.SetState_XLocation(br.Left + EDP.Utils.MilsToCoord(500));
        via.SetState_YLocation(br.Bottom + EDP.Utils.MilsToCoord(500));
        // via.SetState_XLocation(sheet.GetState_SheetX() + EDP.Utils.MilsToCoord(500));
        // via.SetState_YLocation(sheet.GetState_SheetY() + EDP.Utils.MilsToCoord(500));
        via.SetState_Size(EDP.Utils.MilsToCoord(50));
        via.SetState_HoleSize(EDP.Utils.MilsToCoord(20));
        // Assign Via to the Top layer and bottom layer.
        via.SetState_LowLayer(new V7_Layer(TV6_Layer.eV6_TopLayer));
        via.SetState_HighLayer(new V7_Layer(TV6_Layer.eV6_BottomLayer));
        // Set up Cache info for Via
        // which consists mainly solder mask, paste mask and power plane values from design rules
        V7_PadCache padCache = via.GetState_Cache();
        padCache.ReliefAirGap = EDP.Utils.MilsToCoord(11);
        padCache.PowerPlaneReliefExpansion = EDP.Utils.MilsToCoord(11);
        padCache.PowerPlaneClearance = EDP.Utils.MilsToCoord(11);
        padCache.ReliefConductorWidth = EDP.Utils.MilsToCoord(11);
        padCache.SolderMaskExpansion = EDP.Utils.MilsToCoord(11);
        padCache.SolderMaskExpansionValid = TCacheState.eCacheManual;
        padCache.PasteMaskExpansion = EDP.Utils.MilsToCoord(11);
        padCache.PasteMaskExpansionValid = TCacheState.eCacheManual;
        // Assign the new pad cache to the via
        via.SetState_Cache(padCache);
        // Put the new Via object on the board
        board.AddPCBObject(via);
        // Finalize the systems in the PCB Editor.
        pcbServer.PostProcess();
        //Full PCB system update
        board.ViewManager_FullUpdate();
        // Refresh PCB screen
        DXP.Utils.RunCommand("PCB:Zoom", "Action=Redraw");
        // </example>
    }
}
