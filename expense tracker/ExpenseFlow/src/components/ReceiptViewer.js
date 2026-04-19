// File: src/components/ReceiptViewer.js

import React from 'react';
import {
    Modal,
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ReceiptViewer = ({ visible, uri, onClose }) => {
    if (!uri) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={36} color="#FFF" />
                </TouchableOpacity>
                <Image
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    image: {
        width: SCREEN_WIDTH - 32,
        height: SCREEN_HEIGHT * 0.7,
        borderRadius: 12,
    },
});

export default ReceiptViewer;
