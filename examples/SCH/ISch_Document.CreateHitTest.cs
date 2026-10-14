// Report the objects under a location the user clicks on the current schematic sheet
using DXP;
using SCH;

static partial class Examples
{
    static void Example_ISch_Document_CreateHitTest()
    {
        // <example>
        ISch_Document doc = SCH.GlobalVars.SchServer?.GetCurrentSchDocument();
        if (doc == null)
            return;
        var location = new DXP.Point(new SPoint());
        doc.ChooseLocationInteractively(ref location, "Choose a location to click");
        THitTestMode hitTestMode = THitTestMode.eHitTest_AllObjects;
        ISch_HitTest hitTest = doc.CreateHitTest(hitTestMode, location);
        for (int i = 0; i < hitTest.GetState_HitTestCount(); i++)
        {
            ISch_GraphicalObject prim = hitTest.GetState_HitObject(i);
            DXP.Utils.ShowInfo(prim.GetState_ObjectId().ToString()
                + "\r" +
                "Location coordinates - "
                + "\r" +
                " X= "
                + location.X
                + "\r" +
                " Y= "
                + location.Y, "Hit test");
        }
        // </example>
    }
}
