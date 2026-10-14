// Extracts the public API surface of a .NET assembly into JSON, reading metadata only (the assembly is never
// loaded or executed). Usage: dotnet run --project tools/AssemblyMetadata -- <assembly.dll> <out.json>
using System.Collections.Immutable;
using System.Reflection;
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;
using System.Text.Json;
using System.Text.Json.Serialization;

if (args.Length < 2) { Console.Error.WriteLine("usage: AssemblyMetadata <assembly.dll> <out.json>"); return 1; }

using var fs = File.OpenRead(args[0]);
using var pe = new PEReader(fs);
var md = pe.GetMetadataReader();
var prov = new TypeNameProvider(md);
string S(StringHandle h) => md.GetString(h);

string AttrName(CustomAttribute c) => c.Constructor.Kind == HandleKind.MemberReference
    ? prov.Name(md.GetMemberReference((MemberReferenceHandle)c.Constructor).Parent)
    : prov.Name(md.GetMethodDefinition((MethodDefinitionHandle)c.Constructor).GetDeclaringType());

string FirstStringArg(CustomAttributeHandleCollection attrs, string suffix) => attrs
    .Select(md.GetCustomAttribute).Where(c => AttrName(c).EndsWith(suffix))
    .Select(c => c.DecodeValue(prov).FixedArguments.FirstOrDefault().Value?.ToString()).FirstOrDefault();

object ConstantValue(ConstantHandle h)
{
    if (h.IsNil) return null;
    var c = md.GetConstant(h);
    var br = md.GetBlobReader(c.Value);
    return c.TypeCode switch
    {
        ConstantTypeCode.Boolean => br.ReadBoolean(),
        ConstantTypeCode.Char => br.ReadChar().ToString(),
        ConstantTypeCode.SByte => br.ReadSByte(),
        ConstantTypeCode.Byte => br.ReadByte(),
        ConstantTypeCode.Int16 => br.ReadInt16(),
        ConstantTypeCode.UInt16 => br.ReadUInt16(),
        ConstantTypeCode.Int32 => br.ReadInt32(),
        ConstantTypeCode.UInt32 => br.ReadUInt32(),
        ConstantTypeCode.Int64 => br.ReadInt64(),
        ConstantTypeCode.UInt64 => br.ReadUInt64(),
        ConstantTypeCode.Single => br.ReadSingle(),
        ConstantTypeCode.Double => br.ReadDouble(),
        ConstantTypeCode.String => br.ReadUTF16(br.Length),
        _ => null,
    };
}

bool IsPublic(TypeDefinition t)
{
    var v = t.Attributes & TypeAttributes.VisibilityMask;
    if (v == TypeAttributes.Public) return true;
    if (v != TypeAttributes.NestedPublic) return false;
    return IsPublic(md.GetTypeDefinition(t.GetDeclaringType()));
}

var types = new List<TypeInfo>();
foreach (var th in md.TypeDefinitions)
{
    var t = md.GetTypeDefinition(th);
    if (!IsPublic(t)) continue;
    var full = prov.GetTypeFromDefinition(md, th, 0);
    var baseType = t.BaseType.IsNil ? null : prov.Name(t.BaseType);
    var kind = (t.Attributes & TypeAttributes.Interface) != 0 ? "interface"
        : baseType switch { "System.Enum" => "enum", "System.ValueType" => "struct", "System.MulticastDelegate" => "delegate", _ => "class" };
    var attrs = t.GetCustomAttributes().Select(md.GetCustomAttribute).Select(AttrName).ToList();

    var methods = new List<MethodInfo>();
    foreach (var mh in t.GetMethods())
    {
        var m = md.GetMethodDefinition(mh);
        if ((m.Attributes & MethodAttributes.MemberAccessMask) != MethodAttributes.Public) continue;
        var sig = m.DecodeSignature(prov, null);
        var ps = m.GetParameters().Select(md.GetParameter).Where(p => p.SequenceNumber > 0).OrderBy(p => p.SequenceNumber).ToList();
        var pars = sig.ParameterTypes.Select((pt, i) =>
        {
            var p = i < ps.Count ? ps[i] : default;
            var byRef = pt.StartsWith("ref ");
            var dir = !byRef ? null : (i < ps.Count && (p.Attributes & ParameterAttributes.Out) != 0 && (p.Attributes & ParameterAttributes.In) == 0) ? "out" : "ref";
            return new ParamInfo(i < ps.Count ? S(p.Name) : $"arg{i}", byRef ? pt[4..] : pt, dir);
        }).ToList();
        var mAttrs = m.GetCustomAttributes().Select(md.GetCustomAttribute).Select(AttrName).ToList();
        methods.Add(new MethodInfo(S(m.Name), sig.ReturnType, pars,
            (m.Attributes & MethodAttributes.Static) != 0 ? true : null,
            (m.Attributes & MethodAttributes.SpecialName) != 0 ? true : null,
            mAttrs.Any(a => a.EndsWith("ExtensionAttribute")) ? true : null));
    }

    var props = t.GetProperties().Select(md.GetPropertyDefinition).Select(p =>
    {
        var acc = p.GetAccessors();
        return new PropInfo(S(p.Name), p.DecodeSignature(prov, null).ReturnType, !acc.Getter.IsNil, !acc.Setter.IsNil);
    }).ToList();

    var fields = t.GetFields().Select(md.GetFieldDefinition)
        .Where(f => (f.Attributes & FieldAttributes.FieldAccessMask) == FieldAttributes.Public && (f.Attributes & FieldAttributes.SpecialName) == 0)
        .Select(f => new FieldInfo(S(f.Name), f.DecodeSignature(prov, null), ConstantValue(f.GetDefaultValue()),
            (f.Attributes & FieldAttributes.Static) != 0 ? true : null)).ToList();

    types.Add(new TypeInfo(full, S(t.Namespace) is var ns && ns.Length > 0 ? ns : null, kind, baseType,
        t.GetInterfaceImplementations().Select(i => prov.Name(md.GetInterfaceImplementation(i).Interface)).ToList(),
        FirstStringArg(t.GetCustomAttributes(), "GuidAttribute"),
        attrs.Any(a => a.EndsWith("ExtensionAttribute")) ? true : null,
        methods, props.Count > 0 ? props : null, fields.Count > 0 ? fields : null));
}

var asm = md.GetAssemblyDefinition();
var result = new AssemblyInfo(
    S(asm.Name), asm.Version.ToString(),
    FirstStringArg(asm.GetCustomAttributes(), "AssemblyFileVersionAttribute"),
    FirstStringArg(asm.GetCustomAttributes(), "AssemblyInformationalVersionAttribute"),
    types.OrderBy(t => t.Name, StringComparer.Ordinal).ToList());

var options = new JsonSerializerOptions
{
    WriteIndented = false,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
};
File.WriteAllText(args[1], JsonSerializer.Serialize(result, options));
Console.WriteLine($"{result.Name} {result.Version} ({result.FileVersion}): {types.Count} public types -> {args[1]}");
return 0;

record AssemblyInfo(string Name, string Version, string FileVersion, string InformationalVersion, List<TypeInfo> Types);
record TypeInfo(string Name, string Namespace, string Kind, string BaseType, List<string> Interfaces, string Guid, bool? IsExtensionClass,
    List<MethodInfo> Methods, List<PropInfo> Properties, List<FieldInfo> Fields);
record MethodInfo(string Name, string ReturnType, List<ParamInfo> Parameters, bool? IsStatic, bool? IsSpecialName, bool? IsExtension);
record ParamInfo(string Name, string Type, string Direction);
record PropInfo(string Name, string Type, bool CanRead, bool CanWrite);
record FieldInfo(string Name, string Type, object Value, bool? IsStatic);

// Renders signature types as C#-style names: primitives as keywords, nested types as Outer.Inner, generics as T<A,B>.
class TypeNameProvider : ISignatureTypeProvider<string, object>, ICustomAttributeTypeProvider<string>
{
    readonly MetadataReader md;
    public TypeNameProvider(MetadataReader md) { this.md = md; }
    public string Name(EntityHandle h) => h.Kind switch
    {
        HandleKind.TypeDefinition => GetTypeFromDefinition(md, (TypeDefinitionHandle)h, 0),
        HandleKind.TypeReference => GetTypeFromReference(md, (TypeReferenceHandle)h, 0),
        HandleKind.TypeSpecification => GetTypeFromSpecification(md, null, (TypeSpecificationHandle)h, 0),
        _ => h.Kind.ToString(),
    };
    public string GetArrayType(string e, ArrayShape s) => $"{e}[{new string(',', s.Rank - 1)}]";
    public string GetByReferenceType(string e) => "ref " + e;
    public string GetFunctionPointerType(MethodSignature<string> s) => "IntPtr";
    public string GetGenericInstantiation(string g, ImmutableArray<string> a)
    {
        var tick = g.IndexOf('`');
        return $"{(tick >= 0 ? g[..tick] : g)}<{string.Join(", ", a)}>";
    }
    public string GetGenericMethodParameter(object c, int i) => $"TM{i}";
    public string GetGenericTypeParameter(object c, int i) => $"T{i}";
    public string GetModifiedType(string m, string u, bool r) => u;
    public string GetPinnedType(string e) => e;
    public string GetPointerType(string e) => e + "*";
    public string GetPrimitiveType(PrimitiveTypeCode t) => t switch
    {
        PrimitiveTypeCode.Boolean => "bool", PrimitiveTypeCode.Char => "char", PrimitiveTypeCode.SByte => "sbyte",
        PrimitiveTypeCode.Byte => "byte", PrimitiveTypeCode.Int16 => "short", PrimitiveTypeCode.UInt16 => "ushort",
        PrimitiveTypeCode.Int32 => "int", PrimitiveTypeCode.UInt32 => "uint", PrimitiveTypeCode.Int64 => "long",
        PrimitiveTypeCode.UInt64 => "ulong", PrimitiveTypeCode.Single => "float", PrimitiveTypeCode.Double => "double",
        PrimitiveTypeCode.String => "string", PrimitiveTypeCode.Object => "object", PrimitiveTypeCode.Void => "void",
        PrimitiveTypeCode.IntPtr => "IntPtr", PrimitiveTypeCode.UIntPtr => "UIntPtr", _ => t.ToString(),
    };
    public string GetSZArrayType(string e) => e + "[]";
    public string GetTypeFromDefinition(MetadataReader r, TypeDefinitionHandle h, byte k)
    {
        var t = r.GetTypeDefinition(h);
        var n = r.GetString(t.Name);
        var d = t.GetDeclaringType();
        if (!d.IsNil) return GetTypeFromDefinition(r, d, k) + "." + n;
        var ns = r.GetString(t.Namespace);
        return ns.Length > 0 ? ns + "." + n : n;
    }
    public string GetTypeFromReference(MetadataReader r, TypeReferenceHandle h, byte k)
    {
        var t = r.GetTypeReference(h);
        var n = r.GetString(t.Name);
        if (t.ResolutionScope.Kind == HandleKind.TypeReference) return GetTypeFromReference(r, (TypeReferenceHandle)t.ResolutionScope, k) + "." + n;
        var ns = r.GetString(t.Namespace);
        return ns.Length > 0 ? ns + "." + n : n;
    }
    public string GetTypeFromSpecification(MetadataReader r, object c, TypeSpecificationHandle h, byte k) =>
        r.GetTypeSpecification(h).DecodeSignature(this, c);
    public string GetSystemType() => "System.Type";
    public bool IsSystemType(string t) => t == "System.Type";
    public string GetTypeFromSerializedName(string n) => n;
    public PrimitiveTypeCode GetUnderlyingEnumType(string t) => PrimitiveTypeCode.Int32;
}
