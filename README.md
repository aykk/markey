# Markey Slicer Setup

This project uses `CuraEngine` to slice uploaded 3D models into G-code for analysis.

## macOS Requirements

The slicing configuration (`slicer/fdmprinter.def.json`) requires **CuraEngine 5.0 or newer**. Because of this, it relies on a natively installed version of UltiMaker Cura to work correctly.

**If you are running this on a Mac, you must:**
1. Download and install **UltiMaker Cura** from the [official website](https://ultimaker.com/software/ultimaker-cura/).
2. Place it in your `Applications` folder.

The Next.js backend will automatically detect the installation at `/Applications/UltiMaker Cura.app/Contents/Frameworks/CuraEngine`.

## Windows Requirements

Windows users should be able to run this out of the box because a compatible `CuraEngine.exe` binary is already included inside the `slicer/cura/bin/` folder.

## Linux Requirements

If you run this on Linux (e.g. Ubuntu), make sure you have an updated version of `CuraEngine` (5.0+) installed, as the one available in standard apt repositories (like Ubuntu 22.04) is too old and will throw "missing setting" errors.
