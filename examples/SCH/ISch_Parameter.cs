// Iterate over the stand-alone parameters of the current schematic sheet
using SCH;

static partial class Examples
{
    static void Example_ISch_Parameter()
    {
        // <example>
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;

        ISch_Iterator iterator = currentSheet.SchIterator_Create();
        // Look for stand-alone parameters only, not the parameters of components.
        iterator.SetState_IterationDepth(TIterationDepth.eIterateFirstLevel);
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eParameter });
        try
        {
            for (var parameter = iterator.FirstSchObject() as ISch_Parameter; parameter != null; parameter = iterator.NextSchObject() as ISch_Parameter)
            {
                // Do what you want with the parameter.
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref iterator);
        }
        // </example>
    }
}
