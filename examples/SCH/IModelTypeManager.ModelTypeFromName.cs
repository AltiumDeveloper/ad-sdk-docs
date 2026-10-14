// Show the description of a model type found by its name
using SCH;

static partial class Examples
{
    static void Example_IModelTypeManager_ModelTypeFromName()
    {
        // <example>
        IModelTypeManager aModelTypeManager = EDP.Utils.LoadModelTypeManager();
        if (aModelTypeManager == null)
            return;
        //IModelType aModelType = aModelTypeManager.ModelTypeFromName("PCBLIB");
        //IModelType aModelType = aModelTypeManager.ModelTypeFromName("PCB3DLib");
        //IModelType aModelType = aModelTypeManager.ModelTypeFromName("SI");
        IModelType aModelType = aModelTypeManager.ModelTypeFromName("SIM");
        if (aModelType != null)
            DXP.Utils.ShowMessage(aModelType.Description());
        // </example>
    }
}
