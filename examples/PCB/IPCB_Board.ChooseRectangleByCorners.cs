// Ask the user to choose a rectangle on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_ChooseRectangleByCorners()
    {
        // <example>
        int x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;
        if (!board.ChooseRectangleByCorners("Choose first corner", "Choose final corner", ref x1, ref y1, ref x2, ref y2))
            return;
        // The coordinates from the ChooseRectangleByCorners method
        // can be used for a spatial iterator for example
        // </example>
    }
}
