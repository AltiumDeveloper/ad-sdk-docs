// List the names of all nets on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Net()
    {
        // <example>
        // Retrieve the current board.
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create an iterator that looks for net objects only.
        IPCB_BoardIterator iterator = board.BoardIterator_Create();
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eNetObject });
        iterator.AddFilter_AllLayers();
        iterator.AddFilter_Method(TIterationMethod.eProcessAll);

        // Collect the names of the nets.
        string ls = "";
        for (var net = iterator.FirstPCBObject() as IPCB_Net; net != null; net = iterator.NextPCBObject() as IPCB_Net)
            ls = ls + net.GetState_Name() + ", ";
        board.BoardIterator_Destroy(ref iterator);

        // Display the net names.
        DXP.Utils.ShowInfo("Nets = " + ls, "Nets");
        // </example>
    }
}
