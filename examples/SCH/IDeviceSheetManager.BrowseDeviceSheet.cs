// Let the user browse for a device sheet and show its file name
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_BrowseDeviceSheet()
    {
        // <example>
        IDeviceSheetManager deviceSheetMan = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetMan == null)
            return;
        string aFileName = "";
        string aFilePath;
        deviceSheetMan.BrowseDeviceSheet(ref aFileName, out aFilePath);
        DXP.Utils.ShowMessage("Filename " + aFileName);
        // </example>
    }
}
