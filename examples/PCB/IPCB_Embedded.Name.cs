// Show the name and description of every embedded object on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Embedded_Name()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        IPCB_BoardIterator iterator = board.BoardIterator_Create();
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eEmbeddedObject });
        iterator.AddFilter_AllLayers();
        iterator.AddFilter_Method(TIterationMethod.eProcessAll);

        for (var embedded = iterator.FirstPCBObject() as IPCB_Embedded; embedded != null; embedded = iterator.NextPCBObject() as IPCB_Embedded)
        {
            DXP.Utils.ShowInfo("Name : " + embedded.GetState_Name() + "\r\n" +
                "Description : " + embedded.GetState_Description(), "Embedded Object");
        }
        board.BoardIterator_Destroy(ref iterator);
        // </example>
    }
}
