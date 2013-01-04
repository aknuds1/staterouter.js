import os
from xml.etree import ElementTree
import shutil
import subprocess

PACKAGE_METADATA = {
    "name": "StateRouter.js",
    "version": "0.3.0",
    "authors": ("Arve Knudsen",),
    "license_url": "http://opensource.org/licenses/MIT",
    "project_url": "https://github.com/aknuds1/staterouter.js",
    "description": "StateRouter.js is a small JavaScript library intended to extend the History.js HTML5 history library with routing capabilities.",
    "release_notes": "Assign current state to this when invoking router callbacks.",
    "copyright": "Copyright 2013",
    "tags": ("JavaScript", "HTML5", "Routing"),
    "dependencies": (("history.js", "1.7.0"),),
}

def SubElement(parent, tag, text=None, **kwds):
    elem = ElementTree.SubElement(parent, tag, **kwds)
    if text is not None:
        elem.text = text
    return elem

def indent(elem, level=0):
    """Indent ElementTree.Element."""
    i = "\n" + level*"  "
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "  "
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
        for elem in elem:
            indent(elem, level+1)
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = i

def makeNuspec(target, source, env):
    if len(target) != 1:
        raise Exception("There must be 1 target")
    if len(source) != 1:
        raise Exception("There must be 1 source")
    tgt = target[0]
    src = source[0].read()
    authors = ", ".join(src["authors"])

    xml_root = ElementTree.Element("package", xmlns="http://schemas.microsoft.com/packaging/2010/07/nuspec.xsd")
    xml_metadata = ElementTree.SubElement(xml_root, "metadata")
    SubElement(xml_metadata, "id", text=src["name"])
    SubElement(xml_metadata, "version", text=src["version"])
    SubElement(xml_metadata, "authors", text=authors)
    SubElement(xml_metadata, "owners", text=authors)
    SubElement(xml_metadata, "licenseUrl", text=src["license_url"])
    SubElement(xml_metadata, "projectUrl", text=src["project_url"])
    SubElement(xml_metadata, "requireLicenseAcceptance", text="false")
    SubElement(xml_metadata, "description", text=src["description"])
    SubElement(xml_metadata, "releaseNotes", text=src["release_notes"])
    SubElement(xml_metadata, "copyright", text=src["copyright"])
    SubElement(xml_metadata, "tags", text=" ".join(src["tags"]))
    deps = SubElement(xml_metadata, "dependencies")
    for dep in src["dependencies"]:
        SubElement(deps, "dependency", id=dep[0], version=dep[1])
    indent(xml_root)
    ElementTree.ElementTree(xml_root).write(tgt.path, encoding="utf-8", xml_declaration=True)

def makeNupkg(target, source, env):
    if len(target) != 1:
        raise Exception("There must be 1 target")
    src = source[0]
    return subprocess.call(["nuget", "pack", src.path])

def installJs(target, source, env):
    if len(target) != len(source):
        raise Exception("The number of targets must correspond to the number of sources")
    for i, src in enumerate(source):
        tgt = target[i]
        r = subprocess.call(["jslint.cmd", src.path])
        if r != 0:
            return r
        dpath = os.path.dirname(tgt.path)
        if not os.path.exists(dpath):
            os.makedirs(dpath)
        shutil.copy2(src.path, tgt.path)
        
pkgFname = PACKAGE_METADATA["name"].replace(".", "")

env = Environment(ENV=os.environ)

script = env.Command("content/Scripts/staterouter.js", "lib/staterouter.js", installJs)
minScript = env.Command("content/Scripts/staterouter.min.js", script, "uglifyjs $SOURCE -o $TARGET -c")
nuspec = env.Command("{0}.nuspec".format(pkgFname), env.Value(PACKAGE_METADATA), makeNuspec)
env.Command("{0}.{1}.nupkg".format(PACKAGE_METADATA["name"], PACKAGE_METADATA["version"]), [nuspec, script, minScript],
        makeNupkg)
