// Count the top overlay tracks of the first components on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_GroupIterator()
    {
        // <example>
        int trackCount = 0;
        int componentCount = 0;
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create a board iterator to fetch the components.
        IPCB_BoardIterator componentIterator = board.BoardIterator_Create();
        componentIterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eComponentObject });
        componentIterator.AddFilter_AllLayers();
        componentIterator.AddFilter_Method(TIterationMethod.eProcessAll);

        var component = componentIterator.FirstPCBObject() as IPCB_Component;
        while (component != null)
        {
            // Create an iterator from the component to fetch its child tracks.
            IPCB_GroupIterator trackIterator = component.GroupIterator_Create();
            trackIterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eTrackObject });
            trackIterator.AddFilter_LayerSet(new TV6_LayerSet { TV6_Layer.eV6_TopOverlay });
            for (IPCB_Primitive track = trackIterator.FirstPCBObject(); track != null; track = trackIterator.NextPCBObject())
                trackCount++;

            DXP.Utils.ShowInfo("This component " + component.GetState_SourceDesignator() + " has " + trackCount + " tracks.", "Tracks");
            trackCount = 0;

            // When finished iterating the component's child objects, destroy its group iterator.
            component.GroupIterator_Destroy(ref trackIterator);
            component = componentIterator.NextPCBObject() as IPCB_Component;
            componentCount++;
            if (componentCount > 5)
                break;
        }

        // When finished iterating the board, destroy the board iterator.
        board.BoardIterator_Destroy(ref componentIterator);
        // </example>
    }
}
