// Show the number of device sheet folders
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_GetFoldersCount()
    {
        // <example>
        IDeviceSheetManager deviceSheetMan = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetMan == null)
            return;
        int count = deviceSheetMan.GetFoldersCount();
        DXP.Utils.ShowMessage(count.ToString());
        // </example>
    }
}
