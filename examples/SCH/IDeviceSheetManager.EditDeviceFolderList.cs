// Open the dialog that edits the list of device sheet folders
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_EditDeviceFolderList()
    {
        // <example>
        IDeviceSheetManager deviceSheetMan = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetMan == null)
            return;
        deviceSheetMan.EditDeviceFolderList();
        // </example>
    }
}
