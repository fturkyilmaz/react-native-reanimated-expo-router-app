/**
 * Modal Component
 * Reusable modal dialog with multiple variants
 */

import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '@/core/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Pressable,
    Modal as RNModal,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

export type ModalVariant = 'default' | 'bottom-sheet' | 'centered';
export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ModalProps {
    /** Whether modal is visible */
    visible: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal content */
    children: React.ReactNode;
    /** Modal variant */
    variant?: ModalVariant;
    /** Modal size */
    size?: ModalSize;
    /** Whether to show close button */
    showCloseButton?: boolean;
    /** Whether to close on backdrop press */
    closeOnBackdropPress?: boolean;
    /** Whether to close on escape */
    closeOnEscape?: boolean;
    /** Footer content */
    footer?: React.ReactNode;
    /** Test ID */
    testID?: string;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
}

export function Modal({
    visible,
    onClose,
    title,
    children,
    variant = 'default',
    size = 'md',
    showCloseButton = true,
    closeOnBackdropPress = true,
    closeOnEscape = true,
    footer,
    testID,
    style,
}: ModalProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, fadeAnim]);

    const handleBackdropPress = useCallback(() => {
        if (closeOnBackdropPress) {
            onClose();
        }
    }, [closeOnBackdropPress, onClose]);

    const sizeStyles: Record<ModalSize, { maxWidth?: number }> = {
        sm: { maxWidth: 320 },
        md: { maxWidth: 400 },
        lg: { maxWidth: 520 },
        full: {},
    };

    const renderContent = () => {
        switch (variant) {
            case 'bottom-sheet':
                return (
                    <Animated.View
                        style={[
                            styles.bottomSheet,
                            sizeStyles[size],
                            {
                                opacity: fadeAnim,
                                transform: [
                                    {
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [300, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.bottomSheetHandle} />
                        {title && (
                            <View style={styles.header}>
                                <Text style={styles.title}>{title}</Text>
                                {showCloseButton && (
                                    <Pressable
                                        onPress={onClose}
                                        style={styles.closeButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={24}
                                            color={COLORS.textSecondary}
                                        />
                                    </Pressable>
                                )}
                            </View>
                        )}
                        <View style={styles.content}>{children}</View>
                        {footer && <View style={styles.footer}>{footer}</View>}
                    </Animated.View>
                );

            default:
                return (
                    <Animated.View
                        style={[styles.centeredContainer, { opacity: fadeAnim }]}
                    >
                        <Pressable
                            style={styles.backdrop}
                            onPress={handleBackdropPress}
                            testID="modal-backdrop"
                        />
                        <Animated.View
                            style={[
                                styles.modal,
                                sizeStyles[size],
                                {
                                    opacity: fadeAnim,
                                    transform: [
                                        {
                                            scale: fadeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.95, 1],
                                            }),
                                        },
                                    ],
                                },
                                style,
                            ]}
                            testID={testID}
                        >
                            {title && (
                                <View style={styles.header}>
                                    <Text style={styles.title}>{title}</Text>
                                    {showCloseButton && (
                                        <Pressable
                                            onPress={onClose}
                                            style={styles.closeButton}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons
                                                name="close"
                                                size={20}
                                                color={COLORS.textSecondary}
                                            />
                                        </Pressable>
                                    )}
                                </View>
                            )}
                            <View style={styles.content}>{children}</View>
                            {footer && <View style={styles.footer}>{footer}</View>}
                        </Animated.View>
                    </Animated.View>
                );
        }
    };

    return (
        <RNModal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            supportedOrientations={['portrait', 'landscape']}
        >
            {renderContent()}
        </RNModal>
    );
}

/**
 * Confirmation Modal
 */
interface ConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export function ConfirmModal({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    variant = 'info',
    loading = false,
}: ConfirmModalProps) {
    const confirmVariant =
        variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary';

    return (
        <Modal visible={visible} onClose={onClose} variant="centered" size="sm">
            <View style={styles.confirmContent}>
                <View
                    style={[
                        styles.confirmIcon,
                        {
                            backgroundColor:
                                variant === 'danger'
                                    ? COLORS.errorLight
                                    : variant === 'warning'
                                        ? COLORS.warningLight
                                        : COLORS.infoLight,
                        },
                    ]}
                >
                    <Ionicons
                        name={
                            variant === 'danger'
                                ? 'trash'
                                : variant === 'warning'
                                    ? 'warning'
                                    : 'information-circle'
                        }
                        size={32}
                        color={
                            variant === 'danger'
                                ? COLORS.error
                                : variant === 'warning'
                                    ? COLORS.warning
                                    : COLORS.info
                        }
                    />
                </View>

                <Text style={styles.confirmTitle}>{title}</Text>
                <Text style={styles.confirmMessage}>{message}</Text>

                <View style={styles.confirmButtons}>
                    <Pressable
                        style={[styles.confirmButton, styles.cancelButton]}
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>{cancelText}</Text>
                    </Pressable>
                    <Pressable
                        style={[
                            styles.confirmButton,
                            styles.confirmButtonPrimary,
                            variant === 'danger' && styles.dangerButton,
                            loading && styles.loadingButton,
                        ]}
                        onPress={onConfirm}
                        disabled={loading}
                    >
                        <Text style={styles.confirmButtonText}>{confirmText}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.overlay,
    },
    modal: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        ...SHADOWS.large,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        ...SHADOWS.large,
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.gray600,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: SPACING.sm,
        marginBottom: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray800,
    },
    title: {
        ...TYPOGRAPHY.titleMedium,
        color: COLORS.text,
        flex: 1,
    },
    closeButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.sm,
    },
    content: {
        padding: SPACING.lg,
    },
    footer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray800,
        paddingTop: SPACING.md,
    },
    confirmContent: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    confirmIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    confirmTitle: {
        ...TYPOGRAPHY.titleMedium,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    confirmMessage: {
        ...TYPOGRAPHY.bodyMedium,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.backgroundTertiary,
    },
    cancelButtonText: {
        ...TYPOGRAPHY.labelLarge,
        color: COLORS.text,
    },
    confirmButtonPrimary: {
        backgroundColor: COLORS.primary,
    },
    dangerButton: {
        backgroundColor: COLORS.error,
    },
    confirmButtonText: {
        ...TYPOGRAPHY.labelLarge,
        color: COLORS.white,
    },
    loadingButton: {
        opacity: 0.7,
    },
});

export default Modal;
