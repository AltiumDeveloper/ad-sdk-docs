// Color wires red and fill ports green, depending on the object type
using SCH;

static partial class Examples
{
    static void Example_ISch_BasicContainer_ObjectId()
    {
        // <example>
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_Document document = schServer?.GetCurrentSchDocument();
        if (document == null)
            return;
        ISch_RobotManager robotManager = schServer.GetState_RobotManager();
        ISch_Iterator iterator = document.SchIterator_Create();
        try
        {
            ISch_BasicContainer anObject = iterator.FirstSchObject();
            while (anObject != null)
            {
                robotManager.SendMessage(anObject, SCHConstant.BroadCast, SCHConstant.SCHMBeginModify, SCHConstant.NoEventData);
                switch (anObject.GetState_ObjectId())
                {
                    case TObjectId.eWire:
                        ((ISch_GraphicalObject)anObject).SetState_Color(0x0000FF); // red, in BGR format
                        break;
                    case TObjectId.ePort:
                        ((ISch_GraphicalObject)anObject).SetState_AreaColor(0x00FF00); // green, in BGR format
                        break;
                }
                robotManager.SendMessage(anObject, SCHConstant.BroadCast, SCHConstant.SCHMEndModify, SCHConstant.NoEventData);
                anObject = iterator.NextSchObject();
            }
        }
        finally
        {
            document.SchIterator_Destroy(ref iterator);
        }
        // </example>
    }
}
