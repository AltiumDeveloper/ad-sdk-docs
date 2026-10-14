// Get the extent of the current schematic sheet in mils
using System;
using SCH;

static partial class Examples
{
    static void Example_ISch_Document_Graphical_VirtualRectangle()
    {
        // <example>
        ISch_Document sheet = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (sheet == null)
            return;
        CoordRect rect = sheet.Graphical_VirtualRectangle();
        int minX = (int)Math.Floor(EDP.Utils.CoordToMils(rect.X1));
        int minY = (int)Math.Floor(EDP.Utils.CoordToMils(rect.Y1));
        int maxX = (int)Math.Ceiling(EDP.Utils.CoordToMils(rect.X2));
        int maxY = (int)Math.Ceiling(EDP.Utils.CoordToMils(rect.Y2));
        // </example>
    }
}
