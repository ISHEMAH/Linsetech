// recording <video> <outdir> <start s> <end s|-1> <step s|all> [width=640]
// Decodes every frame (AVFoundation, Homebrew ffmpeg is broken here), writes JPEGs every <step> seconds (or all), and a
// frames.csv with each frame's timestamp and its mean luma change from the previous frame (64×40 thumbnail).
import AVFoundation
import CoreImage
import Foundation

let args = CommandLine.arguments
guard args.count >= 6 else {
  print("usage: extract <video> <outdir> <start s> <end s|-1> <step s|all> [width=640]")
  exit(1)
}
let url = URL(fileURLWithPath: args[1])
let outDir = URL(fileURLWithPath: args[2])
let start = Double(args[3])!
let endArg = Double(args[4])!
let stepArg = args[5]
let width = args.count > 6 ? Double(args[6])! : 640

let framesDir = outDir.appendingPathComponent("frames")
try FileManager.default.createDirectory(at: framesDir, withIntermediateDirectories: true)

let asset = AVURLAsset(url: url)
guard let track = asset.tracks(withMediaType: .video).first else { print("no video track"); exit(1) }
let duration = asset.duration.seconds
let size = track.naturalSize
print("duration \(duration) size \(size) nominal fps \(track.nominalFrameRate) codec \(track.formatDescriptions.first.map { CMFormatDescriptionGetMediaSubType($0 as! CMFormatDescription) } ?? 0)")
let end = endArg < 0 ? duration : min(endArg, duration)

let reader = try AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
output.alwaysCopiesSampleData = false
reader.add(output)
reader.timeRange = CMTimeRange(start: CMTime(seconds: start, preferredTimescale: 600), end: CMTime(seconds: end, preferredTimescale: 600))
reader.startReading()

let ctx = CIContext(options: [.useSoftwareRenderer: false])
let cs = CGColorSpaceCreateDeviceRGB()
let tw = 64, th = 40
var prev: [UInt8]? = nil
var csv = "i,t,diff,written\n"
var i = 0
var nextWrite = start
let step = stepArg == "all" ? 0 : Double(stepArg)!
while let sample = output.copyNextSampleBuffer() {
  guard let pb = CMSampleBufferGetImageBuffer(sample) else { continue }
  let t = CMSampleBufferGetPresentationTimeStamp(sample).seconds
  let img = CIImage(cvPixelBuffer: pb)
  let ext = img.extent
  let small = img.transformed(by: CGAffineTransform(scaleX: CGFloat(tw) / ext.width, y: CGFloat(th) / ext.height))
  var buf = [UInt8](repeating: 0, count: tw * th * 4)
  ctx.render(small, toBitmap: &buf, rowBytes: tw * 4, bounds: CGRect(x: 0, y: 0, width: tw, height: th), format: .RGBA8, colorSpace: cs)
  var luma = [UInt8](repeating: 0, count: tw * th)
  for k in 0..<(tw * th) {
    let r: Int = Int(buf[k * 4]) * 299
    let g: Int = Int(buf[k * 4 + 1]) * 587
    let b: Int = Int(buf[k * 4 + 2]) * 114
    luma[k] = UInt8((r + g + b) / 1000)
  }
  var d = 0.0
  if let p = prev {
    var s = 0
    for k in 0..<luma.count { s += abs(Int(luma[k]) - Int(p[k])) }
    d = Double(s) / Double(luma.count)
  }
  prev = luma
  var written = 0
  if step == 0 || t >= nextWrite - 1e-6 {
    let scale = CGFloat(width) / ext.width
    let scaled = img.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    let name = String(format: "%05d.jpg", i)
    try ctx.writeJPEGRepresentation(of: scaled, to: framesDir.appendingPathComponent(name), colorSpace: cs, options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.72])
    written = 1
    if step > 0 { while nextWrite <= t + 1e-6 { nextWrite += step } }
  }
  csv += String(format: "%d,%.4f,%.3f,%d\n", i, t, d, written)
  i += 1
}
if reader.status == .failed { print("reader failed: \(String(describing: reader.error))") }
try csv.write(to: outDir.appendingPathComponent("frames.csv"), atomically: true, encoding: .utf8)
print("frames \(i)")
