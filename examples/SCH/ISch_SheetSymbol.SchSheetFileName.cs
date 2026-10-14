// Show the file name of every sheet symbol on the current schematic sheet
using SCH;

static partial class Examples
{
    static void Example_ISch_SheetSymbol_SchSheetFileName()
    {
        // <example>
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;
        ISch_Iterator iterator = currentSheet.SchIterator_Create();
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eSheetSymbol });
        try
        {
            for (var sSheet = iterator.FirstSchObject() as ISch_SheetSymbol; sSheet != null; sSheet = iterator.NextSchObject() as ISch_SheetSymbol)
            {
                ISch_SheetFileName sheetFileName = sSheet.GetState_SchSheetFileName();
                if (sheetFileName != null)
                    DXP.Utils.ShowMessage(sheetFileName.GetState_Text());
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref iterator);
        }
        // </example>
    }
}
