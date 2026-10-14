// Turn off the reference zones of every schematic sheet in the focused project
using DXP;
using EDP;
using SCH;

static partial class Examples
{
    static void ISch_Document_ReferenceZonesOn()
    {
        // <example>
        var workspace = DXP.GlobalVars.Client.GetDXPWorkspace() as IWorkspace;
        IProject project = workspace?.DM_FocusedProject();
        if (project == null)
            return;
        ISch_ServerInterface schServer = SCH.GlobalVars.SchServer;
        ISch_RobotManager robotManager = schServer.GetState_RobotManager();

        for (int i = 0; i < project.DM_LogicalDocumentCount(); i++)
        {
            IDocument document = project.DM_LogicalDocuments(i);
            if (document.DM_DocumentKind() != "SCH")
                continue;
            ISch_Document currentSheet = schServer.GetSchDocumentByPath(document.DM_FullPath());
            if (currentSheet != null && currentSheet.GetState_ReferenceZonesOn())
            {
                robotManager.SendMessage(currentSheet, SCHConstant.BroadCast, SCHConstant.SCHMBeginModify, SCHConstant.NoEventData);
                currentSheet.SetState_ReferenceZonesOn(false);
                robotManager.SendMessage(currentSheet, SCHConstant.BroadCast, SCHConstant.SCHMEndModify, SCHConstant.NoEventData);
            }
        }
        // </example>
    }
}
