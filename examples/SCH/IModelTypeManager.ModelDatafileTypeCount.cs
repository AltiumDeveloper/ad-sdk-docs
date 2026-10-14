// Show the number of model data file types
using SCH;

static partial class Examples
{
    static void Example_IModelTypeManager_ModelDatafileTypeCount()
    {
        // <example>
        IModelTypeManager modelTypeMan = EDP.Utils.LoadModelTypeManager();
        if (modelTypeMan == null)
            return;
        DXP.Utils.ShowInfo(modelTypeMan.ModelDatafileTypeCount().ToString(), "Model data file types");
        // </example>
    }
}
