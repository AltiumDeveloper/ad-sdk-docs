// Let the user click components on the current board until they click elsewhere
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_GetObjectAtXYAskUserIfAmbiguous()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        int x = 0, y = 0;
        pcbServer.PreProcess();
        try
        {
            IPCB_Board board = pcbServer.GetCurrentPCBBoard();
            if (board == null)
            {
                DXP.Utils.ShowMessage("The Current Document is not a PCB Document.");
                return;
            }
            IPCB_Primitive comp1;
            do
            {
                board.ChooseLocation(ref x, ref y, "Choose Component1");
                comp1 = board.GetObjectAtXYAskUserIfAmbiguous(x, y, new PCB.TObjectSet { TObjectId.eComponentObject },
                    PCBConstant.V6AllLayersSet, TEditingAction.eEditAction_Select);
                if (comp1 == null)
                    return;
                // click on the board to exit or RMB
            } while (comp1 != null);
        }
        finally
        {
            pcbServer.PostProcess();
            DXP.Utils.RunCommand("PCB:Zoom", "Action=Redraw");
        }
        // </example>
    }
}
