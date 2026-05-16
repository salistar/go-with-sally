// ============================================================
// 📄 voiceVerificationService.ts — GoWithSally
// LOG SUMMARY:
//   • console.log('[voiceVerificationService] ▶ Module loaded')
//   • console.log('[voiceVerificationService] ▶ verifyVoiceGender() called')
// ============================================================
/**
 * Voice Verification Service
 * ==========================
 * Handle voice gender verification API calls and local audio processing.
 */

import axios, { AxiosInstance } from 'axios';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

console.log('[voiceVerificationService] ▶ Module loaded');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_FACE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  CONFIDENCE_THRESHOLD: 0.7,
  MAX_AUDIO_SIZE: 10 * 1024 * 1024, // 10MB
};

// ============================================================
// API CLIENT
// ============================================================
class VoiceVerificationService {
  private apiClient: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    console.log('[voiceVerificationService] ▶ VoiceVerificationService initialized');

    this.apiClient = axios.create({
      baseURL: CONFIG.API_BASE_URL,
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeAuth();
  }

  // ============================================================
  // AUTHENTICATION
  // ============================================================
  private async initializeAuth() {
    console.log('[voiceVerificationService] ▶ initializeAuth() called');

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        this.authToken = token;
        this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[voiceVerificationService] ▶ Auth token loaded');
      }
    } catch (err) {
      console.warn('[voiceVerificationService] ▶ Failed to load auth token:', err);
    }
  }

  // ============================================================
  // VOICE VERIFICATION
  // ============================================================

  /**
   * Verify voice gender by sending audio to API.
   * @param audioUri - URI to audio file (local path or blob)
   * @param userId - User ID for logging
   * @returns Promise with verification result
   */
  async verifyVoiceGender(audioUri: string, userId?: string) {
    console.log('[voiceVerificationService] ▶ verifyVoiceGender() called');
    console.log(`[voiceVerificationService] ▶ Audio URI: ${audioUri}`);

    try {
      // Validate audio file
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        console.error('[voiceVerificationService] ▶ Audio file not found');
        throw new Error('Audio file not found');
      }

      if (fileInfo.size && fileInfo.size > CONFIG.MAX_AUDIO_SIZE) {
        console.error('[voiceVerificationService] ▶ Audio file too large');
        throw new Error('Audio file exceeds maximum size');
      }

      console.log(
        `[voiceVerificationService] ▶ Audio file size: ${fileInfo.size} bytes`
      );

      // Prepare form data
      const formData = new FormData();

      const audioBlob = {
        uri: audioUri,
        type: 'audio/wav',
        name: 'voice_sample.wav',
      };

      formData.append('audio', audioBlob as any);
      if (userId) {
        formData.append('user_id', userId);
      }

      console.log('[voiceVerificationService] ▶ Sending verification request');

      // Send to API
      const response = await this.apiClient.post(
        '/api/voice/verify-gender',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('[voiceVerificationService] ▶ API Response:', response.data);

      const { passed, gender, confidence, features_count, error } = response.data;

      return {
        passed: passed && confidence >= CONFIG.CONFIDENCE_THRESHOLD,
        gender: gender?.toLowerCase() || 'unknown',
        confidence: confidence || 0,
        features_count,
        error,
        raw_response: response.data,
      };

    } catch (err: any) {
      console.error('[voiceVerificationService] ▶ Verification error:', err.message);

      return {
        passed: false,
        gender: 'error',
        confidence: 0,
        error: err.message || 'Voice verification failed',
      };
    }
  }

  // ============================================================
  // AUDIO FILE VALIDATION
  // ============================================================

  /**
   * Validate audio file format and size.
   * @param audioUri - URI to audio file
   * @returns { valid: boolean, error?: string }
   */
  async validateAudioFile(audioUri: string) {
    console.log('[voiceVerificationService] ▶ validateAudioFile() called');

    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);

      if (!fileInfo.exists) {
        return { valid: false, error: 'Audio file not found' };
      }

      if (!fileInfo.size) {
        return { valid: false, error: 'Unable to determine file size' };
      }

      if (fileInfo.size < 1024) {
        // Less than 1KB
        return { valid: false, error: 'Audio file too small' };
      }

      if (fileInfo.size > CONFIG.MAX_AUDIO_SIZE) {
        return { valid: false, error: 'Audio file too large' };
      }

      console.log(
        `[voiceVerificationService] ▶ Audio validation passed (size=${fileInfo.size})`
      );

      return { valid: true };

    } catch (err: any) {
      console.error('[voiceVerificationService] ▶ Validation error:', err.message);
      return { valid: false, error: err.message };
    }
  }

  // ============================================================
  // AUDIO ANALYSIS
  // ============================================================

  /**
   * Get statistics about audio file (duration, sample rate, etc).
   * Note: Requires native module support
   * @param audioUri - URI to audio file
   * @returns Promise with audio stats
   */
  async getAudioStats(audioUri: string) {
    console.log('[voiceVerificationService] ▶ getAudioStats() called');

    try {
      // This would require native module or separate audio processing library
      // For now, just validate the file
      const validation = await this.validateAudioFile(audioUri);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const fileInfo = await FileSystem.getInfoAsync(audioUri);

      return {
        uri: audioUri,
        size_bytes: fileInfo.size || 0,
        // Additional stats would come from native module
        // duration_ms: ...,
        // sample_rate: ...,
        // channels: ...,
      };

    } catch (err: any) {
      console.error('[voiceVerificationService] ▶ Stats error:', err.message);
      throw err;
    }
  }

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  /**
   * Check if voice verification API is available.
   * @returns Promise<boolean>
   */
  async checkHealth() {
    console.log('[voiceVerificationService] ▶ checkHealth() called');

    try {
      const response = await this.apiClient.get('/api/voice/health', {
        timeout: 5000,
      });

      const isHealthy = response.data?.status === 'ok';
      console.log(
        `[voiceVerificationService] ▶ API Health: ${isHealthy ? 'OK' : 'DEGRADED'}`
      );

      return isHealthy;

    } catch (err: any) {
      console.error('[voiceVerificationService] ▶ Health check failed:', err.message);
      return false;
    }
  }

  // ============================================================
  // BATCH VERIFICATION
  // ============================================================

  /**
   * Verify multiple audio files.
   * @param audioUris - Array of audio URIs
   * @param userId - User ID for logging
   * @returns Promise with array of verification results
   */
  async verifyMultipleVoices(audioUris: string[], userId?: string) {
    console.log(
      `[voiceVerificationService] ▶ verifyMultipleVoices() called (${audioUris.length} files)`
    );

    const results = await Promise.all(
      audioUris.map((uri) => this.verifyVoiceGender(uri, userId))
    );

    console.log('[voiceVerificationService] ▶ Batch verification complete');

    return results;
  }

  // ============================================================
  // CONFIGURATION
  // ============================================================

  /**
   * Set custom API base URL.
   * @param url - API base URL
   */
  setApiBaseUrl(url: string) {
    console.log(`[voiceVerificationService] ▶ setApiBaseUrl: ${url}`);
    this.apiClient.defaults.baseURL = url;
  }

  /**
   * Set authentication token.
   * @param token - Auth token
   */
  setAuthToken(token: string) {
    console.log('[voiceVerificationService] ▶ setAuthToken() called');
    this.authToken = token;
    this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================
const voiceVerificationService = new VoiceVerificationService();

export default voiceVerificationService;

// ============================================================
// EXPORTS
// ============================================================
export { VoiceVerificationService };
