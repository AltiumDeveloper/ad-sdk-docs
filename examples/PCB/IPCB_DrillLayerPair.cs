// Show the current layer and the drill layer pairs of the current board
using System.Collections.Generic;
using PCB;

static partial class Examples
{
    static void Example_IPCB_DrillLayerPair()
    {
        // <example>
        IPCB_Board pcbBoard = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (pcbBoard == null)
            return;
        // Show the current layer
        DXP.Utils.ShowInfo("Current Layer: " + EDP.Utils.LayerToString(new V7_Layer(pcbBoard.GetState_CurrentLayer())), "Layers");

        var signalLayersAndInternalPlanes = new TV6_LayerSet();
        signalLayersAndInternalPlanes.UnionWith(PCBConstant.V6SignalLayersSet);
        signalLayersAndInternalPlanes.UnionWith(PCBConstant.V6InternalPlanesSet);

        var layerPairs = new List<string>();
        for (int i = 0; i < pcbBoard.GetState_DrillLayerPairsCount(); i++)
        {
            IPCB_DrillLayerPair pcbLayerPair = pcbBoard.GetState_LayerPair(i);
            IPCB_LayerObject lowLayerObj = pcbBoard.GetState_LayerStack().LayerObject(pcbLayerPair.GetState_LowLayer());
            IPCB_LayerObject highLayerObj = pcbBoard.GetState_LayerStack().LayerObject(pcbLayerPair.GetState_HighLayer());
            int lowPos = pcbBoard.LayerPositionInSet(signalLayersAndInternalPlanes, lowLayerObj);
            int highPos = pcbBoard.LayerPositionInSet(signalLayersAndInternalPlanes, highLayerObj);
            if (lowPos <= highPos)
                layerPairs.Add(lowLayerObj.GetState_LayerName() + " - " + highLayerObj.GetState_LayerName());
            else
                layerPairs.Add(highLayerObj.GetState_LayerName() + " - " + lowLayerObj.GetState_LayerName());
        }
        //Display layer pairs.
        string ls = "";
        for (int i = 0; i < layerPairs.Count; i++)
            ls = ls + layerPairs[i] + "\r\n";
        DXP.Utils.ShowInfo("Layer Pairs:\r\n" + ls, "Layers");
        // </example>
    }
}
