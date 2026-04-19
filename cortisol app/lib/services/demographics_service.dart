import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';

/// Demographic category combining age bracket and gender.
enum DemographicCategory {
  child,       // 4–11
  teenMale,    // 12–19 male
  teenFemale,  // 12–19 female
  adultMale,   // 20–45 male
  adultFemale, // 20–45 female
  boomerMale,  // 46+ male
  boomerFemale,// 46+ female
}

/// Offline age & gender estimation using TFLite models.
class DemographicsService {
  Interpreter? _ageInterpreter;
  Interpreter? _genderInterpreter;
  bool _isReady = false;

  /// Age bracket labels matching the model's 9-class output.
  static const _ageLabels = [
    '4-6', '7-8', '9-11', '12-19', '20-27', '28-35', '36-45', '46-60', '61-75',
  ];

  /// Gender labels: index 0 = Female, index 1 = Male.
  static const _genderLabels = ['female', 'male'];

  bool get isReady => _isReady;

  /// Load both TFLite models from assets.
  Future<void> initialize() async {
    try {
      _ageInterpreter = await Interpreter.fromAsset('models/age.tflite');
      _genderInterpreter = await Interpreter.fromAsset('models/gender.tflite');
      _isReady = true;
    } catch (e) {
      _isReady = false;
      rethrow;
    }
  }

  /// Estimate demographics from a camera frame and a detected face's bounding box.
  /// Returns null if inference fails for any reason.
  DemographicCategory? estimate(CameraImage cameraImage, Face face) {
    if (!_isReady) return null;

    try {
      // 1. Convert CameraImage (YUV420) to img.Image (RGB)
      final rgbImage = _convertCameraImage(cameraImage);
      if (rgbImage == null) return null;

      // 2. Crop to the face bounding box
      final box = face.boundingBox;
      final x = box.left.toInt().clamp(0, rgbImage.width - 1);
      final y = box.top.toInt().clamp(0, rgbImage.height - 1);
      final w = box.width.toInt().clamp(1, rgbImage.width - x);
      final h = box.height.toInt().clamp(1, rgbImage.height - y);
      final cropped = img.copyCrop(rgbImage, x: x, y: y, width: w, height: h);

      // 3. Resize to 224x224
      final resized = img.copyResize(cropped, width: 224, height: 224);

      // 4. Normalize to [0, 1] and create Float32 input tensor [1, 224, 224, 3]
      final input = Float32List(1 * 224 * 224 * 3);
      int idx = 0;
      for (int py = 0; py < 224; py++) {
        for (int px = 0; px < 224; px++) {
          final pixel = resized.getPixel(px, py);
          input[idx++] = pixel.r / 255.0;
          input[idx++] = pixel.g / 255.0;
          input[idx++] = pixel.b / 255.0;
        }
      }
      final inputTensor = input.reshape([1, 224, 224, 3]);

      // 5. Run age model
      final ageOutput = List.filled(1 * _ageLabels.length, 0.0).reshape([1, _ageLabels.length]);
      _ageInterpreter!.run(inputTensor, ageOutput);
      final ageProbs = (ageOutput[0] as List<double>);
      final ageIndex = _argMax(ageProbs);

      // 6. Run gender model
      final genderOutput = List.filled(1 * _genderLabels.length, 0.0).reshape([1, _genderLabels.length]);
      _genderInterpreter!.run(inputTensor, genderOutput);
      final genderProbs = (genderOutput[0] as List<double>);
      final genderIndex = _argMax(genderProbs);

      // 7. Map to DemographicCategory
      final isMale = genderIndex == 1;

      // Age categories: 0='4-6', 1='7-8', 2='9-11' → child
      //                  3='12-19' → teen
      //                  4='20-27', 5='28-35', 6='36-45' → adult
      //                  7='46-60', 8='61-75' → boomer
      if (ageIndex <= 2) {
        return DemographicCategory.child;
      } else if (ageIndex == 3) {
        return isMale ? DemographicCategory.teenMale : DemographicCategory.teenFemale;
      } else if (ageIndex <= 6) {
        return isMale ? DemographicCategory.adultMale : DemographicCategory.adultFemale;
      } else {
        return isMale ? DemographicCategory.boomerMale : DemographicCategory.boomerFemale;
      }
    } catch (e) {
      return null;
    }
  }

  int _argMax(List<double> list) {
    int maxIdx = 0;
    double maxVal = list[0];
    for (int i = 1; i < list.length; i++) {
      if (list[i] > maxVal) {
        maxVal = list[i];
        maxIdx = i;
      }
    }
    return maxIdx;
  }

  /// Convert CameraImage (YUV420 / BGRA8888) to an img.Image (RGB).
  img.Image? _convertCameraImage(CameraImage image) {
    try {
      if (image.format.group == ImageFormatGroup.yuv420) {
        return _convertYUV420(image);
      } else if (image.format.group == ImageFormatGroup.bgra8888) {
        return _convertBGRA8888(image);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  img.Image _convertYUV420(CameraImage image) {
    final int width = image.width;
    final int height = image.height;
    final result = img.Image(width: width, height: height);

    final yPlane = image.planes[0].bytes;
    final uPlane = image.planes[1].bytes;
    final vPlane = image.planes[2].bytes;

    final yRowStride = image.planes[0].bytesPerRow;
    final uvRowStride = image.planes[1].bytesPerRow;
    final uvPixelStride = image.planes[1].bytesPerPixel ?? 1;

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        final yIndex = y * yRowStride + x;
        final uvIndex = (y ~/ 2) * uvRowStride + (x ~/ 2) * uvPixelStride;

        final yVal = yPlane[yIndex];
        final uVal = uPlane[uvIndex];
        final vVal = vPlane[uvIndex];

        int r = (yVal + 1.370705 * (vVal - 128)).round().clamp(0, 255);
        int g = (yVal - 0.337633 * (uVal - 128) - 0.698001 * (vVal - 128)).round().clamp(0, 255);
        int b = (yVal + 1.732446 * (uVal - 128)).round().clamp(0, 255);

        result.setPixelRgb(x, y, r, g, b);
      }
    }
    return result;
  }

  img.Image _convertBGRA8888(CameraImage image) {
    final bytes = image.planes[0].bytes;
    return img.Image.fromBytes(
      width: image.width,
      height: image.height,
      bytes: bytes.buffer,
      order: img.ChannelOrder.bgra,
    );
  }

  void dispose() {
    _ageInterpreter?.close();
    _genderInterpreter?.close();
  }
}
