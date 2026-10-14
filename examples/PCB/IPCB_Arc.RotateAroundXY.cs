// Rotate the first selected arc on the current board about its center
using PCB;

static partial class Examples
{
    static void Example_IPCB_Arc_RotateAroundXY()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null || board.GetState_SelectecObjectCount() == 0)
            return;
        var arc = board.GetState_SelectecObject(0) as IPCB_Arc;
        if (arc == null)
            return;

        //rotate the arc about its original center
        arc.RotateAroundXY(arc.GetState_CenterX(), arc.GetState_CenterY(), 45);
        // </example>
    }
}
