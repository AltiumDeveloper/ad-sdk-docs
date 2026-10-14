// Give a rotated label a font with the same rotation
using SCH;

static partial class Examples
{
    static void Example_ISch_FontManager_GetFontID()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document schDoc = schServer?.GetCurrentSchDocument();
        if (schDoc == null)
            return;
        var aLabel = schServer.SchObjectFactory(TObjectId.eLabel, TObjectCreationMode.eCreate_GlobalCopy) as ISch_Label;
        if (aLabel == null)
            return;

        aLabel.SetState_Orientation(TRotationBy90.eRotate90);
        aLabel.SetState_FontId(schServer.GetState_FontManager().GetFontID(14, 90, false, false, false, false, "Times New Roman"));
        // Note eRotate90 for the Orientation property, and a 90 value as a parameter for the GetFontID method.
        schDoc.RegisterSchObjectInContainer(aLabel);
        // </example>
    }
}
