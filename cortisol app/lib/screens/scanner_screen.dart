import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import '../services/demographics_service.dart';
import '../utils/expression_classifier.dart';
import '../widgets/face_painter.dart';
import '../utils/roast_generator.dart';
import '../utils/contextual_roast_engine.dart';
import '../services/device_context_service.dart';
import 'result_screen.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen>
    with TickerProviderStateMixin {
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  bool _isCameraReady = false;
  bool _isScanning = false;
  bool _isProcessing = false;
  bool _faceDetected = false;

  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableClassification: true,
      enableContours: true,
      performanceMode: FaceDetectorMode.accurate,
    ),
  );

  List<Face> _faces = [];
  Size? _imageSize;

  // Expression tracking
  FaceExpression? _liveExpression; // real-time display
  String? _liveExpressionRoast; // live text to show
  DateTime _lastRoastTime = DateTime.fromMillisecondsSinceEpoch(0);
  final List<double> _smilingReadings = [];
  final List<double> _leftEyeReadings = [];
  final List<double> _rightEyeReadings = [];
  final List<double> _headYReadings = [];
  final List<double> _headZReadings = [];

  // Demographics (TFLite)
  final DemographicsService _demographicsService = DemographicsService();
  DemographicCategory? _detectedDemographic;
  DateTime _lastDemoTime = DateTime.fromMillisecondsSinceEpoch(0);

  late AnimationController _scanLineController;
  late AnimationController _progressController;
  double _scanProgress = 0;

  // For face-lost pause
  bool _scanPaused = false;
  int _faceLostFrames = 0;
  static const int _faceLostThreshold = 8;

  @override
  void initState() {
    super.initState();
    _scanLineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );

    _progressController.addListener(() {
      setState(() {
        _scanProgress = _progressController.value;
      });
    });

    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _onScanComplete();
      }
    });

    _initCamera();
    _initDemographics();
  }

  Future<void> _initDemographics() async {
    try {
      await _demographicsService.initialize();
      debugPrint('Demographics TFLite models loaded successfully');
    } catch (e) {
      debugPrint('Demographics init failed (non-fatal): $e');
    }
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) return;

      final frontCamera = _cameras.firstWhere(
        (cam) => cam.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.nv21,
      );

      await _cameraController!.initialize();
      if (!mounted) return;

      setState(() {
        _isCameraReady = true;
      });

      _startPassiveFaceDetection();
    } catch (e) {
      debugPrint('Camera init error: $e');
    }
  }

  void _startPassiveFaceDetection() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    _cameraController!.startImageStream((CameraImage image) {
      if (_isProcessing) return;
      _isProcessing = true;
      _processImage(image);
    });
  }

  void _startScan() {
    if (_isScanning || !_isCameraReady || !_faceDetected) return;

    setState(() {
      _isScanning = true;
      _scanProgress = 0;
      _scanPaused = false;
      _smilingReadings.clear();
      _leftEyeReadings.clear();
      _rightEyeReadings.clear();
      _headYReadings.clear();
      _headZReadings.clear();
      _faceLostFrames = 0;
    });

    _progressController.forward(from: 0);
  }

  Future<void> _processImage(CameraImage image) async {
    try {
      final inputImage = _convertCameraImage(image);
      if (inputImage == null) {
        _isProcessing = false;
        return;
      }

      final faces = await _faceDetector.processImage(inputImage);

      if (mounted) {
        final hasFace = faces.isNotEmpty;

        // Classify live expression for real-time display
        FaceExpression? expr;
        if (hasFace) {
          expr = ExpressionClassifier.classify(faces.first);
        }

        // Run demographics estimation once per second (non-blocking)
        final now = DateTime.now();
        if (hasFace && _demographicsService.isReady &&
            now.difference(_lastDemoTime).inMilliseconds > 1000) {
          _lastDemoTime = now;
          final demo = _demographicsService.estimate(image, faces.first);
          if (demo != null) {
            _detectedDemographic = demo;
          }
        }

        setState(() {
          _faces = faces;
          _faceDetected = hasFace;
          
          if (_liveExpression != expr) {
            // Require the text to stay on screen for at least 3 seconds 
            // to ensure it can be read, unless this is the very first time.
            if (_liveExpressionRoast == null || now.difference(_lastRoastTime).inMilliseconds > 3000) {
              _liveExpression = expr;
              // Prefer demographic roast if available, else expression roast
              _liveExpressionRoast = RoastGenerator.getDemographicRoast(_detectedDemographic)
                  ?? RoastGenerator.getExpressionRoast(expr);
              _lastRoastTime = now;
            }
          }
          _imageSize = Size(
            image.width.toDouble(),
            image.height.toDouble(),
          );
        });

        // If scanning, collect data and manage pause/resume
        if (_isScanning) {
          if (hasFace) {
            _faceLostFrames = 0;
            final face = faces.first;

            // Collect all expression data points
            if (face.smilingProbability != null) {
              _smilingReadings.add(face.smilingProbability!);
            }
            if (face.leftEyeOpenProbability != null) {
              _leftEyeReadings.add(face.leftEyeOpenProbability!);
            }
            if (face.rightEyeOpenProbability != null) {
              _rightEyeReadings.add(face.rightEyeOpenProbability!);
            }
            if (face.headEulerAngleY != null) {
              _headYReadings.add(face.headEulerAngleY!);
            }
            if (face.headEulerAngleZ != null) {
              _headZReadings.add(face.headEulerAngleZ!);
            }

            if (_scanPaused) {
              setState(() => _scanPaused = false);
              _progressController.forward();
            }
          } else {
            _faceLostFrames++;
            if (_faceLostFrames >= _faceLostThreshold && !_scanPaused) {
              setState(() => _scanPaused = true);
              _progressController.stop();
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Face detection error: $e');
    } finally {
      _isProcessing = false;
    }
  }

  InputImage? _convertCameraImage(CameraImage image) {
    final camera = _cameras.firstWhere(
      (cam) => cam.lensDirection == CameraLensDirection.front,
      orElse: () => _cameras.first,
    );

    final sensorOrientation = camera.sensorOrientation;
    InputImageRotation? rotation;

    switch (sensorOrientation) {
      case 0:
        rotation = InputImageRotation.rotation0deg;
        break;
      case 90:
        rotation = InputImageRotation.rotation90deg;
        break;
      case 180:
        rotation = InputImageRotation.rotation180deg;
        break;
      case 270:
        rotation = InputImageRotation.rotation270deg;
        break;
      default:
        rotation = InputImageRotation.rotation0deg;
    }

    const format = InputImageFormat.nv21;
    final plane = image.planes.first;

    return InputImage.fromBytes(
      bytes: plane.bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: plane.bytesPerRow,
      ),
    );
  }

  double _average(List<double> list) {
    if (list.isEmpty) return 0.5;
    return list.reduce((a, b) => a + b) / list.length;
  }

  void _onScanComplete() async {
    try {
      await _cameraController?.stopImageStream();
    } catch (_) {}

    if (!mounted) return;

    // Compute averages
    final avgSmile = _average(_smilingReadings);
    final avgLeftEye = _average(_leftEyeReadings);
    final avgRightEye = _average(_rightEyeReadings);
    final avgHeadY = _average(_headYReadings);
    final avgHeadZ = _average(_headZReadings);

    // Get device context
    final deviceContext = await DeviceContextService.getContext();

    // Classify expression from averaged data
    final expression = ExpressionClassifier.classifyFromAverages(
      avgSmile: avgSmile,
      avgLeftEye: avgLeftEye,
      avgRightEye: avgRightEye,
      avgHeadY: avgHeadY,
      avgHeadZ: avgHeadZ,
    );

    final cortisolLevel = RoastGenerator.generateCortisolLevel(expression);
    
    // Generate contextual roast!
    final contextualRoast = ContextualRoastEngine.generateRoast(
      cortisolScore: cortisolLevel,
      context: deviceContext,
      expression: expression,
      demographic: _detectedDemographic,
    );

    // Demographic roast takes priority, then expression roast, then fallback
    final expressionRoastText = RoastGenerator.getDemographicRoast(_detectedDemographic)
        ?? RoastGenerator.getExpressionRoast(expression)
        ?? 'A face so mid the AI gave up trying to roast it.';

    final tier = RoastGenerator.getTier(cortisolLevel);
    final tierColor = Color(RoastGenerator.getTierColorHex(cortisolLevel));

    if (mounted) {
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => ResultScreen(
            cortisolLevel: cortisolLevel,
            roast: contextualRoast,
            tier: tier,
            tierColor: tierColor,
            smilingProbability: avgSmile,
            expressionLabel: expressionRoastText,
          ),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _faceDetector.close();
    _demographicsService.dispose();
    _scanLineController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF111111),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera preview
          if (_isCameraReady && _cameraController != null)
            ClipRRect(
              child: OverflowBox(
                alignment: Alignment.center,
                child: FittedBox(
                  fit: BoxFit.cover,
                  child: SizedBox(
                    width: _cameraController!.value.previewSize?.height ?? 0,
                    height: _cameraController!.value.previewSize?.width ?? 0,
                    child: CameraPreview(_cameraController!),
                  ),
                ),
              ),
            )
          else
            const Center(
              child: CircularProgressIndicator(
                color: Color(0xFFFF453A),
              ),
            ),

          // Vignette
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.5),
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.6),
                ],
                stops: const [0, 0.15, 0.75, 1.0],
              ),
            ),
          ),

          // Face detection overlay
          if (_faces.isNotEmpty && _imageSize != null)
            CustomPaint(
              painter: FaceScanPainter(
                faces: _faces,
                imageSize: _imageSize!,
                widgetSize: MediaQuery.of(context).size,
                progress: _scanProgress,
                isFrontCamera: true,
              ),
            ),

          // Scan sweep line
          if (_isScanning && !_scanPaused)
            AnimatedBuilder(
              animation: _scanLineController,
              builder: (context, child) {
                final screenHeight = MediaQuery.of(context).size.height;
                return Positioned(
                  top: _scanLineController.value * screenHeight,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 2,
                    color: Colors.white.withValues(alpha: 0.6),
                  ),
                );
              },
            ),

          // Top UI
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back button
                  Material(
                    color: Colors.black.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      onTap: () => Navigator.pop(context),
                      borderRadius: BorderRadius.circular(12),
                      child: const SizedBox(
                        width: 40,
                        height: 40,
                        child: Icon(Icons.arrow_back_ios_new,
                            color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                  // Status pill
                  if (_isScanning)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: _scanPaused
                            ? const Color(0xFFFF9500)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 12,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_scanPaused) ...[
                            const Icon(Icons.warning_amber_rounded,
                                size: 14, color: Colors.white),
                            const SizedBox(width: 6),
                            const Text(
                              'Face lost — look at camera',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ] else ...[
                            SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: const Color(0xFFFF453A),
                                value: _scanProgress,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Analyzing ${(_scanProgress * 100).toInt()}%',
                              style: const TextStyle(
                                color: Color(0xFF000000),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Bottom controls
          if (!_isScanning)
            Positioned(
              bottom: 60,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  // Live expression label
                  if (_faceDetected && _liveExpression != null)
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: Container(
                        key: ValueKey(_liveExpressionRoast ?? _liveExpression),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        margin: const EdgeInsets.symmetric(horizontal: 24),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          _liveExpressionRoast ?? 'Analyzing your mid face...',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontStyle: FontStyle.italic,
                            fontWeight: FontWeight.w600,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ),

                  const SizedBox(height: 12),

                  // Face detection status
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    child: _faceDetected
                        ? const Row(
                            key: ValueKey('detected'),
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.check_circle,
                                  color: Color(0xFF34C759), size: 16),
                              SizedBox(width: 6),
                              Text(
                                'Face detected — ready to scan',
                                style: TextStyle(
                                  color: Color(0xFF34C759),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          )
                        : const Row(
                            key: ValueKey('not_detected'),
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.face_retouching_off,
                                  color: Color(0xFFFF9500), size: 16),
                              SizedBox(width: 6),
                              Text(
                                'No face detected — look at camera',
                                style: TextStyle(
                                  color: Color(0xFFFF9500),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                  ),

                  const SizedBox(height: 24),

                  // Scan button
                  GestureDetector(
                    onTap: _faceDetected ? _startScan : null,
                    child: AnimatedOpacity(
                      duration: const Duration(milliseconds: 300),
                      opacity: _faceDetected ? 1.0 : 0.4,
                      child: Container(
                        width: 76,
                        height: 76,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFFF453A),
                        ),
                        child: const Icon(
                          Icons.analytics_outlined,
                          size: 32,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Live expression during scan
          if (_isScanning && _liveExpression != null && !_scanPaused)
            Positioned(
              bottom: 40,
              left: 0,
              right: 0,
              child: Center(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Container(
                    key: ValueKey(_liveExpressionRoast ?? _liveExpression),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    margin: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      _liveExpressionRoast ?? 'Analyzing your mid face...',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // Progress bar
          if (_isScanning)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                value: _scanProgress,
                backgroundColor: Colors.transparent,
                color: _scanPaused
                    ? const Color(0xFFFF9500)
                    : const Color(0xFFFF453A),
                minHeight: 3,
              ),
            ),
        ],
      ),
    );
  }
}
