// Report which mechanical layers of the current board are enabled, displayed and used
using PCB;

static partial class Examples
{
    static void Example_IPCB_LayerObject_UsedByPrims()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;
        IPCB_LayerStack ls = board.GetState_LayerStack();
        if (ls == null)
            return;
        string s = "";
        for (TV6_Layer layer = TV6_Layer.eV6_Mechanical1; layer <= TV6_Layer.eV6_Mechanical16; layer++)
        {
            var lObject = ls.LayerObject(layer) as IPCB_MechanicalLayer;
            if (lObject == null)
                continue;
            // If a mechanical layer is not enabled (as per the Board Layers and
            // Colors dialog) then this layer cannot be displayed nor have any objects on it.
            if (!lObject.GetState_MechLayerEnabled())
                s = s + lObject.GetState_LayerName() + " is NOT enabled (thus it cannot be displayed nor have any objects on it)." + "\r";
            else
            {
                bool isDisplayed = board.GetState_LayerIsDisplayed(lObject.V7_LayerID());
                if (isDisplayed && lObject.GetState_UsedByPrims())
                    s = s + lObject.GetState_LayerName() + " is displayed and there are objects on it." + "\r";
                if (isDisplayed && !lObject.GetState_UsedByPrims())
                    s = s + lObject.GetState_LayerName() + " is displayed and there are NO objects on it." + "\r";
                if (!isDisplayed && lObject.GetState_UsedByPrims())
                    s = s + lObject.GetState_LayerName() + " is NOT displayed and there are objects on it." + "\r";
                if (!isDisplayed && !lObject.GetState_UsedByPrims())
                    s = s + lObject.GetState_LayerName() + " is NOT displayed and there are NO objects on it." + "\r";
            }
        }
        DXP.Utils.ShowMessage(s);
        // </example>
    }
}
