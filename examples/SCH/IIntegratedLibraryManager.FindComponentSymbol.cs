// Find the symbol library and symbol of every component on the current schematic sheet
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_FindComponentSymbol()
    {
        // <example>
        IIntegratedLibraryManager integratedLibraryManager = EDP.Utils.LoadIntegratedLibraryManager();
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (integratedLibraryManager == null || currentSheet == null)
            return;
        ISch_Iterator iterator = currentSheet.SchIterator_Create();
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eSchComponent });
        try
        {
            for (var aPart = iterator.FirstSchObject() as ISch_Component; aPart != null; aPart = iterator.NextSchObject() as ISch_Component)
            {
                string symbolLibraryPath, symbolReference;
                string newSymbolLibraryPath, newSymbolReference;
                if (integratedLibraryManager.FindComponentSymbol(aPart.GetState_LibIdentifierKind(), aPart.GetState_LibraryIdentifier(),
                        aPart.GetState_DesignItemId(), out symbolLibraryPath, out symbolReference))
                {
                    newSymbolLibraryPath = symbolLibraryPath;
                    newSymbolReference = symbolReference;
                }
                else
                {
                    newSymbolLibraryPath = "";
                    newSymbolReference = "";
                }
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref iterator);
        }
        // </example>
    }
}
