/**
 * SSL Certificate Pinning Module
 * 
 * Provides certificate pinning functionality to prevent MITM attacks
 * by validating server certificates against known public key pins.
 */


/**
 * Pin configuration for a domain
 */
export interface PinConfig {
    /** Domain to pin (e.g., 'api.example.com') */
    domain: string;
    /** Array of SHA-256 hashes of public keys */
    pins: string[];
    /** Optional expiration date for the pins (ISO 8601 format) */
    expirationDate?: string;
    /** Whether to include subdomains */
    includeSubdomains?: boolean;
}

/**
 * Certificate validation result
 */
export interface ValidationResult {
    /** Whether the certificate is valid */
    isValid: boolean;
    /** Domain being validated */
    domain: string;
    /** Error message if validation failed */
    error?: string;
    /** Pin that matched (if any) */
    matchedPin?: string;
}

/**
 * Default pin configurations for known domains
 * 
 * NOTE: These are placeholder pins. In production, you must:
 * 1. Extract the actual SPKI hashes from your server's certificates
 * 2. Use openssl to get the hash: openssl s_client -connect api.themoviedb.org:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
 * 3. Include at least one backup pin from a different CA
 */
const DEFAULT_PIN_CONFIGS: PinConfig[] = [
    {
        domain: 'api.themoviedb.org',
        pins: [
            // Primary pin - replace with actual TMDB certificate hash
            'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            // Backup pin - replace with backup CA certificate hash
            'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
        ],
        includeSubdomains: true,
    },
    {
        domain: 'sentry.io',
        pins: [
            'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
        ],
        includeSubdomains: true,
    },
    {
        domain: 'firebaseinstallations.googleapis.com',
        pins: [
            'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=',
        ],
        includeSubdomains: true,
    },
];

/**
 * SSL Pinning Manager
 * 
 * Manages certificate pinning configuration and validation
 */
export class SSLPinningManager {
    private static instance: SSLPinningManager;
    private configs: Map<string, PinConfig> = new Map();
    private enabled: boolean = true;

    private constructor() {
        // Load default configurations
        DEFAULT_PIN_CONFIGS.forEach(config => {
            this.configs.set(config.domain, config);
        });
    }

    /**
     * Get singleton instance
     */
    static getInstance(): SSLPinningManager {
        if (!SSLPinningManager.instance) {
            SSLPinningManager.instance = new SSLPinningManager();
        }
        return SSLPinningManager.instance;
    }

    /**
     * Enable or disable SSL pinning
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Check if SSL pinning is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Add or update a pin configuration
     */
    addPinConfig(config: PinConfig): void {
        this.configs.set(config.domain, config);
    }

    /**
     * Remove a pin configuration
     */
    removePinConfig(domain: string): void {
        this.configs.delete(domain);
    }

    /**
     * Get pin configuration for a domain
     */
    getPinConfig(domain: string): PinConfig | undefined {
        // Direct match
        if (this.configs.has(domain)) {
            return this.configs.get(domain);
        }

        // Check for subdomain matches
        for (const config of this.configs.values()) {
            if (config.includeSubdomains && domain.endsWith(`.${config.domain}`)) {
                return config;
            }
        }

        return undefined;
    }

    /**
     * Validate a certificate against configured pins
     * 
     * @param hostname - The server hostname
     * @param certificateChain - Array of certificate fingerprints or public key hashes
     * @returns Validation result
     */
    validateCertificate(
        hostname: string,
        certificateChain: string[]
    ): ValidationResult {
        // Skip validation if disabled (development mode)
        if (!this.enabled) {
            return { isValid: true, domain: hostname };
        }

        const config = this.getPinConfig(hostname);

        // If no config exists for this domain, allow it (fail-open for unknown domains)
        // In strict mode, you might want to fail-closed
        if (!config) {
            return {
                isValid: true,
                domain: hostname,
            };
        }

        // Check if pins have expired
        if (config.expirationDate) {
            const expiration = new Date(config.expirationDate);
            if (new Date() > expiration) {
                return {
                    isValid: false,
                    domain: hostname,
                    error: 'Certificate pins have expired',
                };
            }
        }

        // Validate against pins
        for (const cert of certificateChain) {
            for (const pin of config.pins) {
                // Normalize pin format
                const normalizedPin = pin.startsWith('sha256/') ? pin : `sha256/${pin}`;
                const normalizedCert = cert.startsWith('sha256/') ? cert : `sha256/${cert}`;

                if (normalizedPin === normalizedCert) {
                    return {
                        isValid: true,
                        domain: hostname,
                        matchedPin: pin,
                    };
                }
            }
        }

        // No matching pin found
        return {
            isValid: false,
            domain: hostname,
            error: 'Certificate does not match any pinned public key',
        };
    }

    /**
     * Get native configuration for iOS
     * Returns Info.plist compatible configuration
     */
    getIOSConfig(): Record<string, unknown> {
        const config: Record<string, unknown> = {
            NSAllowsArbitraryLoads: false,
            NSExceptionDomains: {},
        };

        for (const pinConfig of this.configs.values()) {
            (config.NSExceptionDomains as Record<string, unknown>)[pinConfig.domain] = {
                NSExceptionMinimumTLSVersion: 'TLSv1.2',
                NSExceptionRequiresForwardSecrecy: true,
                NSExceptionAllowsInsecureHTTPLoads: false,
                NSIncludesSubdomains: pinConfig.includeSubdomains ?? false,
            };
        }

        return config;
    }

    /**
     * Get native configuration for Android
     * Returns network_security_config.xml compatible configuration
     */
    getAndroidConfig(): string {
        let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
        xml += '<network-security-config>\n';

        for (const config of this.configs.values()) {
            xml += '    <domain-config>\n';
            xml += `        <domain includeSubdomains="${config.includeSubdomains ?? false}">${config.domain}</domain>\n`;

            if (config.expirationDate) {
                xml += `        <pin-set expiration="${config.expirationDate}">\n`;
            } else {
                xml += '        <pin-set>\n';
            }

            for (const pin of config.pins) {
                const hash = pin.replace('sha256/', '');
                xml += `            <pin digest="SHA-256">${hash}</pin>\n`;
            }

            xml += '        </pin-set>\n';
            xml += '        <trust-anchors>\n';
            xml += '            <certificates src="system"/>\n';
            xml += '        </trust-anchors>\n';
            xml += '    </domain-config>\n';
        }

        xml += '</network-security-config>';
        return xml;
    }

    /**
     * Clear all configurations
     */
    clearConfigs(): void {
        this.configs.clear();
    }

    /**
     * Get all configured domains
     */
    getConfiguredDomains(): string[] {
        return Array.from(this.configs.keys());
    }
}

/**
 * Hook for React components to access SSL pinning
 */
export function useSSLPinning() {
    const manager = SSLPinningManager.getInstance();

    return {
        validateCertificate: manager.validateCertificate.bind(manager),
        isEnabled: manager.isEnabled.bind(manager),
        setEnabled: manager.setEnabled.bind(manager),
        getConfiguredDomains: manager.getConfiguredDomains.bind(manager),
    };
}

/**
 * Extract public key hash from a certificate
 * This is a utility function for generating pins
 * 
 * @param certificate - Certificate in PEM or DER format
 * @returns SHA-256 hash of the public key
 */
export function extractPublicKeyHash(certificate: string): string {
    // This would require native crypto libraries
    // For now, return a placeholder
    // In production, use: openssl x509 -in cert.pem -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
    return 'sha256/PLACEHOLDER_HASH';
}

// Export singleton instance
export const sslPinning = SSLPinningManager.getInstance();

export default sslPinning;
