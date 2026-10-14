// Ask the user to click a location on the current schematic sheet
using DXP;
using SCH;

static partial class Examples
{
    static void Example_ISch_Document_ChooseLocationInteractively()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        if (schServer == null)
            return;
        ISch_Document currentSheet = schServer.GetCurrentSchDocument();
        if (currentSheet == null)
            return;
        var location = new DXP.Point(new SPoint());
        // Use the ChooseLocationInteractively method to capture the
        // coordinates of the location clicked on the sheet by the user.
        if (!currentSheet.ChooseLocationInteractively(ref location, "Please select the location"))
            return;
        // </example>
    }
}
