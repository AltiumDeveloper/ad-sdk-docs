// Show the description of the model type of the simulation server
using SCH;

static partial class Examples
{
    static void Example_IModelTypeManager_ModelTypeFromServerName()
    {
        // <example>
        IModelTypeManager modelTypeMan = EDP.Utils.LoadModelTypeManager();
        if (modelTypeMan == null)
            return;
        IModelType modelType = modelTypeMan.ModelTypeFromServerName("SIM");
        DXP.Utils.ShowMessage(modelType.Description());
        // </example>
    }
}
