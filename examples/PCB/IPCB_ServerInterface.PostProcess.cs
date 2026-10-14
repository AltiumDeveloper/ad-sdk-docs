// Move the first selected fill on the current board to the bottom layer
using PCB;

static partial class Examples
{
    static void Example_IPCB_ServerInterface_PostProcess()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        if (board == null || board.GetState_SelectecObjectCount() == 0)
            return;
        var fill = board.GetState_SelectecObject(0) as IPCB_Fill;
        if (fill == null)
            return;

        pcbServer.PreProcess();
        //Notify PCB that the fill object is going to be changed.
        fill.BeginModify();
        fill.SetState_Layer(TV6_Layer.eV6_BottomLayer);
        //Notify PCB that the fill object has been changed.
        fill.EndModify();
        pcbServer.PostProcess();
        // </example>
    }
}
