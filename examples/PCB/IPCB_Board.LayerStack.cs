// List the copper layers in the layer stack of the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_LayerStack()
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
        string ls = "";
        IPCB_LayerObject layerObj = theLayerStack.First(TLayerClassID.eLayerClass_Electrical);
        while (layerObj != null)
        {
            ls = ls + EDP.Utils.LayerToString(new V7_Layer(layerObj.V6_LayerID())) + "\r\n";
            layerObj = theLayerStack.Next(TLayerClassID.eLayerClass_Electrical, layerObj);
        }
        DXP.Utils.ShowInfo("The Layer Stack has :\r\n" + ls, "Layer stack");
        // </example>
    }
}
