// Turn on the watermarks for device sheets and read-only sheets
using SCH;

static partial class Examples
{
    static void Example_ISch_ServerInterface_SchPreferences()
    {
        // <example>
        ISch_Preferences preferences = SCH.GlobalVars.SchServer?.GetState_SchPreferences();
        if (preferences == null)
            return;
        preferences.Set_WatermarkDeviceSheet(true);
        preferences.Set_WatermarkReadOnlySheet(true);
        // </example>
    }
}
