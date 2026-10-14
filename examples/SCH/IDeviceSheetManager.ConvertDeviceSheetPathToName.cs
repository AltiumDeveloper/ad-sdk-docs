// Show the name of a device sheet from its path
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_ConvertDeviceSheetPathToName()
    {
        // <example>
        IDeviceSheetManager deviceSheetMan = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetMan == null)
            return;
        // Shows the file name of the device sheet without the file extension.
        DXP.Utils.ShowMessage(deviceSheetMan.ConvertDeviceSheetPathToName("<device sheet path>"));
        // </example>
    }
}
