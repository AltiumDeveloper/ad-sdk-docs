// List the library and data file paths of the simulation models of the components on the current schematic sheet
using System.Collections.Generic;
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_FindDatafileEntityDatafilePath()
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
                    if (schImplementation.GetState_DatafileLinkCount() > 0)
                    {
                        // Assumption: use the first data file link for the simulation model since we
                        // normally only use one sim model per component.
                        ISch_ModelDatafileLink modelDataFile = schImplementation.GetState_SchDatafileLink(0);
                        string sourceLibraryPath = integratedLibraryManager.FindDatafileEntitySourceLibraryPath(modelDataFile.GetState_LibIdentifierKind(),
                            modelDataFile.GetState_LibraryIdentifier(), modelDataFile.GetState_EntityName(), modelDataFile.GetState_FileKind());
                        string libraryPath = integratedLibraryManager.FindDatafileEntityLibraryPath(modelDataFile.GetState_LibIdentifierKind(),
                            modelDataFile.GetState_LibraryIdentifier(), modelDataFile.GetState_EntityName(), modelDataFile.GetState_FileKind());
                        string sourceDatafilePath = integratedLibraryManager.FindDatafileEntitySourceDatafilePath(modelDataFile.GetState_LibIdentifierKind(),
                            modelDataFile.GetState_LibraryIdentifier(), modelDataFile.GetState_EntityName(), modelDataFile.GetState_FileKind(), true);
                        string datafilePath = integratedLibraryManager.FindDatafileEntityDatafilePath(modelDataFile.GetState_LibIdentifierKind(),
                            modelDataFile.GetState_LibraryIdentifier(), modelDataFile.GetState_EntityName(), modelDataFile.GetState_FileKind(), true);
                        modelsList.Add(" Model : DatafilelinkCount > 0");
                        modelsList.Add(" Source Library path: " + sourceLibraryPath);
                        modelsList.Add(" Library path: " + libraryPath);
                        modelsList.Add(" Source datafile path: " + sourceDatafilePath);
                        modelsList.Add(" Datafile path: " + datafilePath);
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
