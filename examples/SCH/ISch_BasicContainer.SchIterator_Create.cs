// Collect the names of the sheet entries of every sheet symbol on the current sheet
using SCH;

static partial class Examples
{
    static void Example_ISch_BasicContainer_SchIterator_Create()
    {
        // <example>
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;

        string entriesNames = "";
        ISch_Iterator parentIterator = currentSheet.SchIterator_Create();
        parentIterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eSheetSymbol });
        try
        {
            for (var sheetSymbol = parentIterator.FirstSchObject() as ISch_SheetSymbol; sheetSymbol != null;
                 sheetSymbol = parentIterator.NextSchObject() as ISch_SheetSymbol)
            {
                // Look for sheet entries (child objects) within the sheet symbol.
                ISch_Iterator childIterator = sheetSymbol.SchIterator_Create();
                if (childIterator == null)
                    continue;
                childIterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eSheetEntry });
                try
                {
                    for (var sheetEntry = childIterator.FirstSchObject() as ISch_SheetEntry; sheetEntry != null;
                         sheetEntry = childIterator.NextSchObject() as ISch_SheetEntry)
                    {
                        entriesNames = sheetEntry.GetState_Name() + "\r" + entriesNames;
                    }
                }
                finally
                {
                    sheetSymbol.SchIterator_Destroy(ref childIterator);
                }
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref parentIterator);
        }
        // </example>
    }
}
