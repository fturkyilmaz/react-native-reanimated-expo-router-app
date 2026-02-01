import React, { ReactElement, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import { tmdbService } from '@/services/tmdb';
import { usePerformance, useTrace } from './hooks';
import { isInitialized } from './index';
import { logApiError, logLogicError, logUIError } from './instrumentation/errors';
import { withTracing } from './instrumentation/fetch';

/**
 * OpenTelemetry Test Ekranı
 * 
 * Bu bileşen SDK'nın düzgün çalışıp çalışmadığını test etmek için kullanılır.
 * Development ortamında bir ekrana ekleyerek kullanabilirsiniz.
 * 
 * @example
 * // app/(tabs)/settings.tsx veya yeni bir test ekranı
 * import { OtelTestPanel } from '@/otel/testing';
 * 
 * export default function TestScreen() {
 *   return <OtelTestPanel />;
 * }
 */
export function OtelTestPanel(): ReactElement {
    const [logs, setLogs] = useState<string[]>([]);
    const { startSpan, endSpan, recordError, startUserAction } = useTrace();
    const { measureScreenLoad, measureAsync } = usePerformance();

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
    };

    // SDK Durum Kontrolü
    const checkSdkStatus = () => {
        const initialized = isInitialized();
        addLog(`SDK Initialized: ${initialized}`);
        console.log('[OTel Test] SDK Status:', initialized);
    };

    // Basit Span Testi
    const testSimpleSpan = () => {
        const span = startSpan('test.simple_span', { 'test.attribute': 'value' });
        setTimeout(() => {
            endSpan(span, { 'test.result': 'success' });
            addLog('Simple span created and ended');
        }, 100);
    };

    // Hata Span Testi
    const testErrorSpan = () => {
        const span = startSpan('test.error_span');
        setTimeout(() => {
            recordError(span, new Error('Test error message'));
            addLog('Error span created');
        }, 100);
    };

    // Kullanıcı Eylemi Testi
    const testUserAction = () => {
        const span = startUserAction('button_press', 'TestButton', {
            'button.id': 'test-btn-1',
        });
        setTimeout(() => {
            endSpan(span);
            addLog('User action span created');
        }, 100);
    };

    // API Tracing Testi
    const testApiTracing = async () => {
        try {
            addLog('Fetching popular movies...');
            const data = await tmdbService.getPopularMovies(1);
            addLog(`API Success: ${data.results.length} movies`);
        } catch (error) {
            addLog(`API Error: ${(error as Error).message}`);
        }
    };

    // Manuel Fetch Tracing Testi
    const testManualFetchTracing = async () => {
        try {
            addLog('Testing manual fetch tracing...');
            await withTracing(
                () => fetch('https://jsonplaceholder.typicode.com/posts/1'),
                {
                    spanName: 'test.manual_fetch',
                    endpoint: '/posts/1',
                    attributes: { 'test.source': 'manual' },
                }
            );
            addLog('Manual fetch traced successfully');
        } catch (error) {
            addLog(`Manual fetch error: ${(error as Error).message}`);
        }
    };

    // Performans Ölçüm Testi
    const testPerformanceMeasurement = async () => {
        const endMeasurement = measureScreenLoad('TestScreen');

        await new Promise((resolve) => setTimeout(resolve, 500));

        endMeasurement();
        addLog('Performance measurement completed');
    };

    // Async Performans Testi
    const testAsyncPerformance = async () => {
        await measureAsync('test.async_operation', async () => {
            await new Promise((resolve) => setTimeout(resolve, 300));
            return 'success';
        });
        addLog('Async performance measured');
    };

    // API Hata Logging Testi
    const testApiErrorLogging = () => {
        logApiError(
            new Error('Test API Error'),
            '/test/endpoint',
            'GET',
            { 'test.scenario': 'manual_error' }
        );
        addLog('API error logged');
    };

    // UI Hata Logging Testi
    const testUIErrorLogging = () => {
        logUIError(
            new Error('Test UI Error'),
            'TestComponent',
            'render',
            { 'test.scenario': 'manual_error' }
        );
        addLog('UI error logged');
    };

    // Logic Hata Logging Testi
    const testLogicErrorLogging = () => {
        logLogicError(
            new Error('Test Logic Error'),
            'data_processing',
            { 'test.scenario': 'manual_error' }
        );
        addLog('Logic error logged');
    };

    // Tüm Testleri Çalıştır
    const runAllTests = async () => {
        addLog('=== Starting all tests ===');
        checkSdkStatus();
        testSimpleSpan();
        testUserAction();
        await testApiTracing();
        await testPerformanceMeasurement();
        await testAsyncPerformance();
        addLog('=== All tests completed ===');
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>OpenTelemetry Test Panel</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>SDK Status</Text>
                <Button title="Check SDK Status" onPress={checkSdkStatus} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Span Tests</Text>
                <View style={styles.buttonRow}>
                    <Button title="Simple Span" onPress={testSimpleSpan} />
                    <Button title="Error Span" onPress={testErrorSpan} />
                    <Button title="User Action" onPress={testUserAction} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>API Tests</Text>
                <View style={styles.buttonRow}>
                    <Button title="TMDB API" onPress={testApiTracing} />
                    <Button title="Manual Fetch" onPress={testManualFetchTracing} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Tests</Text>
                <View style={styles.buttonRow}>
                    <Button title="Screen Load" onPress={testPerformanceMeasurement} />
                    <Button title="Async Op" onPress={testAsyncPerformance} />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Error Logging Tests</Text>
                <View style={styles.buttonRow}>
                    <Button title="API Error" onPress={testApiErrorLogging} />
                    <Button title="UI Error" onPress={testUIErrorLogging} />
                    <Button title="Logic Error" onPress={testLogicErrorLogging} />
                </View>
            </View>

            <View style={styles.section}>
                <Button title="Run All Tests" onPress={runAllTests} color="#E50914" />
            </View>

            <View style={styles.logSection}>
                <Text style={styles.sectionTitle}>Logs (Console'u da kontrol edin)</Text>
                {logs.map((log, index) => (
                    <Text key={index} style={styles.logText}>{log}</Text>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#121212',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E50914',
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    logSection: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
    },
    logText: {
        color: '#00ff00',
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
});
