import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../scanner/data/scan_repository.dart';
import '../../scanner/domain/scan_model.dart';
import '../../../utils/roast_generator.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen>
    with SingleTickerProviderStateMixin {
  final ScanRepository _scanRepo = ScanRepository();
  List<ScanResult> _scans = [];
  bool _isLoading = true;

  late AnimationController _fadeController;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _loadScans();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _loadScans() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    try {
      final scans = await _scanRepo.getScanHistory(userId: user.uid);
      if (mounted) {
        setState(() {
          _scans = scans;
          _isLoading = false;
        });
        _fadeController.forward();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF2F2F7),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF2F2F7),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Color(0xFF000000)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Scan History',
          style: TextStyle(
            color: Color(0xFF000000),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFF453A)),
            )
          : _scans.isEmpty
              ? _buildEmptyState()
              : FadeTransition(
                  opacity: _fadeController,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _scans.length,
                    itemBuilder: (context, index) {
                      return _buildScanCard(_scans[index], index);
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history,
            size: 64,
            color: Color(0xFFE5E5EA),
          ),
          SizedBox(height: 16),
          Text(
            'No scans yet',
            style: TextStyle(
              fontSize: 18,
              color: Color(0xFF3C3C43),
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Your cortisol readings will appear here',
            style: TextStyle(
              fontSize: 13,
              color: Color(0xFF8E8E93),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanCard(ScanResult scan, int index) {
    final tierColor = Color(RoastGenerator.getTierColorHex(scan.cortisolLevel));
    final timeAgo = _formatTimeAgo(scan.timestamp);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE5E5EA),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: Score + Tier + Time
          Row(
            children: [
              // Score
              Text(
                '${scan.cortisolLevel}',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: tierColor,
                  height: 1,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'ng/dL',
                style: TextStyle(
                  fontSize: 11,
                  color: Color(0xFF8E8E93),
                ),
              ),
              const Spacer(),
              // Tier badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: tierColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${RoastGenerator.getTierEmoji(scan.cortisolLevel)} ${scan.tier}',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Roast
          Text(
            '"${scan.roast}"',
            style: const TextStyle(
              fontSize: 13,
              fontStyle: FontStyle.italic,
              color: Color(0xFF3C3C43),
              height: 1.5,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 10),

          // Timestamp & Expression Label
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                timeAgo,
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF8E8E93),
                ),
              ),
              if (scan.expressionLabel != null)
                Expanded(
                  child: Text(
                    '"${scan.expressionLabel}"',
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF8E8E93),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }
}
