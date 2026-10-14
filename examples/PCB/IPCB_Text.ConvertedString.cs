// Show the converted value of every .Layer_Name special string on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Text_ConvertedString()
    {
        // <example>
        // Retrieve the current board.
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create the iterator.
        IPCB_BoardIterator iterator = board.BoardIterator_Create();
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eTextObject });
        iterator.AddFilter_AllLayers();
        iterator.AddFilter_Method(TIterationMethod.eProcessAll);

        // Search for special strings.
        var specialString = iterator.FirstPCBObject() as IPCB_Text;
        while (specialString != null)
        {
            if (specialString.GetState_Text() == ".Layer_Name")
                DXP.Utils.ShowInfo(specialString.GetState_ConvertedString(), "Special String");
            specialString = iterator.NextPCBObject() as IPCB_Text;
        }
        board.BoardIterator_Destroy(ref iterator);
        // </example>
    }
}
