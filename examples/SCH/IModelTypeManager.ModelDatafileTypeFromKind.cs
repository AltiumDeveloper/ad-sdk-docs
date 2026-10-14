// Show the description of the data file type of SI pin model libraries
using SCH;

static partial class Examples
{
    static void Example_IModelTypeManager_ModelDatafileTypeFromKind()
    {
        // <example>
        IModelTypeManager modelTypeMan = EDP.Utils.LoadModelTypeManager();
        if (modelTypeMan == null)
            return;
        DXP.Utils.ShowMessage(modelTypeMan.ModelDatafileTypeFromKind("SIPinModelLibrary").Description());
        // </example>
    }
}
