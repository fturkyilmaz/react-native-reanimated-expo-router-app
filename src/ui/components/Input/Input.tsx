/**
 * Input Component
 * Reusable input field with validation states
 */

import { COLORS, SPACING, TYPOGRAPHY } from '@/core/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps {
    /** Label text */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Input value */
    value: string;
    /** Callback when text changes */
    onChangeText: (text: string) => void;
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'number';
    /** Error message */
    error?: string;
    /** Whether field is required */
    required?: boolean;
    /** Additional description */
    description?: string;
    /** Whether input is disabled */
    disabled?: boolean;
    /** Input size */
    size?: InputSize;
    /** Left icon name */
    leftIcon?: string;
    /** Right icon name */
    rightIcon?: string;
    /** Callback when right icon is pressed */
    onRightIconPress?: () => void;
    /** Keyboard type */
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    /** Return key type */
    returnKeyType?: 'done' | 'next' | 'go' | 'search' | 'send';
    /** Callback on submit editing */
    onSubmitEditing?: () => void;
    /** Auto focus */
    autoFocus?: boolean;
    /** Maximum length */
    maxLength?: number;
    /** Test ID */
    testID?: string;
    /** Additional styles */
    style?: StyleProp<ViewStyle>;
    /** Additional input styles */
    inputStyle?: StyleProp<TextStyle>;
}

export const Input = forwardRef<TextInput, InputProps>(
    (
        {
            label,
            placeholder,
            value,
            onChangeText,
            type = 'text',
            error,
            required,
            description,
            disabled,
            size = 'md',
            leftIcon,
            rightIcon,
            onRightIconPress,
            keyboardType = 'default',
            returnKeyType,
            onSubmitEditing,
            autoFocus,
            maxLength,
            testID,
            style,
            inputStyle,
        },
        ref
    ) => {
        const [isFocused, setIsFocused] = useState(false);
        const [isSecure, setIsSecure] = useState(type === 'password');

        const sizeStyles = {
            sm: { height: 40, padding: SPACING.sm, fontSize: 14 },
            md: { height: 48, padding: SPACING.md, fontSize: 16 },
            lg: { height: 56, padding: SPACING.lg, fontSize: 18 },
        };

        const handleClear = () => {
            onChangeText('');
        };

        return (
            <View style={[styles.container, style]}>
                {label && (
                    <Text style={styles.label}>
                        {label}
                        {required && <Text style={styles.required}> *</Text>}
                    </Text>
                )}

                <View
                    style={[
                        styles.inputContainer,
                        { height: sizeStyles[size].height },
                        isFocused && styles.focused,
                        error && styles.error,
                        disabled && styles.disabled,
                    ]}
                >
                    {leftIcon && (
                        <Ionicons
                            name={leftIcon as any}
                            size={20}
                            color={COLORS.textSecondary}
                            style={styles.leftIcon}
                        />
                    )}

                    <TextInput
                        ref={ref}
                        style={[
                            styles.input,
                            {
                                paddingHorizontal: sizeStyles[size].padding,
                                fontSize: sizeStyles[size].fontSize,
                            },
                            inputStyle,
                        ]}
                        placeholder={placeholder}
                        placeholderTextColor={COLORS.textTertiary}
                        value={value}
                        onChangeText={onChangeText}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        secureTextEntry={isSecure}
                        keyboardType={keyboardType}
                        returnKeyType={returnKeyType}
                        onSubmitEditing={onSubmitEditing}
                        autoFocus={autoFocus}
                        maxLength={maxLength}
                        editable={!disabled}
                        accessibilityLabel={label || placeholder}
                        testID={testID}
                    />

                    {rightIcon ? (
                        <Pressable onPress={onRightIconPress} style={styles.rightIconPressable}>
                            <Ionicons
                                name={rightIcon as any}
                                size={20}
                                color={COLORS.textSecondary}
                            />
                        </Pressable>
                    ) : type === 'password' && value.length > 0 ? (
                        <Pressable onPress={() => setIsSecure(!isSecure)} style={styles.rightIconPressable}>
                            <Ionicons
                                name={isSecure ? 'eye-off' : 'eye'}
                                size={20}
                                color={COLORS.textSecondary}
                            />
                        </Pressable>
                    ) : value.length > 0 ? (
                        <Pressable onPress={handleClear} style={styles.rightIconPressable}>
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color={COLORS.textSecondary}
                            />
                        </Pressable>
                    ) : null}
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                {description && !error && (
                    <Text style={styles.description}>{description}</Text>
                )}
            </View>
        );
    }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.labelMedium,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    required: {
        color: COLORS.error,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray700,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontWeight: '400',
    },
    leftIcon: {
        marginLeft: SPACING.md,
    },
    rightIconPressable: {
        padding: SPACING.sm,
        marginRight: SPACING.sm,
    },
    focused: {
        borderColor: COLORS.primary,
    },
    error: {
        borderColor: COLORS.error,
    },
    disabled: {
        backgroundColor: COLORS.backgroundTertiary,
        opacity: 0.6,
    },
    errorText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    description: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
});

export default Input;
