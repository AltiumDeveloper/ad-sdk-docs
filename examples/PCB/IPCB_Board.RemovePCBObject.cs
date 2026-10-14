// Remove all tracks on the top layer of the current board
using System.Collections.Generic;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Board_RemovePCBObject()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board currentPCBBoard = pcbServer?.GetCurrentPCBBoard();
        if (currentPCBBoard == null)
            return;
        IPCB_BoardIterator iterator = currentPCBBoard.BoardIterator_Create();
        if (iterator == null)
            return;
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eTrackObject });
        iterator.AddFilter_LayerSet(new TV6_LayerSet { TV6_Layer.eV6_TopLayer });
        // store tracks in a list that are to be deleted later...
        var trackList = new List<IPCB_Primitive>();
        try
        {
            IPCB_Primitive track = iterator.FirstPCBObject();
            while (track != null)
            {
                trackList.Add(track);
                track = iterator.NextPCBObject();
            }
        }
        finally
        {
            currentPCBBoard.BoardIterator_Destroy(ref iterator);
        }
        try
        {
            pcbServer.PreProcess();
            for (int i = 0; i < trackList.Count; i++)
                currentPCBBoard.RemovePCBObject(trackList[i]);
        }
        finally
        {
            pcbServer.PostProcess();
        }
        // Refresh the PCB document.
        currentPCBBoard.ViewManager_FullUpdate();
        DXP.Utils.RunCommand("PCB:Zoom", "Action=Redraw");
        // </example>
    }
}
