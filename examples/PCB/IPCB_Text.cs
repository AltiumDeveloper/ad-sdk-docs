// Place a text object on the top overlay of a new PCB document
using DXP;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Text()
    {
        // <example>
        // Create a new PCB document.
        var workspace = DXP.GlobalVars.Client.GetDXPWorkspace() as EDP.IWorkspace;
        if (workspace == null)
            return;
        workspace.DM_CreateNewDocument("PCB");
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create a text object on the top overlay layer.
        board.SetState_LayerIsDisplayed(new V7_Layer(TV6_Layer.eV6_TopOverlay), true);
        var textObj = pcbServer.PCBObjectFactory(TObjectId.eTextObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Text;
        textObj.SetState_XLocation(EDP.Utils.MilsToCoord(board.GetState_XOrigin() + 4000));
        textObj.SetState_YLocation(EDP.Utils.MilsToCoord(board.GetState_YOrigin() + 2000));
        textObj.SetState_Layer(TV6_Layer.eV6_TopOverlay);
        textObj.SetState_Text("Text Object");
        textObj.SetState_Size(EDP.Utils.MilsToCoord(90)); // sets the height of the text
        board.AddPCBObject(textObj);
        // </example>
    }
}
