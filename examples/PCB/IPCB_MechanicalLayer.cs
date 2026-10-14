// Show whether each mechanical layer of the current board is linked, enabled and displayed in single layer mode
using PCB;

static partial class Examples
{
    static void Example_IPCB_MechanicalLayer()
    {
        // <example>
        IPCB_Board pcbBoard = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (pcbBoard == null)
            return;
        // Note that the Layer stack only stores existing copper based layers.
        // But you can use the LayerObject method to fetch all layers.
        IPCB_LayerStack theLayerStack = pcbBoard.GetState_LayerStack();
        if (theLayerStack == null)
            return;
        for (TV6_Layer layer = TV6_Layer.eV6_Mechanical1; layer <= TV6_Layer.eV6_Mechanical16; layer++)
        {
            var layerObj = theLayerStack.LayerObject(layer) as IPCB_MechanicalLayer;
            if (layerObj == null)
                continue;
            DXP.Utils.ShowMessage(EDP.Utils.LayerToString(new V7_Layer(layer)) + "\r" +
                " linked " + layerObj.GetState_LinkToSheet() + "\r" +
                " enabled " + layerObj.GetState_MechLayerEnabled() + "\r" +
                " displayed in single layer mode " + layerObj.GetState_DisplayInSingleLayerMode() + "\r");
        }
        // </example>
    }
}
