// Show the width and height of the board outline of the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_BoardOutline()
    {
        // <example>
        IPCB_Board pcbBoard = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (pcbBoard == null)
            return;
        pcbBoard.GetState_BoardOutline().Invalidate();
        pcbBoard.GetState_BoardOutline().Rebuild();
        pcbBoard.GetState_BoardOutline().Validate();
        // The BoundingRectangle method is defined in IPCB_Primitive interface
        CoordRect br = pcbBoard.GetState_BoardOutline().BoundingRectangle();
        DXP.Utils.ShowMessage(
            "Board Outline Width : " + EDP.Utils.CoordUnitToString(br.Right - br.Left, pcbBoard.GetState_DisplayUnit()) + "\r" +
            "Board Outline Height : " + EDP.Utils.CoordUnitToString(br.Top - br.Bottom, pcbBoard.GetState_DisplayUnit()));
        // </example>
    }
}
