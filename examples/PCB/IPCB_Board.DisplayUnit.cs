// Show the file name and the display unit of the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_DisplayUnit()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;
        DXP.Utils.ShowMessage("Board Filename =" + board.GetState_FileName() + "\r" +
                              "Board Units = " + board.GetState_DisplayUnit());
        // </example>
    }
}
