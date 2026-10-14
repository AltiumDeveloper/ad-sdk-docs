// Show the path of a device sheet from its name
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_FindDeviceSheetPath()
    {
        // <example>
        IDeviceSheetManager deviceSheetMan = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetMan == null)
            return;
        DXP.Utils.ShowMessage(deviceSheetMan.FindDeviceSheetPath("<device sheet name>"));
        // </example>
    }
}
