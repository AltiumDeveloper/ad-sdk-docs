// Place a port on the current schematic sheet and register it with the robot manager
using DXP;
using SCH;

static partial class Examples
{
    static void Example_ISch_ServerInterface_RobotManager()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document doc = schServer?.GetCurrentSchDocument();
        if (doc == null)
            return;

        var schPort = schServer.SchObjectFactory(TObjectId.ePort, TObjectCreationMode.eCreate_GlobalCopy) as ISch_Port;
        if (schPort == null)
            return;
        schPort.SetState_Location(new DXP.Point(new SPoint { X = EDP.Utils.MilsToCoord(2500), Y = EDP.Utils.MilsToCoord(2500) }));
        schPort.SetState_Style(TPortArrowStyle.ePortRight);
        schPort.SetState_IOType(TPortIO.ePortBidirectional);
        schPort.SetState_Alignment(THorizontalAlign.eHorizontalCentreAlign);
        schPort.SetState_Width(EDP.Utils.MilsToCoord(500));
        schPort.SetState_AreaColor(0);
        schPort.SetState_TextColor(0xFF00FF);
        schPort.SetState_Name("New Port 4");
        // Add a new port object in the existing schematic document.
        doc.RegisterSchObjectInContainer(schPort);
        schServer.GetState_RobotManager().SendMessage(doc, SCHConstant.BroadCast,
            SCHConstant.SCHMPrimitiveRegistration, schPort);
        // </example>
    }
}
