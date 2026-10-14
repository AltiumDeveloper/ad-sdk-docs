// Let the user choose another folder for a device sheet path
using System.IO;
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_ChooseDeviceFolder()
    {
        // <example>
        IDeviceSheetManager deviceSheetManager = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetManager == null)
            return;
        string deviceSheetPathText = "<device sheet path>";

        string folderPath = Path.GetDirectoryName(deviceSheetPathText);
        if (deviceSheetManager.ChooseDeviceFolder(ref folderPath))
            deviceSheetPathText = Path.Combine(folderPath, Path.GetFileName(deviceSheetPathText));
        // </example>
    }
}
