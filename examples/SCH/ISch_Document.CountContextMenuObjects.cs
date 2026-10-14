// Check whether the context menu objects of the current schematic document include components
using SCH;

static partial class Examples
{
    static void Example_ISch_Document_CountContextMenuObjects()
    {
        // <example>
        ISch_Document schDoc = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        bool visible = (schDoc != null) && (schDoc.CountContextMenuObjects(new SCH.TObjectSet { TObjectId.eSchComponent }) > 0);
        // </example>
    }
}
