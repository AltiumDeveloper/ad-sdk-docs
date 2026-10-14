// List the component and model library paths of the components on the current schematic sheet
using System.Collections.Generic;
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_FindComponentLibraryPath()
    {
        // <example>
        IIntegratedLibraryManager integratedLibraryManager = EDP.Utils.LoadIntegratedLibraryManager();
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (integratedLibraryManager == null || currentSheet == null)
            return;
        var modelsList = new List<string>();

        ISch_Iterator componentIterator = currentSheet.SchIterator_Create();
        componentIterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eSchComponent });
        try
        {
            for (var component = componentIterator.FirstSchObject() as ISch_Component; component != null; component = componentIterator.NextSchObject() as ISch_Component)
            {
                // For each component found on the schematic, you can iterate for its implementations.
                ISch_Iterator implementationIterator = component.SchIterator_Create();
                implementationIterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eImplementation });
                for (var schImplementation = implementationIterator.FirstSchObject() as ISch_Implementation; schImplementation != null; schImplementation = implementationIterator.NextSchObject() as ISch_Implementation)
                {
                    if (schImplementation.GetState_UseComponentLibrary())
                    {
                        string componentPath = integratedLibraryManager.FindComponentLibraryPath(component.GetState_LibIdentifierKind(),
                            component.GetState_LibraryIdentifier(), component.GetState_DesignItemId());
                        string modelPath = integratedLibraryManager.FindModelLibraryPath(component.GetState_LibIdentifierKind(),
                            component.GetState_LibraryIdentifier(), component.GetState_DesignItemId(),
                            schImplementation.GetState_ModelName(), schImplementation.GetState_ModelType());
                        modelsList.Add(" The Component is in Integrated Library");
                        modelsList.Add(" Component path: " + componentPath);
                        modelsList.Add(" Model path: " + modelPath);
                    }
                }
                component.SchIterator_Destroy(ref implementationIterator);
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref componentIterator);
        }
        // </example>
    }
}
