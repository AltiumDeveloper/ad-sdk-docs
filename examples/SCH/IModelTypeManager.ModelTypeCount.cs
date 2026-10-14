// Show the names of all model types
using SCH;

static partial class Examples
{
    static void Example_IModelTypeManager_ModelTypeCount()
    {
        // <example>
        IModelTypeManager modelTypeMan = EDP.Utils.LoadModelTypeManager();
        if (modelTypeMan == null)
            return;
        for (int i = 0; i < modelTypeMan.ModelTypeCount(); i++)
            DXP.Utils.ShowMessage(modelTypeMan.ModelTypeAt(i).Name());
        // </example>
    }
}
