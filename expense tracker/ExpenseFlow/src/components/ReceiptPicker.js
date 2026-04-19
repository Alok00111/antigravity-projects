// File: src/components/ReceiptPicker.js

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE } from '../utils/constants';
import ReceiptViewer from './ReceiptViewer';
import { useAlert } from '../context/AlertContext';
import ocrService from '../services/ocrService';

const ReceiptPicker = ({ receiptUri, onPick, onRemove, onScanResult }) => {
    const { colors } = useTheme();
    const { showAlert } = useAlert();
    const [viewerVisible, setViewerVisible] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const pickImage = async (useCamera) => {
        try {
            let result;
            if (useCamera) {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    showAlert({ title: 'Permission Needed', message: 'Camera access is required to take receipt photos.', type: 'warning' });
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.7,
                    allowsEditing: true,
                });
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    showAlert({ title: 'Permission Needed', message: 'Photo library access is required to pick receipt images.', type: 'warning' });
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.7,
                    allowsEditing: true,
                });
            }

            if (!result.canceled && result.assets?.[0]?.uri) {
                onPick(result.assets[0].uri);
            }
        } catch (error) {
            showAlert({ title: 'Error', message: 'Failed to pick image. Please try again.', type: 'error' });
        }
    };

    const showOptions = () => {
        showAlert({
            title: 'Add Receipt',
            message: 'Choose a source',
            type: 'info',
            buttons: [
                { text: 'Camera', onPress: () => pickImage(true) },
                { text: 'Photo Library', onPress: () => pickImage(false) },
                { text: 'Cancel', style: 'cancel' },
            ],
        });
    };

    const handleScanReceipt = async () => {
        if (!receiptUri) {
            showAlert({ title: 'No Receipt', message: 'Please add a receipt image first.', type: 'warning' });
            return;
        }
        setIsScanning(true);
        try {
            const result = await ocrService.parseReceiptFromUri(receiptUri);
            if (result.error) {
                showAlert({ title: 'Scan Issue', message: result.error, type: 'warning' });
            } else if (result.amount || result.note) {
                if (onScanResult) onScanResult(result);
                showAlert({
                    title: '✅ Receipt Scanned!',
                    message: `Amount: ${result.amount ? `₹${result.amount}` : 'Not found'}\nMerchant: ${result.note || 'Not found'}`,
                    type: 'success',
                });
            } else {
                showAlert({ title: 'No Data Found', message: 'Could not extract data from this receipt. Try a clearer photo.', type: 'warning' });
            }
        } catch (e) {
            showAlert({ title: 'Error', message: 'OCR scan failed. Please check your internet connection and try again.', type: 'error' });
        } finally {
            setIsScanning(false);
        }
    };

    if (receiptUri) {
        return (
            <View style={styles.container}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Receipt</Text>
                <View style={styles.previewRow}>
                    <TouchableOpacity
                        onPress={() => setViewerVisible(true)}
                        activeOpacity={0.8}
                    >
                        <Image source={{ uri: receiptUri }} style={[styles.thumbnail, { borderColor: colors.border }]} />
                    </TouchableOpacity>
                    <View style={styles.previewActions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: `${colors.primary}18` }]}
                            onPress={showOptions}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
                            <Text style={[styles.actionText, { color: colors.primary }]}>Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: `${colors.accent || '#8B5CF6'}18` }]}
                            onPress={handleScanReceipt}
                            activeOpacity={0.7}
                            disabled={isScanning}
                        >
                            {isScanning ? (
                                <ActivityIndicator size="small" color={colors.accent || '#8B5CF6'} />
                            ) : (
                                <Ionicons name="scan-outline" size={18} color={colors.accent || '#8B5CF6'} />
                            )}
                            <Text style={[styles.actionText, { color: colors.accent || '#8B5CF6' }]}>
                                {isScanning ? 'Scanning...' : 'Scan & Auto-fill'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: `${colors.danger}18` }]}
                            onPress={onRemove}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            <Text style={[styles.actionText, { color: colors.danger }]}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <ReceiptViewer
                    visible={viewerVisible}
                    uri={receiptUri}
                    onClose={() => setViewerVisible(false)}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Receipt (optional)</Text>
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={showOptions}
                activeOpacity={0.7}
            >
                <View style={[styles.addIcon, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons name="camera-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.addInfo}>
                    <Text style={[styles.addTitle, { color: colors.text }]}>Add Receipt Photo</Text>
                    <Text style={[styles.addSubtitle, { color: colors.textSecondary }]}>
                        Take a photo or pick from gallery
                    </Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    addIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    addTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    addSubtitle: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 1,
    },
    previewActions: {
        flex: 1,
        gap: SPACING.sm,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 10,
    },
    actionText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
    },
});

export default ReceiptPicker;
