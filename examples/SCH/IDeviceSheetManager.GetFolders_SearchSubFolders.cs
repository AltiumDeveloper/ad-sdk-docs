// Check whether the sub folders of the first device sheet folder are searched
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_GetFolders_SearchSubFolders()
    {
        // <example>
        IDeviceSheetManager deviceSheetMan = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetMan == null)
            return;
        bool result = deviceSheetMan.GetFolders_SearchSubFolders(0);
        if (result)
            DXP.Utils.ShowMessage(deviceSheetMan.GetFolders_FolderPath(0) + " has its sub folders");
        // </example>
    }
}
