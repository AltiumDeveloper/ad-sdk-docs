// Show the properties of the model type of a component model in a library
using SCH;

static partial class Examples
{
    static void Example_IModelType()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        // Placeholder and sample values: the library, the component and its model.
        string libPath = "<library path>";
        int aComponentIndex = 0;
        int aModelIndex = 0;

        IModelType aModelType = intMan.GetModelType(libPath, aComponentIndex, aModelIndex);
        DXP.Utils.ShowMessage(aModelType.Name());
        DXP.Utils.ShowMessage(aModelType.Description());
        DXP.Utils.ShowMessage(aModelType.ServerName());
        DXP.Utils.ShowMessage(aModelType.PortDescriptor());
        DXP.Utils.ShowMessage(aModelType.ViewableDocKind());
        DXP.Utils.ShowMessage(aModelType.Previewable().ToString());
        DXP.Utils.ShowMessage(aModelType.Highlightable().ToString());
        // </example>
    }
}
