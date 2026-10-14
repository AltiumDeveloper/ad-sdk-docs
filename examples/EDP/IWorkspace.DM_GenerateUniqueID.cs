// Give every component on the current schematic sheet a new unique ID
using DXP;
using EDP;
using SCH;

static partial class Examples
{
    static void IWorkspace_DM_GenerateUniqueID()
    {
        // <example>
        // The workspace manager generates the unique IDs.
        var workspace = DXP.GlobalVars.Client.GetDXPWorkspace() as IWorkspace;
        if (workspace == null)
            return;
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;

        // Set up an iterator to look for components on the sheet.
        ISch_Iterator iterator = currentSheet.SchIterator_Create();
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { SCH.TObjectId.eSchComponent });
        try
        {
            for (var component = iterator.FirstSchObject() as ISch_Component; component != null; component = iterator.NextSchObject() as ISch_Component)
                component.SetState_UniqueId(workspace.DM_GenerateUniqueID());
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref iterator);
        }
        // </example>
    }
}
