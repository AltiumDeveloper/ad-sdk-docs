// Show the properties of every model data file type
using SCH;

static partial class Examples
{
    static void Example_IModelDatafileType()
    {
        // <example>
        IModelTypeManager modelTypeMan = EDP.Utils.LoadModelTypeManager();
        if (modelTypeMan == null)
            return;
        for (int i = 0; i < modelTypeMan.ModelDatafileTypeCount(); i++)
        {
            IModelDatafileType modelDatafileType = modelTypeMan.ModelDatafileTypeAt(i);
            DXP.Utils.ShowMessage(
                modelDatafileType.FileKind() + "\r" +
                modelDatafileType.ExtensionFilter() + "\r" +
                modelDatafileType.Description() + "\r" +
                modelDatafileType.EntityType() + "\r" +
                modelDatafileType.ModelType().Name() + "\r" +
                modelDatafileType.SupportsParameters());
        }
        // </example>
    }
}
