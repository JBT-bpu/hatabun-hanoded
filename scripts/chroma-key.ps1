param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [int]$MaxWidth = 0
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

if (-not ("ForgeChromaKey" -as [type])) {
  $drawingAssembly = [System.Drawing.Bitmap].Assembly.Location
  $drawingPrimitivesAssembly = [System.Drawing.Color].Assembly.Location
  $gdiPlusAssembly = Join-Path $PSHOME "System.Private.Windows.GdiPlus.dll"
  $windowsCoreAssembly = Join-Path $PSHOME "System.Private.Windows.Core.dll"
  Add-Type -ReferencedAssemblies $drawingAssembly,$drawingPrimitivesAssembly,$gdiPlusAssembly,$windowsCoreAssembly -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class ForgeChromaKey
{
    private static double Clamp01(double value)
    {
        return Math.Max(0.0, Math.Min(1.0, value));
    }

    private static double SmoothStep(double edge0, double edge1, double value)
    {
        double t = Clamp01((value - edge0) / (edge1 - edge0));
        return t * t * (3.0 - (2.0 * t));
    }

    private static double Hue(byte red, byte green, byte blue)
    {
        double r = red / 255.0;
        double g = green / 255.0;
        double b = blue / 255.0;
        double max = Math.Max(r, Math.Max(g, b));
        double min = Math.Min(r, Math.Min(g, b));
        double delta = max - min;

        if (delta < 0.0001) return 0.0;

        double hue;
        if (max == r)
            hue = 60.0 * (((g - b) / delta) % 6.0);
        else if (max == g)
            hue = 60.0 * (((b - r) / delta) + 2.0);
        else
            hue = 60.0 * (((r - g) / delta) + 4.0);

        return hue < 0.0 ? hue + 360.0 : hue;
    }

    private static void SampleCorner(Bitmap bitmap, int startX, int startY, int size, ref long red, ref long green, ref long blue, ref long count)
    {
        for (int y = startY; y < startY + size; y++)
        {
            for (int x = startX; x < startX + size; x++)
            {
                Color pixel = bitmap.GetPixel(x, y);
                red += pixel.R;
                green += pixel.G;
                blue += pixel.B;
                count++;
            }
        }
    }

    public static void Process(string inputPath, string outputPath, int maxWidth)
    {
        using (Bitmap source = new Bitmap(inputPath))
        {
            int targetWidth = maxWidth > 0 && source.Width > maxWidth ? maxWidth : source.Width;
            int targetHeight = (int)Math.Round(source.Height * (targetWidth / (double)source.Width));
            using (Bitmap bitmap = new Bitmap(targetWidth, targetHeight, PixelFormat.Format32bppArgb))
            {
            using (Graphics graphics = Graphics.FromImage(bitmap))
            {
                graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
                graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
                graphics.DrawImage(source, new Rectangle(0, 0, targetWidth, targetHeight));
            }

            const int sampleSize = 10;
            long redTotal = 0;
            long greenTotal = 0;
            long blueTotal = 0;
            long sampleCount = 0;
            SampleCorner(bitmap, 0, 0, sampleSize, ref redTotal, ref greenTotal, ref blueTotal, ref sampleCount);
            SampleCorner(bitmap, bitmap.Width - sampleSize, 0, sampleSize, ref redTotal, ref greenTotal, ref blueTotal, ref sampleCount);
            SampleCorner(bitmap, 0, bitmap.Height - sampleSize, sampleSize, ref redTotal, ref greenTotal, ref blueTotal, ref sampleCount);
            SampleCorner(bitmap, bitmap.Width - sampleSize, bitmap.Height - sampleSize, sampleSize, ref redTotal, ref greenTotal, ref blueTotal, ref sampleCount);

            byte keyRed = (byte)(redTotal / sampleCount);
            byte keyGreen = (byte)(greenTotal / sampleCount);
            byte keyBlue = (byte)(blueTotal / sampleCount);
            double keyHue = Hue(keyRed, keyGreen, keyBlue);

            Rectangle bounds = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
            BitmapData data = bitmap.LockBits(bounds, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int byteCount = Math.Abs(data.Stride) * data.Height;
            byte[] pixels = new byte[byteCount];
            Marshal.Copy(data.Scan0, pixels, 0, byteCount);

            for (int y = 0; y < data.Height; y++)
            {
                int row = y * data.Stride;
                for (int x = 0; x < data.Width; x++)
                {
                    int index = row + (x * 4);
                    byte blue = pixels[index];
                    byte green = pixels[index + 1];
                    byte red = pixels[index + 2];
                    byte originalAlpha = pixels[index + 3];

                    double r = red / 255.0;
                    double g = green / 255.0;
                    double b = blue / 255.0;
                    double max = Math.Max(r, Math.Max(g, b));
                    double min = Math.Min(r, Math.Min(g, b));
                    double saturation = max < 0.0001 ? 0.0 : (max - min) / max;
                    double hueDistance = Math.Abs(Hue(red, green, blue) - keyHue);
                    hueDistance = Math.Min(hueDistance, 360.0 - hueDistance);

                    double hueScore = 1.0 - SmoothStep(10.0, 72.0, hueDistance);
                    double saturationScore = SmoothStep(0.08, 0.55, saturation);
                    double brightnessScore = SmoothStep(0.045, 0.18, max);
                    double magentaExcess = (Math.Min(red, blue) - green) / 255.0;
                    double channelScore = SmoothStep(0.035, 0.20, magentaExcess);
                    double keyScore = hueScore * saturationScore * brightnessScore * channelScore;
                    double foregroundAlpha = 1.0 - SmoothStep(0.16, 0.84, keyScore);

                    if (foregroundAlpha <= 0.025)
                    {
                        pixels[index] = 0;
                        pixels[index + 1] = 0;
                        pixels[index + 2] = 0;
                        pixels[index + 3] = 0;
                        continue;
                    }

                    if (foregroundAlpha < 0.985)
                    {
                        // Recover the foreground edge colour from its blend with the sampled key.
                        // This removes the usual pink fringe when the PNG is composited over fire.
                        double safeAlpha = Math.Max(0.12, foregroundAlpha);
                        bool sourceWasNotGreen = green <= Math.Max(red, blue);
                        double recoveredRed = Math.Max(0, Math.Min(255, (red - ((1.0 - safeAlpha) * keyRed)) / safeAlpha));
                        double recoveredGreen = Math.Max(0, Math.Min(255, (green - ((1.0 - safeAlpha) * keyGreen)) / safeAlpha));
                        double recoveredBlue = Math.Max(0, Math.Min(255, (blue - ((1.0 - safeAlpha) * keyBlue)) / safeAlpha));

                        // Numeric unmixing can turn an almost-transparent magenta pixel neon green.
                        // Clamp only when the source pixel was not green, preserving real herbs later.
                        double recoveredWarmMax = Math.Max(recoveredRed, recoveredBlue);
                        if (sourceWasNotGreen && recoveredGreen > recoveredWarmMax + 24.0)
                            recoveredGreen = recoveredWarmMax + 24.0;

                        red = (byte)recoveredRed;
                        green = (byte)recoveredGreen;
                        blue = (byte)recoveredBlue;
                    }

                    pixels[index] = blue;
                    pixels[index + 1] = green;
                    pixels[index + 2] = red;
                    pixels[index + 3] = (byte)Math.Round(originalAlpha * foregroundAlpha);
                }
            }

            Marshal.Copy(pixels, 0, data.Scan0, byteCount);
            bitmap.UnlockBits(data);

            string directory = Path.GetDirectoryName(outputPath);
            if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
            bitmap.Save(outputPath, ImageFormat.Png);

            }
        }
    }
}
"@
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
[ForgeChromaKey]::Process($resolvedInput, $resolvedOutput, $MaxWidth)
Write-Output "Keyed $resolvedInput -> $resolvedOutput"
