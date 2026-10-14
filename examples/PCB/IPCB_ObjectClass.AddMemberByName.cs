// Create a net class that contains the GND net on the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_ObjectClass_AddMemberByName()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        if (board == null)
            return;

        pcbServer.PreProcess();
        IPCB_ObjectClass netClass = pcbServer.PCBClassFactoryByClassMember(TClassMemberKind.eClassMemberKind_Net);
        netClass.SetState_SuperClass(false);
        netClass.SetState_Name("NetGndClass");
        netClass.AddMemberByName("GND");
        board.AddPCBObject(netClass);
        pcbServer.PostProcess();
        // </example>
    }
}
