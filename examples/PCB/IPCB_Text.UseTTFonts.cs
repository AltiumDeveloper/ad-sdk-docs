// Place an inverted TrueType text object on the bottom overlay of the current board
using PCB;

static partial class Examples
{
    static void Example_IPCB_Text_UseTTFonts()
    {
        // <example>
        IPCB_ServerInterface pcbServer = PCB.GlobalVars.PCBServer;
        IPCB_Board board = pcbServer?.GetCurrentPCBBoard();
        if (board == null)
            return;
        IPCB_Sheet sheet = board.GetState_PCBSheet();

        var textObj = pcbServer.PCBObjectFactory(TObjectId.eTextObject, TDimensionKind.eNoDimension, TObjectCreationMode.eCreate_Default) as IPCB_Text;
        // Notify that the PCB object is going to be modified.
        textObj.BeginModify();
        textObj.SetState_XLocation(sheet.GetState_SheetX() + EDP.Utils.MilsToCoord(1000));
        textObj.SetState_YLocation(sheet.GetState_SheetY() + EDP.Utils.MilsToCoord(1000));
        textObj.SetState_Layer(TV6_Layer.eV6_BottomOverlay);
        // Use TrueType fonts.
        textObj.SetState_UseTTFonts(true);
        textObj.SetState_Italic(true);
        textObj.SetState_Bold(false);
        textObj.SetState_FontName("ARIAL");
        textObj.SetState_Inverted(true);
        textObj.SetState_InvertedTTTextBorder(EDP.Utils.MilsToCoord(100));
        textObj.SetState_Text("Text with True Type Property enabled.");
        textObj.SetState_Size(EDP.Utils.MilsToCoord(200)); // sets the height of the text
        board.AddPCBObject(textObj);
        // Notify that the PCB object has been modified.
        textObj.EndModify();
        // </example>
    }
}
