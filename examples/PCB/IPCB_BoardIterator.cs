// Count the pads on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_BoardIterator()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Set up a board iterator for pads on all layers.
        IPCB_BoardIterator iterator = board.BoardIterator_Create();
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.ePadObject });
        iterator.AddFilter_AllLayers();
        iterator.AddFilter_Method(TIterationMethod.eProcessAll);

        // Search for and count the pads.
        int padNumber = 0;
        for (IPCB_Primitive pad = iterator.FirstPCBObject(); pad != null; pad = iterator.NextPCBObject())
            padNumber++;
        board.BoardIterator_Destroy(ref iterator);

        DXP.Utils.ShowInfo("Pad Count = " + padNumber, "Pads");
        // </example>
    }
}
