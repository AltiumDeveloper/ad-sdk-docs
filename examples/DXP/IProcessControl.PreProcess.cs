// Place a new port on the current schematic sheet between PreProcess and PostProcess
using DXP;
using SCH;

static partial class Examples
{
    static void Example_IProcessControl_PreProcess()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document doc = schServer?.GetCurrentSchDocument();
        if (doc == null)
            return;
        IProcessControl processControl = DXP.GlobalVars.Client.GetProcessControl();

        // Initialize the robots in the schematic editor.
        processControl.PreProcess(doc, "");

        // Create a new port and place it on the current schematic document.
        var schPort = schServer.SchObjectFactory(TObjectId.ePort, TObjectCreationMode.eCreate_GlobalCopy) as ISch_Port;
        if (schPort == null)
            return;
        schPort.SetState_Location(new DXP.Point(new SPoint { X = 100, Y = 100 }));
        schPort.SetState_Style(TPortArrowStyle.ePortRight);
        schPort.SetState_IOType(TPortIO.ePortBidirectional);
        schPort.SetState_Alignment(THorizontalAlign.eHorizontalCentreAlign);
        schPort.SetState_Width(100);
        schPort.SetState_AreaColor(0);
        schPort.SetState_TextColor(0xFFFF00);
        schPort.SetState_Name("New Port 1");

        // Add the new port object to the existing schematic document.
        doc.RegisterSchObjectInContainer(schPort);
        schServer.GetState_RobotManager().SendMessage(doc, SCHConstant.BroadCast, SCHConstant.SCHMPrimitiveRegistration, schPort);

        // Clean up the robots in the schematic editor.
        processControl.PostProcess(doc, "");
        // </example>
    }
}
