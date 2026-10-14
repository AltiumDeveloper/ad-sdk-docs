// Show the name, description and design rule of every violation on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Violation_Rule()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        // Create an iterator that looks for violation objects only.
        IPCB_BoardIterator iterator = board.BoardIterator_Create();
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eViolationObject });
        iterator.AddFilter_AllLayers();
        iterator.AddFilter_Method(TIterationMethod.eProcessAll);

        // Search for violations.
        var violation = iterator.FirstPCBObject() as IPCB_Violation;
        while (violation != null)
        {
            string s = "Violation Name: " + violation.GetState_Name() + "\r\n" +
                       "Description: " + violation.GetState_Description();
            // Get the design rule associated with the current violation.
            var rule = violation.GetState_Rule() as IPCB_Rule;
            if (rule != null)
                DXP.Utils.ShowInfo(s + "\r\n" + " Rule Name: " + rule.GetState_Name(), "Violation");
            s = "";
            violation = iterator.NextPCBObject() as IPCB_Violation;
        }
        board.BoardIterator_Destroy(ref iterator);
        // </example>
    }
}
