// Read a Boolean option of a server
using DXP;

static partial class Examples
{
    static void Example_IOptionsReader_ReadBoolean()
    {
        // <example>
        // Placeholders: your server's name, its preferences section, the option and its default value.
        string nameOfServer = "<server name>";
        string nameOfServerPreferences = "<preferences section>";
        string settingName = "<option name>";
        bool defaultValue = false;

        IOptionsReader reader = DXP.GlobalVars.Client.GetOptionsManager().GetOptionsReader(nameOfServer, "");
        if (reader == null)
            return;
        bool aValue = reader.ReadBoolean(nameOfServerPreferences, settingName, defaultValue);
        // </example>
    }
}
