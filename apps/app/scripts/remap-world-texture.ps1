param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [string]$OutputPath = "apps/app/public/cdn/geo-world/world-texture-mercator-150e-4320x2816.jpg",

  [int]$OutputWidth = 4320,

  [int]$OutputHeight = 2816,

  [double]$CenterLng = 150,

  [double]$MinX = -3100989.206401353,

  [double]$MaxX = 36660434.90763794,

  [double]$MinY = -7481526.898194934,

  [double]$MaxY = 18440002.895114224,

  [int]$JpegQuality = 95
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Split-Path -Parent $scriptDir
$appsDir = Split-Path -Parent $appDir
$repoDir = Split-Path -Parent $appsDir

if (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
  $OutputPath = Join-Path $repoDir $OutputPath
}

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class WorldTextureRemapper
{
    private const double MaxMercator = 20037508.342789244;

    public static void Remap(
        string inputPath,
        string outputPath,
        int outputWidth,
        int outputHeight,
        double minX,
        double maxX,
        double minY,
        double maxY,
        long jpegQuality
    )
    {
        using (var sourceOriginal = (Bitmap)Image.FromFile(inputPath))
        using (var source = CloneTo24Bpp(sourceOriginal))
        using (var destination = new Bitmap(outputWidth, outputHeight, PixelFormat.Format24bppRgb))
        {
            var sourceRect = new Rectangle(0, 0, source.Width, source.Height);
            var destRect = new Rectangle(0, 0, destination.Width, destination.Height);

            var sourceData = source.LockBits(sourceRect, ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
            var destData = destination.LockBits(destRect, ImageLockMode.WriteOnly, PixelFormat.Format24bppRgb);

            try
            {
                int sourceStride = Math.Abs(sourceData.Stride);
                int destStride = Math.Abs(destData.Stride);
                var sourceBytes = new byte[sourceStride * source.Height];
                var destBytes = new byte[destStride * destination.Height];
                Marshal.Copy(sourceData.Scan0, sourceBytes, 0, sourceBytes.Length);

                RemapPixels(
                    sourceBytes,
                    source.Width,
                    source.Height,
                    sourceStride,
                    destBytes,
                    destination.Width,
                    destination.Height,
                    destStride,
                    minX,
                    maxX,
                    minY,
                    maxY
                );

                Marshal.Copy(destBytes, 0, destData.Scan0, destBytes.Length);
            }
            finally
            {
                source.UnlockBits(sourceData);
                destination.UnlockBits(destData);
            }

            SaveBitmap(destination, outputPath, jpegQuality);
        }
    }

    private static Bitmap CloneTo24Bpp(Bitmap original)
    {
        var bitmap = new Bitmap(original.Width, original.Height, PixelFormat.Format24bppRgb);
        using (var graphics = Graphics.FromImage(bitmap))
        {
            graphics.DrawImage(original, 0, 0, original.Width, original.Height);
        }
        return bitmap;
    }

    private static void RemapPixels(
        byte[] sourceBytes,
        int sourceWidth,
        int sourceHeight,
        int sourceStride,
        byte[] destBytes,
        int destWidth,
        int destHeight,
        int destStride,
        double minX,
        double maxX,
        double minY,
        double maxY
    )
    {
        double width = maxX - minX;
        double height = maxY - minY;

        for (int y = 0; y < destHeight; y++)
        {
            double v = 1.0 - ((y + 0.5) / destHeight);
            double projectedY = minY + v * height;
            double mercatorDegrees = (projectedY / MaxMercator) * 180.0;
            double lat = (180.0 / Math.PI) * (2.0 * Math.Atan(Math.Exp((mercatorDegrees * Math.PI) / 180.0)) - Math.PI / 2.0);
            double sourceY = ((90.0 - lat) / 180.0) * sourceHeight;

            if (sourceY < 0) sourceY = 0;
            if (sourceY > sourceHeight - 1) sourceY = sourceHeight - 1;

            int y0 = (int)Math.Floor(sourceY);
            int y1 = Math.Min(y0 + 1, sourceHeight - 1);
            double fy = sourceY - y0;

            for (int x = 0; x < destWidth; x++)
            {
                double u = (x + 0.5) / destWidth;
                double projectedX = minX + u * width;
                double lng = (projectedX / MaxMercator) * 180.0;
                lng = NormalizeLongitude(lng);

                double sourceX = ((lng + 180.0) / 360.0) * sourceWidth;
                while (sourceX < 0) sourceX += sourceWidth;
                while (sourceX >= sourceWidth) sourceX -= sourceWidth;

                int x0 = (int)Math.Floor(sourceX);
                int x1 = (x0 + 1) % sourceWidth;
                double fx = sourceX - x0;

                int i00 = y0 * sourceStride + x0 * 3;
                int i10 = y0 * sourceStride + x1 * 3;
                int i01 = y1 * sourceStride + x0 * 3;
                int i11 = y1 * sourceStride + x1 * 3;

                double b =
                    sourceBytes[i00 + 0] * (1 - fx) * (1 - fy) +
                    sourceBytes[i10 + 0] * fx * (1 - fy) +
                    sourceBytes[i01 + 0] * (1 - fx) * fy +
                    sourceBytes[i11 + 0] * fx * fy;
                double g =
                    sourceBytes[i00 + 1] * (1 - fx) * (1 - fy) +
                    sourceBytes[i10 + 1] * fx * (1 - fy) +
                    sourceBytes[i01 + 1] * (1 - fx) * fy +
                    sourceBytes[i11 + 1] * fx * fy;
                double r =
                    sourceBytes[i00 + 2] * (1 - fx) * (1 - fy) +
                    sourceBytes[i10 + 2] * fx * (1 - fy) +
                    sourceBytes[i01 + 2] * (1 - fx) * fy +
                    sourceBytes[i11 + 2] * fx * fy;

                int destIndex = y * destStride + x * 3;
                destBytes[destIndex + 0] = ClampToByte(b);
                destBytes[destIndex + 1] = ClampToByte(g);
                destBytes[destIndex + 2] = ClampToByte(r);
            }
        }
    }

    private static double NormalizeLongitude(double lng)
    {
        lng = ((lng + 180.0) % 360.0 + 360.0) % 360.0 - 180.0;
        return lng;
    }

    private static byte ClampToByte(double value)
    {
        if (value < 0) return 0;
        if (value > 255) return 255;
        return (byte)Math.Round(value);
    }

    private static void SaveBitmap(Bitmap bitmap, string outputPath, long jpegQuality)
    {
        string extension = System.IO.Path.GetExtension(outputPath).ToLowerInvariant();
        if (extension == ".jpg" || extension == ".jpeg")
        {
            ImageCodecInfo jpegCodec = null;
            foreach (var codec in ImageCodecInfo.GetImageEncoders())
            {
                if (codec.FormatID == ImageFormat.Jpeg.Guid)
                {
                    jpegCodec = codec;
                    break;
                }
            }

            if (jpegCodec != null)
            {
                using (var encoderParameters = new EncoderParameters(1))
                {
                    encoderParameters.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, jpegQuality);
                    bitmap.Save(outputPath, jpegCodec, encoderParameters);
                    return;
                }
            }
        }

        bitmap.Save(outputPath, ImageFormat.Png);
    }
}
"@ -Language CSharp

$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

Write-Output "InputPath: $InputPath"
Write-Output "OutputPath: $OutputPath"
Write-Output "OutputSize: ${OutputWidth}x${OutputHeight}"
Write-Output "Bounds: minX=$MinX maxX=$MaxX minY=$MinY maxY=$MaxY"

[WorldTextureRemapper]::Remap(
  $InputPath,
  $OutputPath,
  $OutputWidth,
  $OutputHeight,
  $MinX,
  $MaxX,
  $MinY,
  $MaxY,
  [long]$JpegQuality
)

Write-Output "Done"
