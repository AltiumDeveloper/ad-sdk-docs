// Show the properties of the current board and its sheet
using PCB;

static partial class Examples
{
    static void Example_IPCB_Sheet_ShowSheet()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;
        string aShowSheet = board.GetState_PCBSheet().GetState_ShowSheet().ToString();
        string aLockSheet = board.GetState_PCBSheet().GetState_LockSheet().ToString();
        string unit = board.GetState_DisplayUnit() == TUnit.eImperial ? "Imperial (mil)" : "Metric (mm)";
        DXP.Utils.ShowMessage(
            "Window Handle = " + board.GetState_Window() + "\r" +
            "Board Filename =" + board.GetState_FileName() + "\r" +
            "Origin X = " + board.GetState_XOrigin() + "\r" +
            "Origin Y = " + board.GetState_YOrigin() + "\r" +
            "Board Units = " + unit + "\r" +
            "Current layer = " + EDP.Utils.LayerToString(new V7_Layer(board.GetState_CurrentLayer())) + "\r" +
            "Sheet.X = " + board.GetState_PCBSheet().GetState_SheetX() + "\r" +
            "Sheet.Y = " + board.GetState_PCBSheet().GetState_SheetY() + "\r" +
            "Sheet.Height = " + board.GetState_PCBSheet().GetState_SheetHeight() + "\r" +
            "Sheet.Width = " + board.GetState_PCBSheet().GetState_SheetWidth() + "\r" +
            "Sheet is shown = " + aShowSheet + "\r" +
            "Sheet is locked = " + aLockSheet);
        // </example>
    }
}
