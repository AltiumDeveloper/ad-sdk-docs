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
| 8 | Public implementation classes | `Altium.SDK.dll` exposes classes that implement SDK interfaces (for example `SCH.Supplier`, `SCH.PartChoice2`, `DXP.ADStrings`) and Windows/crypto helpers (`DXP.WindowsAPI`, `DXP.NativeMd5`). Are these meant for extension developers? | Classes in the SCH, DXP and EDP namespaces |
