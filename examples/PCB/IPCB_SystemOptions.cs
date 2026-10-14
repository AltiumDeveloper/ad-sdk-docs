// Switch the board cursor to the next cursor shape
using PCB;

static partial class Examples
{
    static void Example_IPCB_SystemOptions()
    {
        // <example>
        IPCB_SystemOptions pcbSystemOptions = PCB.GlobalVars.PCBServer?.GetState_SystemOptions();
        if (pcbSystemOptions == null)
            return;
        if (pcbSystemOptions.GetState_BoardCursorType() == TGraphicsCursor.eCurShapeCross90)
            pcbSystemOptions.SetState_BoardCursorType(TGraphicsCursor.eCurShapeBigCross);
        else if (pcbSystemOptions.GetState_BoardCursorType() == TGraphicsCursor.eCurShapeBigCross)
            pcbSystemOptions.SetState_BoardCursorType(TGraphicsCursor.eCurShapeCross45);
        else
            pcbSystemOptions.SetState_BoardCursorType(TGraphicsCursor.eCurShapeCross90);
        // </example>
    }
}
