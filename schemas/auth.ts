import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'E-posta adresi gerekli')
        .email('Geçerli bir e-posta adresi giriniz'),
    password: z
        .string()
        .min(6, 'Şifre en az 6 karakter olmalı')
        .max(50, 'Şifre çok uzun'),
});

export const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'İsim en az 2 karakter olmalı')
        .max(50, 'İsim çok uzun'),
    email: z
        .string()
        .min(1, 'E-posta adresi gerekli')
        .email('Geçerli bir e-posta adresi giriniz'),
    password: z
        .string()
        .min(6, 'Şifre en az 6 karakter olmalı')
        .regex(/[A-Z]/, 'Şifrede en az bir büyük harf olmalı')
        .regex(/[0-9]/, 'Şifrede en az bir rakam olmalı'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;