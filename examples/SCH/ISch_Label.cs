// Set the location, color, text and font of a new label
using SCH;

static partial class Examples
{
    static void Example_ISch_Label()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document schDoc = schServer?.GetCurrentSchDocument();
        if (schDoc == null)
            return;
        var schLabel = schServer.SchObjectFactory(TObjectId.eLabel, TObjectCreationMode.eCreate_GlobalCopy) as ISch_Label;
        if (schLabel == null)
            return;

        var location = new DXP.Point(new DXP.SPoint { X = EDP.Utils.MilsToCoord(1000), Y = EDP.Utils.MilsToCoord(1000) });
        schLabel.SetState_Location(location);
        schLabel.SetState_Color(12345);
        schLabel.SetState_Text("A new name");
        schLabel.SetState_FontId(schServer.GetState_FontManager().GetFontID(14, 90, false, false, false, false, "Times New Roman"));
        schDoc.RegisterSchObjectInContainer(schLabel);
        // </example>
    }
}
