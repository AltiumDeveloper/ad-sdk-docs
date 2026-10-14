// Show the name of the first model type
using SCH;

static partial class Examples
{
    static void Example_IModelTypeManager_ModelTypeAt()
    {
        // <example>
        IModelTypeManager modelTypeMan = EDP.Utils.LoadModelTypeManager();
        if (modelTypeMan == null)
            return;
        DXP.Utils.ShowMessage(modelTypeMan.ModelTypeAt(0).Name());
        // </example>
    }
}
