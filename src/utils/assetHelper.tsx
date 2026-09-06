import React, { useState, useEffect, useMemo } from 'react';

// Directly bundle core medical study assets via Vite for 100% path resolution certainty
import cxrPng from '../assets/cxr/CXR.png';
import ctPng from '../assets/ct/CT.png';
import ecgPng from '../assets/ecg/ECG.png';
import pocusPng from '../assets/pocus/Ultrasound.png';
import cxr1Svg from '../assets/images/cxr1_l35.svg';
import cxr2Svg from '../assets/images/cxr2_l35.svg';
import cxr3Svg from '../assets/images/cxr3_l36.svg';
import ecg1Svg from '../assets/images/ecg1_bradycardia.svg';
import ecg2Svg from '../assets/images/ecg2_tachycardia.svg';

export const BUNDLED_ASSET_MAP: Record<string, string> = {
  '/cxr/CXR.png': cxrPng,
  'cxr/CXR.png': cxrPng,
  './cxr/CXR.png': cxrPng,
  '/ct/CT.png': ctPng,
  'ct/CT.png': ctPng,
  './ct/CT.png': ctPng,
  '/ecg/ECG.png': ecgPng,
  'ecg/ECG.png': ecgPng,
  './ecg/ECG.png': ecgPng,
  '/pocus/Ultrasound.png': pocusPng,
  'pocus/Ultrasound.png': pocusPng,
  './pocus/Ultrasound.png': pocusPng,
  '/images/cxr1_l35.svg': cxr1Svg,
  'images/cxr1_l35.svg': cxr1Svg,
  './images/cxr1_l35.svg': cxr1Svg,
  '/images/cxr2_l35.svg': cxr2Svg,
  'images/cxr2_l35.svg': cxr2Svg,
  './images/cxr2_l35.svg': cxr2Svg,
  '/images/cxr3_l36.svg': cxr3Svg,
  'images/cxr3_l36.svg': cxr3Svg,
  './images/cxr3_l36.svg': cxr3Svg,
  '/images/ecg1_bradycardia.svg': ecg1Svg,
  'images/ecg1_bradycardia.svg': ecg1Svg,
  './images/ecg1_bradycardia.svg': ecg1Svg,
  '/images/ecg2_tachycardia.svg': ecg2Svg,
  'images/ecg2_tachycardia.svg': ecg2Svg,
  './images/ecg2_tachycardia.svg': ecg2Svg,
};

/**
 * Resolves an asset path to a browser-accessible URL across:
 * - Bundled Vite static assets
 * - Local Vite dev server (http://localhost:3000/)
 * - AI Studio container preview (https://ais-dev-...run.app/)
 * - GitHub Pages (https://<username>.github.io/<repository-name>/)
 * - Custom domain deployments
 */
export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url) return '';

  // 1. Data URLs, blobs, and external URLs
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  // 2. Direct lookup in bundled asset map
  const cleanPath = url.replace(/^[./\\]+/, '');
  if (BUNDLED_ASSET_MAP[url]) return BUNDLED_ASSET_MAP[url];
  if (BUNDLED_ASSET_MAP[cleanPath]) return BUNDLED_ASSET_MAP[cleanPath];
  if (BUNDLED_ASSET_MAP[`/${cleanPath}`]) return BUNDLED_ASSET_MAP[`/${cleanPath}`];

  // 3. Internal SVG simulation keys (not actual static files)
  const simulatorKeys = [
    'appendicitis', 'ct_appendicitis', 'pneumonia', 'cxr_pneumonia',
    'cxr2_severe', 'cxr3_tubes', 'blank_cxr', 'blank_ct', 'ultrasound_appendix'
  ];
  if (simulatorKeys.includes(url) || (!url.includes('.') && !url.includes('/'))) {
    return url;
  }

  // 4. Runtime GitHub Pages repository detection
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname || '';
    const pathname = window.location.pathname || '';

    // If hosted on *.github.io
    if (hostname.includes('github.io')) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        const repoName = segments[0];
        return `/${repoName}/${cleanPath}`;
      }
    }
  }

  // 5. Use Vite build-time BASE_URL if configured
  const baseUrl = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL || './';
  if (baseUrl && baseUrl !== '/' && baseUrl !== './') {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${normalizedBase}${cleanPath}`;
  }

  // 6. Default to standard relative path './'
  return `./${cleanPath}`;
}

/**
 * Returns candidate URLs in priority order for automated fallback retry
 */
export function getAssetCandidates(rawUrl: string | undefined | null): string[] {
  if (!rawUrl) return [];
  if (
    rawUrl.startsWith('data:') ||
    rawUrl.startsWith('blob:') ||
    rawUrl.startsWith('http://') ||
    rawUrl.startsWith('https://')
  ) {
    return [rawUrl];
  }

  const clean = rawUrl.replace(/^[./\\]+/, '');
  const candidates: string[] = [];

  const add = (candidate: string) => {
    if (candidate && !candidates.push) return;
    if (candidate && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  };

  // First priority: bundled asset from Vite if present
  if (BUNDLED_ASSET_MAP[rawUrl]) add(BUNDLED_ASSET_MAP[rawUrl]);
  if (BUNDLED_ASSET_MAP[clean]) add(BUNDLED_ASSET_MAP[clean]);
  if (BUNDLED_ASSET_MAP[`/${clean}`]) add(BUNDLED_ASSET_MAP[`/${clean}`]);

  const resolved = resolveAssetUrl(rawUrl);
  add(resolved);
  add(`./${clean}`);
  add(`/${clean}`);
  add(clean);

  if (typeof window !== 'undefined' && window.location) {
    const segs = window.location.pathname.split('/').filter(Boolean);
    if (segs.length > 0) {
      add(`/${segs[0]}/${clean}`);
    }
  }

  return candidates;
}

interface SmartMedicalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  rawSrc: string;
  onAllFailed?: () => void;
}

/**
 * SmartMedicalImage: Automatically tries multiple relative/subpath URLs
 * before falling back to simulated vector drawings.
 */
export const SmartMedicalImage: React.FC<SmartMedicalImageProps> = ({
  rawSrc,
  onAllFailed,
  alt = "Medical examination image",
  className = "",
  ...rest
}) => {
  const candidates = useMemo(() => getAssetCandidates(rawSrc), [rawSrc]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [rawSrc]);

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex(prev => prev + 1);
    } else {
      if (onAllFailed) {
        onAllFailed();
      }
    }
  };

  const currentSrc = candidates[candidateIndex] || rawSrc;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={handleError}
      {...rest}
    />
  );
};
