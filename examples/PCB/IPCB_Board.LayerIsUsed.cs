// Check which layers of the current board are used and displayed
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_LayerIsUsed()
    {
        // <example>
        IPCB_Board pcbBoard = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (pcbBoard == null)
            return;
        // Check for each signal layer for used/display setting
        for (TV6_Layer layer = TV6_Layer.eV6_TopLayer; layer <= TV6_Layer.eV6_MultiLayer; layer++)
            if (pcbBoard.GetState_LayerIsUsed(new V7_Layer(layer)))
                if (pcbBoard.GetState_LayerIsDisplayed(new V7_Layer(layer)))
                {
                    // do something
                }
        // </example>
    }
}
