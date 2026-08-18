param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [int]$MaxWidth = 180
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not ("ForgeWoodcut" -as [type])) {
  $drawingAssembly = [System.Drawing.Bitmap].Assembly.Location
  $drawingPrimitivesAssembly = [System.Drawing.Color].Assembly.Location
  $gdiPlusAssembly = Join-Path $PSHOME "System.Private.Windows.GdiPlus.dll"
  $windowsCoreAssembly = Join-Path $PSHOME "System.Private.Windows.Core.dll"
  Add-Type -ReferencedAssemblies $drawingAssembly,$drawingPrimitivesAssembly,$gdiPlusAssembly,$windowsCoreAssembly -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class ForgeWoodcut
{
    private static readonly int[,] Bayer = {
        { 0,  8,  2, 10 },
        { 12, 4, 14,  6 },
        { 3, 11,  1,  9 },
        { 15, 7, 13,  5 }
    };

    public static void Process(string inputPath, string outputPath, int maxWidth)
    {
        using (Bitmap source = new Bitmap(inputPath))
        {
            int width = Math.Min(maxWidth, source.Width);
            int height = (int)Math.Round(source.Height * (width / (double)source.Width));
            using (Bitmap resized = new Bitmap(width, height, PixelFormat.Format32bppArgb))
            using (Graphics graphics = Graphics.FromImage(resized))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.DrawImage(source, new Rectangle(0, 0, width, height));

                for (int y = 0; y < height; y++)
                {
                    for (int x = 0; x < width; x++)
                    {
                        Color pixel = resized.GetPixel(x, y);
                        if (pixel.A < 20)
                        {
                            resized.SetPixel(x, y, Color.Transparent);
                            continue;
                        }

                        double luminance = (0.2126 * pixel.R) + (0.7152 * pixel.G) + (0.0722 * pixel.B);
                        double threshold = 74.0 + (Bayer[y % 4, x % 4] * 7.25);
                        Color ink = luminance > threshold
                            ? Color.FromArgb((int)(pixel.A * 0.72), 239, 224, 193)
                            : Color.FromArgb(pixel.A, 231, 84, 22);
                        resized.SetPixel(x, y, ink);
                    }
                }

                string directory = Path.GetDirectoryName(outputPath);
                if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                resized.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
[ForgeWoodcut]::Process($resolvedInput, $resolvedOutput, $MaxWidth)
Write-Output "Woodcut $resolvedInput -> $resolvedOutput"
