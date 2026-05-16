/**
 * GO WITH SALLY - USE GENDER VERIFICATION HOOK
 * Hook pour la vérification du genre
 */

import { useState, useCallback } from 'react';
import { 
  genderVerificationService, 
  GenderAnalysisResult, 
  DocumentVerificationResult 
} from '../services/genderVerificationService';

// ============================================================================
// TYPES
// ============================================================================

interface UseGenderVerificationReturn {
  isLoading: boolean;
  isVerified: boolean;
  result: GenderAnalysisResult | null;
  error: string | null;
  verifyFromFace: (imageUri: string) => Promise<boolean>;
  verifyFromDocument: (documentUri: string, type: 'cin' | 'passport' | 'driving_license') => Promise<DocumentVerificationResult>;
  requestManualVerification: (userId: string, reason: string) => Promise<void>;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useGenderVerification(): UseGenderVerificationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [result, setResult] = useState<GenderAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Vérifie le genre à partir d'une photo de visage
   */
  const verifyFromFace = useCallback(async (imageUri: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Analyser le visage
      const analysisResult = await genderVerificationService.analyzeGenderFromFace(imageUri);
      setResult(analysisResult);

      // Vérifier si c'est une femme
      const verification = await genderVerificationService.verifyIsFemale(imageUri);
      
      if (verification.isFemale) {
        setIsVerified(true);
        return true;
      } else {
        setError(verification.message);
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Vérifie le genre à partir d'un document d'identité
   */
  const verifyFromDocument = useCallback(async (
    documentUri: string, 
    type: 'cin' | 'passport' | 'driving_license'
  ): Promise<DocumentVerificationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const docResult = await genderVerificationService.verifyGenderFromDocument({
        documentUri,
        documentType: type,
      });
      
      if (docResult.isValid && docResult.gender === 'female') {
        setIsVerified(true);
      } else if (!docResult.isValid) {
        setError(docResult.error || 'Document invalide');
      } else if (docResult.gender !== 'female') {
        setError('Go With Sally est exclusivement réservé aux femmes.');
      }

      return docResult;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification du document');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Demande une vérification manuelle
   */
  const requestManualVerification = useCallback(async (userId: string, reason: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await genderVerificationService.requestManualVerification({
        userId,
        reason,
      });
      
      if (result.status === 'error') {
        setError(result.message);
        throw new Error(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la demande');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Réinitialise l'état du hook
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setIsVerified(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    isVerified,
    result,
    error,
    verifyFromFace,
    verifyFromDocument,
    requestManualVerification,
    reset,
  };
}

export default useGenderVerification;