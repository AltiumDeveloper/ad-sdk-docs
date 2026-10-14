// Save two graphic viewer preferences as Boolean options
using DXP;

static partial class Examples
{
    static void Example_IOptionsWriter_WriteBoolean()
    {
        // <example>
        // Placeholders: your server's name, its preferences section and the values to store.
        string serverName = "<server name>";
        string preferencesSection = "<preferences section>";
        bool scaleImage = true;
        bool keepAspectRatio = true;

        IOptionsWriter writer = DXP.GlobalVars.Client.GetOptionsManager().GetOptionsWriter(serverName);
        if (writer == null)
            return;
        writer.WriteBoolean(preferencesSection, "ScaleImage", scaleImage);
        writer.WriteBoolean(preferencesSection, "KeepAspectRatio", keepAspectRatio);
        // </example>
    }
}
