# Open issues

Questions about the SDK that this reference cannot answer from the assemblies or the available material. Each needs
confirmation from the SDK owners; when one is resolved, update the affected pages and remove it here.

Pages and members without a description are not listed: the reference marks them *No description yet*.

## Guides

| # | Topic | Question | Affects |
| --- | --- | --- | --- |
| 1 | BOM sort order | `IBomManagerOptions.SetSortOrder` takes a `string`. What is its format (parameter names, direction, separators)? | [Working with bills of materials](docs/guides/bom.mdx#configuring-the-bom) |
| 2 | BOM parameter values | Is there a supported way to set a parameter value on a BOM row or ActiveBOM catalog item other than the dedicated setters (`SetComment`, `SetDescription`, `SetLineNumber`)? `IBomParameterDictionary` has no setter. | [Working with bills of materials](docs/guides/bom.mdx#changing-an-activebom-document) |
| 3 | Target framework | The SDK assemblies reference .NET 8 (`System.Runtime` 8.0); most projects in the SDK examples target .NET Framework 4.x. Which target framework does each Altium Designer version support for extensions? | [Getting started](docs/guides/getting-started.mdx#project-setup) |
| 4 | SDK distribution | How do developers get the SDK assemblies (installed with Altium Designer, a separate SDK download, a NuGet package)? Which assemblies must an extension reference: `Altium.SDK.dll` only, or `Altium.SDK.dll` and `Altium.SDK.Interfaces.dll`? | [Getting started](docs/guides/getting-started.mdx#project-setup) |
| 5 | Installation | Where exactly are extensions installed (the `Extensions` folder path per installation), and when does Altium Designer load them? The guide describes the layout used by the SDK examples. | [Getting started](docs/guides/getting-started.mdx#installation-files) |
| 6 | `.rcs` files | What is the format of the `.rcs` file (menus, toolbars, shortcuts)? | [Getting started](docs/guides/getting-started.mdx#installation-files) |

## Reference

| # | Topic | Question | Affects |
| --- | --- | --- | --- |
| 7 | Untyped overloads | Several interfaces declare an untyped method (`object` or `int` parameters) next to a typed extension method of the same name, e.g. `ISch_RobotManager.SendMessage`. Are both supported, or is one preferred? | Member sections listing two overloads |
| 9 | `ISch_RobotManager.SendMessage` | Which `MessageID` and parameters apply to which change? The description assigns `SCHMPrimitiveRegistration` to modifying an object and `SCHMBeginModify`/`SCHMEndModify` to adding one, but modifying an object is usually wrapped in `SCHMBeginModify`/`SCHMEndModify` (see [Working with schematics](docs/guides/schematic-basics.mdx#changing-objects)). What is passed as `Source` for each case? | [`ISch_RobotManager`](https://altiumdeveloper.github.io/ad-sdk-api-reference/reference/sch/ISch_RobotManager#sendmessage) |
| 10 | C# examples | The examples in `examples/**` compile against the SDK assemblies but have not been run in Altium Designer. Can the SDK owners run them (or the SDK test suite) to confirm the behaviour, especially `ISch_Document.ChooseRectangleInteractively` with a `CoordRect` passed by `ref`, and `SendMessage` with `SCHConstant.BroadCast` and `SCHConstant.NoEventData`? | Pages with an Example section |
| 11 | PCB undo notifications | The PCB examples wrap a change in `IPCB_Primitive.BeginModify()` / `EndModify()`. Is that the supported way to notify the PCB editor (undo, connectivity) of a change, and what replaces the board registration message after adding an object? | [`IPCB_Text`](https://altiumdeveloper.github.io/ad-sdk-api-reference/reference/pcb/IPCB_Text#usettfonts) |
| 12 | Unit conversion | `EDP.Utils` converts mils and millimetres (`MilsToCoord`, `MMsToCoord`). Is there a supported conversion for inches, or should extensions use `MilsToCoord(inches * 1000)`? | [`EDP.Utils`](https://altiumdeveloper.github.io/ad-sdk-api-reference/reference/edp/Utils) |
| 13 | Options pages | Which members of `DXP.OptionsForm` / `DXP.OptionsPage` does an extension override to implement a preferences page (load, save, modified state)? | [`DXP.OptionsForm`](https://altiumdeveloper.github.io/ad-sdk-api-reference/reference/dxp/OptionsForm) |
| 8 | Public implementation classes | `Altium.SDK.dll` exposes classes that implement SDK interfaces (for example `SCH.Supplier`, `SCH.PartChoice2`, `DXP.ADStrings`) and Windows/crypto helpers (`DXP.WindowsAPI`, `DXP.NativeMd5`). Are these meant for extension developers? They are not published for now (`config/hidden-types.yaml`). | Classes in the SCH, DXP, EDP and Altium.Edp.Classes namespaces |
