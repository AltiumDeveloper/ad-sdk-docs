// Iterate over the junctions and components in an area the user selects
using SCH;

static partial class Examples
{
    static void Example_ISch_Document_ChooseRectangleInteractively()
    {
        // <example>
        ISch_Document currentSheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;

        var rect = new CoordRect();
        if (!currentSheet.ChooseRectangleInteractively(ref rect, "Please select the first corner", "Please select the final corner"))
            return;

        ISch_Iterator spatialIterator = currentSheet.SchIterator_Create();
        if (spatialIterator == null)
            return;
        try
        {
            spatialIterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eJunction, TObjectId.eSchComponent });
            spatialIterator.AddFilter_Area(rect.Left, rect.Bottom, rect.Right, rect.Top);
            for (var graphicalObject = spatialIterator.FirstSchObject() as ISch_GraphicalObject; graphicalObject != null;
                 graphicalObject = spatialIterator.NextSchObject() as ISch_GraphicalObject)
            {
                // Do what you want with the design object.
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref spatialIterator);
        }
        // </example>
    }
}
