// Move the first selected object on the current board by a distance in a direction
using System;
using PCB;

static partial class Examples
{
    static void Example_IPCB_Primitive_MoveByXY()
    {
        // <example>
        IPCB_Board board = PCB.GlobalVars.PCBServer?.GetCurrentPCBBoard();
        if (board == null || board.GetState_SelectecObjectCount() == 0)
            return;
        IPCB_Primitive pcbObject = board.GetState_SelectecObject(0);
        // Sample values: the distance and the direction (in radians) of the move.
        int distanceStep = EDP.Utils.MilsToCoord(100);
        double angleStep = Math.PI / 4;

        //Move the object by a specified offset
        int xStep = (int)(distanceStep * Math.Cos(angleStep));
        int yStep = (int)(distanceStep * Math.Sin(angleStep));
        pcbObject.MoveByXY(xStep, yStep);
        // </example>
    }
}
