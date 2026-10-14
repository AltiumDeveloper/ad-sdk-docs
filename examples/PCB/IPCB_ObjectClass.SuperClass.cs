// Report which object classes on the current board are super classes
using System.Collections.Generic;
using PCB;

static partial class Examples
{
    static void Example_IPCB_ObjectClass_SuperClass()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        var report = new List<string>();
        IPCB_BoardIterator iterator = board.BoardIterator_Create();
        iterator.AddFilter_ObjectSet(new PCB.TObjectSet { TObjectId.eClassObject });
        iterator.AddFilter_AllLayers();
        iterator.AddFilter_Method(TIterationMethod.eProcessAll);
        for (var objectClass = iterator.FirstPCBObject() as IPCB_ObjectClass; objectClass != null; objectClass = iterator.NextPCBObject() as IPCB_ObjectClass)
        {
            if (objectClass.GetState_SuperClass())
            {
                // This is a super class.
                switch (objectClass.GetState_MemberKind())
                {
                    case TClassMemberKind.eClassMemberKind_Net: report.Add("All Nets"); break;
                    case TClassMemberKind.eClassMemberKind_Component: report.Add("All Components"); break;
                    case TClassMemberKind.eClassMemberKind_FromTo: report.Add("All FromTos"); break;
                    case TClassMemberKind.eClassMemberKind_Pad: report.Add("All Pads"); break;
                    case TClassMemberKind.eClassMemberKind_Layer: report.Add("All Layers"); break;
                }
            }
        }
        board.BoardIterator_Destroy(ref iterator);

        DXP.Utils.ShowInfo(string.Join("\r\n", report), "Super Classes");
        // </example>
    }
}
