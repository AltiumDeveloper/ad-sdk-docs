// Compile the focused library package into an integrated library and make it the current project
using System.IO;
using DXP;
using EDP;
using SCH;

static partial class Examples
{
    static void Example_IIntegratedLibraryManager_MakeCurrentProject()
    {
        // <example>
        IIntegratedLibraryManager intMan = EDP.Utils.LoadIntegratedLibraryManager();
        if (intMan == null)
            return;
        var wsm = DXP.GlobalVars.Client.GetDXPWorkspace() as EDP.IWorkspace;
        if (wsm == null)
            return;
        IProject project = wsm.DM_FocusedProject();
        if (project == null)
            return;
        string libPath = Path.ChangeExtension(project.DM_ProjectFullPath(), ".INTLIB");
        intMan.CreateIntegratedLibrary(project, libPath, true);
        intMan.MakeCurrentProject(project);
        // </example>
    }
}
