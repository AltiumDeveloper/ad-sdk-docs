// Remove all ports from the current schematic sheet, with undo support
using DXP;
using SCH;

static partial class Examples
{
    static void Example_ISch_BasicContainer_RemoveSchObject()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document currentSheet = schServer?.GetCurrentSchDocument();
        if (currentSheet == null)
            return;
        IProcessControl processControl = DXP.GlobalVars.Client.GetProcessControl();
        ISch_RobotManager robotManager = schServer.GetState_RobotManager();

        // Initialize the robots in the schematic editor.
        processControl.PreProcess(currentSheet, "");
        // Set up the iterator to look for port objects only.
        ISch_Iterator iterator = currentSheet.SchIterator_Create();
        if (iterator == null)
            return;
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.ePort });
        try
        {
            ISch_BasicContainer port = iterator.FirstSchObject();
            while (port != null)
            {
                ISch_BasicContainer oldPort = port;
                port = iterator.NextSchObject();
                currentSheet.RemoveSchObject(oldPort);
                robotManager.SendMessage(currentSheet, SCHConstant.BroadCast, SCHConstant.SCHMPrimitiveRegistration, oldPort);
            }
        }
        finally
        {
            currentSheet.SchIterator_Destroy(ref iterator);
        }
        // Clean up the robots in the schematic editor.
        processControl.PostProcess(currentSheet, "");
        // </example>
    }
}
