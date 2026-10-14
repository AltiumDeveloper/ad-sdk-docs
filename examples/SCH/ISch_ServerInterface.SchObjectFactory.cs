// Create a port and place it on the current schematic sheet
using DXP;
using SCH;

static partial class Examples
{
    static void ISch_ServerInterface_SchObjectFactory()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        if (schServer == null)
            return;
        ISch_Document document = schServer.GetCurrentSchDocument();
        if (document == null)
            return;

        // Create a new port object.
        var port = schServer.SchObjectFactory(TObjectId.ePort, TObjectCreationMode.eCreate_GlobalCopy) as ISch_Port;
        if (port == null)
            return;

        // Set up the port; it is placed at 500, 500 mils.
        port.SetState_Location(new DXP.Point(new SPoint { X = EDP.Utils.MilsToCoord(500), Y = EDP.Utils.MilsToCoord(500) }));
        port.SetState_Style(TPortArrowStyle.ePortRight);
        port.SetState_IOType(TPortIO.ePortBidirectional);
        port.SetState_Alignment(THorizontalAlign.eHorizontalCentreAlign);
        port.SetState_Width(EDP.Utils.MilsToCoord(1000));
        port.SetState_AreaColor(0);
        port.SetState_TextColor(0xFFFFFF);
        port.SetState_Name("A new port with no net.");

        // Add the port to the document and redraw the sheet.
        document.RegisterSchObjectInContainer(port);
        document.GraphicallyInvalidate();
        // </example>
    }
}
