// hevc_alpha — transcode a ProRes 4444 (RGBA) .mov to HEVC-with-alpha .mp4 with a short keyframe interval,
// so Safari can scrub it by scroll (video.currentTime) without stutter. avconvert cannot set the GOP.
//   usage: hevc_alpha in.mov out.mp4 [maxKeyFrameInterval=1] [quality=0.9]
import AVFoundation
import Foundation
import VideoToolbox

let args = CommandLine.arguments
guard args.count >= 3 else { FileHandle.standardError.write("usage: hevc_alpha in.mov out.mp4 [gop] [quality]\n".data(using: .utf8)!); exit(2) }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let gop = args.count > 3 ? Int(args[3]) ?? 1 : 1
let quality = args.count > 4 ? Double(args[4]) ?? 0.9 : 0.9
try? FileManager.default.removeItem(at: outURL)

let asset = AVURLAsset(url: inURL)
let sem = DispatchSemaphore(value: 0)
var exitCode: Int32 = 0
Task {
    do {
        let tracks = try await asset.loadTracks(withMediaType: .video)
        guard let track = tracks.first else { throw NSError(domain: "hevc_alpha", code: 1, userInfo: [NSLocalizedDescriptionKey: "no video track"]) }
        let size = try await track.load(.naturalSize)
        let fps = try await track.load(.nominalFrameRate)
        let reader = try AVAssetReader(asset: asset)
        let readerOutput = AVAssetReaderTrackOutput(track: track, outputSettings: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        ])
        readerOutput.alwaysCopiesSampleData = false
        reader.add(readerOutput)

        let writer = try AVAssetWriter(outputURL: outURL, fileType: .mov)
        let settings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.hevcWithAlpha,
            AVVideoWidthKey: Int(size.width),
            AVVideoHeightKey: Int(size.height),
            AVVideoCompressionPropertiesKey: [
                AVVideoQualityKey: quality,
                AVVideoMaxKeyFrameIntervalKey: gop,
                AVVideoAllowFrameReorderingKey: false,
                AVVideoExpectedSourceFrameRateKey: Int(fps.rounded()),
            ],
        ]
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        input.expectsMediaDataInRealTime = false
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
            kCVPixelBufferWidthKey as String: Int(size.width),
            kCVPixelBufferHeightKey as String: Int(size.height),
        ])
        writer.add(input)
        guard writer.startWriting() else { throw writer.error ?? NSError(domain: "hevc_alpha", code: 2) }
        writer.startSession(atSourceTime: .zero)
        guard reader.startReading() else { throw reader.error ?? NSError(domain: "hevc_alpha", code: 3) }
        var n = 0
        while let sample = readerOutput.copyNextSampleBuffer() {
            while !input.isReadyForMoreMediaData { usleep(2000) }
            let pts = CMSampleBufferGetPresentationTimeStamp(sample)
            if let pb = CMSampleBufferGetImageBuffer(sample) {
                if !adaptor.append(pb, withPresentationTime: pts) { throw writer.error ?? NSError(domain: "hevc_alpha", code: 4) }
                n += 1
            }
        }
        input.markAsFinished()
        await writer.finishWriting()
        if writer.status != .completed { throw writer.error ?? NSError(domain: "hevc_alpha", code: 5) }
        print("hevc_alpha: wrote \(n) frames, \(Int(size.width))x\(Int(size.height)) @ \(fps) fps, gop \(gop), quality \(quality) -> \(outURL.path)")
        // remux (no re-encode) into a real MP4 container when the output name ends in .mp4
        if outURL.pathExtension.lowercased() == "mp4" {
            let movURL = outURL.deletingPathExtension().appendingPathExtension("tmp.mov")
            try? FileManager.default.removeItem(at: movURL)
            try FileManager.default.moveItem(at: outURL, to: movURL)
            guard let ex = AVAssetExportSession(asset: AVURLAsset(url: movURL), presetName: AVAssetExportPresetPassthrough) else { throw NSError(domain: "hevc_alpha", code: 6) }
            ex.outputURL = outURL
            ex.outputFileType = .mp4
            ex.shouldOptimizeForNetworkUse = true
            await ex.export()
            if ex.status != .completed { throw ex.error ?? NSError(domain: "hevc_alpha", code: 7, userInfo: [NSLocalizedDescriptionKey: "passthrough remux to mp4 failed"]) }
            try? FileManager.default.removeItem(at: movURL)
            print("hevc_alpha: remuxed to MP4 (passthrough) -> \(outURL.path)")
        }
    } catch {
        FileHandle.standardError.write("hevc_alpha error: \(error)\n".data(using: .utf8)!)
        exitCode = 1
    }
    sem.signal()
}
sem.wait()
exit(exitCode)
