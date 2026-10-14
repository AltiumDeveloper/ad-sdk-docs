// Let the user pick pairs of components on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_ChooseLocation()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        int x = 0, y = 0;
        try
        {
            IPCB_Board board = pcbServer.GetCurrentPCBBoard();
            if (board == null)
            {
                DXP.Utils.ShowMessage("The Current Document is not a PCB Document.");
                return;
            }
            IPCB_Primitive comp1, comp2;
            do
            {
                board.ChooseLocation(ref x, ref y, "Choose Component1");
                comp1 = board.GetObjectAtXYAskUserIfAmbiguous(x, y, new PCB.TObjectSet { TObjectId.eComponentObject },
                    PCBConstant.V6AllLayersSet, TEditingAction.eEditAction_Select);
                if (comp1 == null)
                    return;
                board.ChooseLocation(ref x, ref y, "Choose Component2");
                comp2 = board.GetObjectAtXYAskUserIfAmbiguous(x, y, new PCB.TObjectSet { TObjectId.eComponentObject },
                    PCBConstant.V6AllLayersSet, TEditingAction.eEditAction_Select);
                if (comp2 == null)
                    return;
                // do what you want with comp1 and comp2
                // click on the board to exit or RMB
            } while ((comp1 != null) && (comp2 != null));
        }
        finally
        {
            pcbServer.PostProcess();
            DXP.Utils.RunCommand("PCB:Zoom", "Action=Redraw");
        }
        // </example>
    }
}
