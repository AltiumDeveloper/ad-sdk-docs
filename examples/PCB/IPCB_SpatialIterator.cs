// Select the tracks and arcs on the top and bottom layers within an area
using PCB;

static partial class Examples
{
    static void Example_IPCB_SpatialIterator()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;
        // Sample values: the area to search.
        int x1 = EDP.Utils.MilsToCoord(1000);
        int y1 = EDP.Utils.MilsToCoord(1000);
        int x2 = EDP.Utils.MilsToCoord(3000);
        int y2 = EDP.Utils.MilsToCoord(3000);

        // Top/bottom layers and arc/track objects define
        // the spatial iterator constraints.
        var aSetOfLayers = new TV6_LayerSet { TV6_Layer.eV6_TopLayer, TV6_Layer.eV6_BottomLayer };
        var aSetOfObjects = new PCB.TObjectSet { TObjectId.eArcObject, TObjectId.eTrackObject };
        IPCB_SpatialIterator iterator = board.SpatialIterator_Create();
        iterator.AddFilter_ObjectSet(aSetOfObjects);
        iterator.AddFilter_LayerSet(aSetOfLayers);
        iterator.AddFilter_Area(x1, y1, x2, y2);

        // Iterate over tracks and arcs on the top and bottom layers.
        IPCB_Primitive pcbObject = iterator.FirstPCBObject();
        while (pcbObject != null)
        {
            pcbObject.SetState_Selected(true);
            pcbObject = iterator.NextPCBObject();
        }
        board.SpatialIterator_Destroy(ref iterator);
        // </example>
    }
}
