// Continue only when the current view is a PCB library
using DXP;

static partial class Examples
{
    static void Example_IServerView_GetViewName()
    {
        // <example>
        IServerDocumentView currentView = DXP.GlobalVars.Client.GetCurrentView();
        if (currentView == null)
            return;
        if (currentView.GetViewName() != "PCBLib".ToUpper())
            return;
        // </example>
    }
}
