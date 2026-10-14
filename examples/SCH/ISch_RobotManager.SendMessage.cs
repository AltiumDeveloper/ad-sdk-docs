// Change the color of the wires on the current sheet, with undo support
using DXP;
using SCH;

static partial class Examples
{
    static void Example_ISch_RobotManager_SendMessage()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document document = schServer?.GetCurrentSchDocument();
        if (document == null)
            return;
        IProcessControl processControl = DXP.GlobalVars.Client.GetProcessControl();
        ISch_RobotManager robotManager = schServer.GetState_RobotManager();

        // Initialize the robots in the schematic editor.
        processControl.PreProcess(document, "");
        ISch_Iterator iterator = document.SchIterator_Create();
        if (iterator == null)
            return;
        iterator.AddFilter_ObjectSet(new SCH.TObjectSet { TObjectId.ePort, TObjectId.eWire });
        try
        {
            for (var anObject = iterator.FirstSchObject() as ISch_GraphicalObject; anObject != null; anObject = iterator.NextSchObject() as ISch_GraphicalObject)
            {
                if (anObject.GetState_ObjectId() != TObjectId.eWire)
                    continue;
                robotManager.SendMessage(anObject, SCHConstant.BroadCast, SCHConstant.SCHMBeginModify, SCHConstant.NoEventData);
                anObject.SetState_Color(0x0000FF); // red, in BGR format
                robotManager.SendMessage(anObject, SCHConstant.BroadCast, SCHConstant.SCHMEndModify, SCHConstant.NoEventData);
            }
        }
        finally
        {
            document.SchIterator_Destroy(ref iterator);
        }
        // Clean up the robots in the schematic editor.
        processControl.PostProcess(document, "");
        // </example>
    }
}
