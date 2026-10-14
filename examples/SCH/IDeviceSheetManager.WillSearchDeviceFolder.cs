// Add the folder of a device sheet to the device sheet folders unless it is searched already
using System.IO;
using SCH;

static partial class Examples
{
    static void Example_IDeviceSheetManager_WillSearchDeviceFolder()
    {
        // <example>
        IDeviceSheetManager deviceSheetManager = EDP.Utils.GetDeviceSheetManager();
        if (deviceSheetManager == null)
            return;
        string aSheetPath = "<device sheet path>";

        if (!deviceSheetManager.WillSearchDeviceFolder(Path.GetDirectoryName(aSheetPath)))
            deviceSheetManager.AddDeviceFolder(Path.GetDirectoryName(aSheetPath), false);
        // </example>
    }
}
