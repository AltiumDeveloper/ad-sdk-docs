// Show the current process depth
using DXP;

static partial class Examples
{
    static void Example_IProcessControl_ProcessDepth()
    {
        // <example>
        DXP.Utils.ShowMessage("Current process depth " + DXP.GlobalVars.Client.GetProcessControl().GetProcessDepth());
        // </example>
    }
}
