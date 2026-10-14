// Read the type text of a harness connector
using SCH;

static partial class Examples
{
    static void Example_ISch_HarnessConnector_SchHarnessConnectorType()
    {
        // <example>
        // harnessConn is a harness connector design object,
        // here the first one found on the current schematic sheet.
        ISch_Document schDoc = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (schDoc == null)
            return;
        ISch_Iterator iterator = schDoc.SchIterator_Create();
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.eHarnessConnector });
        var harnessConn = iterator.FirstSchObject() as ISch_HarnessConnector;
        schDoc.SchIterator_Destroy(ref iterator);
        if (harnessConn == null)
            return;

        ISch_HarnessConnectorType connType = harnessConn.GetState_SchHarnessConnectorType();
        // The Text string for this harness connector.
        string s = connType.GetState_Text();
        // </example>
    }
}
