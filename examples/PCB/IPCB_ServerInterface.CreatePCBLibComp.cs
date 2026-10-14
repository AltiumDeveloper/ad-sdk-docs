// Create a footprint with one pad in the current PCB library
using PCB;

static partial class Examples
{
    static void Example_IPCB_ServerInterface_CreatePCBLibComp()
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
        pcbServer.PreProcess();
        var newPad = pcbServer.PCBObjectFactory(TObjectId.ePadObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Pad;
        newPad.SetState_XLocation(EDP.Utils.MilsToCoord(0));
        newPad.SetState_YLocation(EDP.Utils.MilsToCoord(0));
        newPad.SetState_TopXSize(EDP.Utils.MilsToCoord(62));
        newPad.SetState_TopYSize(EDP.Utils.MilsToCoord(62));
        newPad.SetState_HoleSize(EDP.Utils.MilsToCoord(28));
        newPad.SetState_Layer(TV6_Layer.eV6_MultiLayer);
        newPad.SetState_Name("1");
        newPCBLibComp.AddPCBObject(newPad);
        pcbServer.PostProcess();
        currentLib.SetState_CurrentComponent(newPCBLibComp);
        currentLib.GetState_Board().ViewManager_FullUpdate();
        // </example>
    }
}
