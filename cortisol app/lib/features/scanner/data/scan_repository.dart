import 'package:cloud_firestore/cloud_firestore.dart';
import '../domain/scan_model.dart';

/// Repository for saving and retrieving scan results from Firestore.
/// Data is scoped per-user: `/users/{uid}/scans/{scanId}`
class ScanRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Save a scan result to Firestore under the user's document.
  Future<String> saveScan(ScanResult scan) async {
    // Validate score range before writing
    if (scan.cortisolLevel < 100 || scan.cortisolLevel > 999) {
      throw ArgumentError('Cortisol level must be between 100-999');
    }

    final docRef = await _firestore
        .collection('users')
        .doc(scan.userId)
        .collection('scans')
        .add(scan.toMap());

    return docRef.id;
  }

  /// Get scan history for a user, ordered by most recent first.
  /// Supports pagination with [limit] and [startAfter].
  Future<List<ScanResult>> getScanHistory({
    required String userId,
    int limit = 20,
    DocumentSnapshot? startAfter,
  }) async {
    Query query = _firestore
        .collection('users')
        .doc(userId)
        .collection('scans')
        .orderBy('timestamp', descending: true)
        .limit(limit);

    if (startAfter != null) {
      query = query.startAfterDocument(startAfter);
    }

    final snapshot = await query.get();

    return snapshot.docs.map((doc) {
      return ScanResult.fromMap(doc.id, doc.data() as Map<String, dynamic>);
    }).toList();
  }

  /// Get the total number of scans for a user.
  Future<int> getScanCount(String userId) async {
    final snapshot = await _firestore
        .collection('users')
        .doc(userId)
        .collection('scans')
        .count()
        .get();

    return snapshot.count ?? 0;
  }

  /// Delete a specific scan.
  Future<void> deleteScan({
    required String userId,
    required String scanId,
  }) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('scans')
        .doc(scanId)
        .delete();
  }
}
