// Show the path of the last device sheet folder
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_GetFolders_FolderPath()
    {
        // <example>
        IDeviceSheetManager deviceSheetMan = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetMan == null)
            return;
        int count = deviceSheetMan.GetFoldersCount();
        DXP.Utils.ShowMessage(deviceSheetMan.GetFolders_FolderPath(count - 1));
        // </example>
    }
}
