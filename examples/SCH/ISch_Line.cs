// Create a new schematic document and place a line on it
using DXP;
using EDP;
using SCH;

static partial class Examples
{
    static void Example_ISch_Line()
    {
        // <example>
        // Generate a blank schematic document.
        var workspace = DXP.GlobalVars.Client.GetDXPWorkspace() as EDP.IWorkspace;
        if (workspace == null)
            return;
        workspace.DM_CreateNewDocument("SCH");
        // Check if the schematic editor is active.
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        if (schServer == null)
            return;
        ISch_Document schDoc = schServer.GetCurrentSchDocument();
        if (schDoc == null)
            return;
        // Create a new line and place it on the document.
        var schLine = schServer.SchObjectFactory(TObjectId.eLine, TObjectCreationMode.eCreate_GlobalCopy) as ISch_Line;
        if (schLine == null)
            return;
        schLine.SetState_Location(new DXP.Point(new SPoint { X = 180, Y = 200 }));
        schLine.SetState_Corner(new DXP.Point(new SPoint { X = 180, Y = 400 }));
        schLine.SetState_LineWidth(TSize.eMedium);
        schLine.SetState_LineStyle(TLineStyle.eLineStyleSolid);
        schLine.SetState_Color(0xFF00FF);
        schDoc.RegisterSchObjectInContainer(schLine);
        // </example>
    }
}
