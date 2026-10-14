// Count the primitives of every footprint in the current PCB library
using System.IO;
using PCB;

static partial class Examples
{
    static void Example_IPCB_LibraryIterator()
    {
        // <example>
        IPCB_Library currentLib = PCB.GlobalVars.PCBServer?.GetCurrentPCBLibrary();
        if (currentLib == null)
        {
            DXP.Utils.ShowInfo("This is not a PCB library document", "Footprints");
            return;
        }

        // Each page of the library is a footprint.
        IPCB_LibraryIterator footprintIterator = currentLib.LibraryIterator_Create();
        footprintIterator.SetState_FilterAll();
        string s = "";
        bool firstTime = true;
        try
        {
            // A footprint is an IPCB_LibComponent, which inherits from IPCB_Group,
            // a container object that stores primitives.
            var footprint = footprintIterator.FirstPCBObject() as IPCB_LibComponent;
            while (footprint != null)
            {
                if (firstTime)
                {
                    s = s + Path.GetFileName(footprint.GetState_Board().GetState_FileName()) + "\r";
                    s = s + " Current Footprint : " +
                        currentLib.GetState_CurrentComponent().GetState_Pattern() + "\r" + "\r";
                }
                s = s + footprint.GetState_Pattern();

                IPCB_GroupIterator iterator = footprint.GroupIterator_Create();
                iterator.SetState_FilterAll();
                // Count the primitives of the footprint.
                // IPCB_LibComponent also has a GetPrimitiveCount method.
                int noOfPrims = 0;
                IPCB_Primitive aObject = iterator.FirstPCBObject();
                while (aObject != null)
                {
                    noOfPrims++;
                    // Process aObject here.
                    aObject = iterator.NextPCBObject();
                }
                s = s + " has " + noOfPrims + " Primitives." + "\r";
                firstTime = false;
                footprint.GroupIterator_Destroy(ref iterator);
                footprint = footprintIterator.NextPCBObject() as IPCB_LibComponent;
            }
        }
        finally
        {
            currentLib.LibraryIterator_Destroy(ref footprintIterator);
        }
        DXP.Utils.ShowInfo(s, "Footprints");
        // </example>
    }
}
