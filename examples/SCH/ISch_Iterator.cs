// Count the ports on the current schematic sheet
using SCH;

static partial class Examples
{
    static void Example_ISch_Iterator()
    {
        // <example>
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;
        int portNumber = 0;

        ISch_Iterator iterator = currentSheet.SchIterator_Create();
        if (iterator == null)
            return;
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.ePort });
        try
        {
            ISch_BasicContainer port = iterator.FirstSchObject();
            while (port != null)
            {
                portNumber = portNumber + 1;
                port = iterator.NextSchObject();
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref iterator);
        }
        // </example>
    }
}
