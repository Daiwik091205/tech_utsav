import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count > 1 else {
    print("[]")
    exit(0)
}

let imagePath = CommandLine.arguments[1]
guard let image = NSImage(contentsOfFile: imagePath),
      let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let cgImage = bitmap.cgImage else {
    print("[]")
    exit(0)
}

var observations: [[String: Any]] = []
let request = VNRecognizeTextRequest { req, _ in
    guard let results = req.results as? [VNRecognizedTextObservation] else { return }
    let imgW = CGFloat(cgImage.width)
    let imgH = CGFloat(cgImage.height)
    
    for obs in results {
        if let top = obs.topCandidates(1).first {
            // VNRecognizedTextObservation boundingBox is normalized [0,1], origin at bottom-left
            let box = obs.boundingBox
            let x0 = Double(box.origin.x * imgW)
            let y0 = Double((1.0 - box.origin.y - box.size.height) * imgH)
            let x1 = Double((box.origin.x + box.size.width) * imgW)
            let y1 = Double((1.0 - box.origin.y) * imgH)
            
            observations.append([
                "text": top.string,
                "confidence": Double(top.confidence),
                "bbox": [x0, y0, x1, y1]
            ])
        }
    }
}
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try? handler.perform([request])

if let jsonData = try? JSONSerialization.data(withJSONObject: observations, options: []),
   let jsonStr = String(data: jsonData, encoding: .utf8) {
    print(jsonStr)
} else {
    print("[]")
}
