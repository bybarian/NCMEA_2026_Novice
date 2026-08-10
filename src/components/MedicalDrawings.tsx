import React from 'react';

interface GraphicProps {
  className?: string;
  hasInfiltration?: boolean;
  hasAppendicitis?: boolean;
  hasBrainLesion?: boolean;
  hasCxr2?: boolean;
  hasCxr3?: boolean;
}

export const ChestXrayDrawing: React.FC<GraphicProps> = ({ 
  className = "w-full h-64", 
  hasInfiltration = false,
  hasCxr2 = false,
  hasCxr3 = false
}) => {
  const showInf = hasInfiltration || hasCxr2 || hasCxr3;

  return (
    <svg className={`${className} bg-slate-950 rounded-lg border border-slate-800`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#020617" />
      {/* Grid lines */}
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0f172a" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#grid)" />
      
      {/* Spine / Vertebrae */}
      <line x1="100" y1="20" x2="100" y2="180" stroke="#f1f5f9" strokeWidth="6" strokeDasharray="8 4" opacity="0.4" />
      
      {/* Rib Cage Outline */}
      <path d="M 100 30 Q 30 40 35 150 Q 100 190 100 190" fill="none" stroke="#e2e8f0" strokeWidth="3" opacity="0.3" />
      <path d="M 100 30 Q 170 40 165 150 Q 100 190 100 190" fill="none" stroke="#e2e8f0" strokeWidth="3" opacity="0.3" />
      
      {/* Clavicles */}
      <path d="M 100 35 Q 60 25 35 38" fill="none" stroke="#f8fafc" strokeWidth="4" opacity="0.5" />
      <path d="M 100 35 Q 140 25 165 38" fill="none" stroke="#f8fafc" strokeWidth="4" opacity="0.5" />
      
      {/* Ribs (Horizontal) */}
      {[50, 70, 90, 110, 130, 150].map((y, i) => (
        <g key={i} opacity="0.2">
          <path d={`M 100 ${y} Q ${40 + i*4} ${y + 5} ${35 + i} ${y + 15}`} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
          <path d={`M 100 ${y} Q ${160 - i*4} ${y + 5} ${165 - i} ${y + 15}`} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
        </g>
      ))}
      
      {/* Lungs (Dark air fields) */}
      <path d="M 95 40 C 60 30 45 60 42 140 C 65 155 75 145 92 142 Z" fill="#020617" stroke="#e2e8f0" strokeWidth="1" opacity="0.7" />
      {showInf ? (
        // Severe or regular infiltration
        <path d="M 105 40 C 140 30 155 60 158 140 C 135 155 125 145 108 142 Z" fill="url(#infiltration-grad)" stroke="#e2e8f0" strokeWidth="1" opacity="0.7" />
      ) : (
        <path d="M 105 40 C 140 30 155 60 158 140 C 135 155 125 145 108 142 Z" fill="#020617" stroke="#e2e8f0" strokeWidth="1" opacity="0.7" />
      )}
      
      {/* Heart Silhouette */}
      <path d="M 95 80 Q 115 85 125 110 Q 120 142 95 142 Q 78 140 95 80" fill="#f8fafc" opacity={hasCxr2 || hasCxr3 ? 0.65 : 0.75} filter="blur(1px)" />
      
      {/* Diaphragm */}
      <path d="M 30 150 Q 65 140 95 145" fill="none" stroke="#f1f5f9" strokeWidth="3" opacity="0.6" />
      <path d="M 105 145 Q 135 140 170 150" fill="none" stroke="#f1f5f9" strokeWidth="3" opacity="0.6" />
      
      {/* Trachea */}
      <rect x="96" y="20" width="8" height="45" fill="#090d16" stroke="#f1f5f9" strokeWidth="0.5" opacity="0.5" />

      {/* Infiltration cloud overlay for Pneumonia */}
      {hasInfiltration && !hasCxr2 && !hasCxr3 && (
        <g opacity="0.55">
          {/* Patchy consolidations on the lower right chest area (anatomical right, left of image) */}
          <ellipse cx="65" cy="115" rx="20" ry="15" fill="#f8fafc" filter="url(#fog)" />
          <ellipse cx="55" cy="130" rx="16" ry="10" fill="#f8fafc" filter="url(#fog)" />
          <ellipse cx="75" cy="125" rx="12" ry="12" fill="#e2e8f0" filter="url(#fog)" />
          {/* Bronchogram linear lines */}
          <path d="M 80 90 L 60 120 M 80 90 L 70 130" stroke="#f8fafc" strokeWidth="1.5" opacity="0.7" />
        </g>
      )}

      {/* Infiltration cloud overlay for CXR2 (worse, bilateral) */}
      {hasCxr2 && (
        <g opacity="0.75">
          {/* Dense right-side (image left) consolidation */}
          <ellipse cx="60" cy="110" rx="24" ry="20" fill="#f1f5f9" filter="url(#fog-blur)" />
          <ellipse cx="50" cy="135" rx="18" ry="15" fill="#f8fafc" filter="url(#fog)" />
          <ellipse cx="70" cy="125" rx="15" ry="15" fill="#ffffff" filter="url(#fog)" />
          
          {/* Worsening left-side (image right) patchy infiltrates */}
          <ellipse cx="135" cy="120" rx="20" ry="18" fill="#e2e8f0" filter="url(#fog)" />
          <ellipse cx="145" cy="135" rx="15" ry="12" fill="#cbd5e1" filter="url(#fog)" />

          {/* ECG Leads/Electrodes & Cables (typical of intensive monitoring) */}
          <circle cx="40" cy="80" r="3" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
          <circle cx="160" cy="85" r="3" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
          <circle cx="100" cy="165" r="3" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
          <path d="M 40 80 Q 70 90 100 165 M 160 85 Q 130 110 100 165" fill="none" stroke="#64748b" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
        </g>
      )}

      {/* Infiltration, ETT, CVC, and Chest Tube for CXR3 */}
      {hasCxr3 && (
        <g>
          {/* Super dense white-out lungs */}
          <g opacity="0.8">
            <ellipse cx="60" cy="115" rx="25" ry="22" fill="#f8fafc" filter="url(#fog-blur)" />
            <ellipse cx="140" cy="120" rx="22" ry="20" fill="#f8fafc" filter="url(#fog-blur)" />
            <ellipse cx="50" cy="135" rx="18" ry="15" fill="#ffffff" filter="url(#fog)" />
            <ellipse cx="145" cy="140" rx="18" ry="15" fill="#ffffff" filter="url(#fog)" />
          </g>

          {/* Endotracheal Tube (ETT) */}
          <g opacity="0.9">
            <path d="M 100 20 L 100 68" fill="none" stroke="#f8fafc" strokeWidth="2.5" />
            <line x1="97" y1="68" x2="103" y2="68" stroke="#3b82f6" strokeWidth="1" /> {/* cuff line */}
            <circle cx="100" cy="68" r="1.5" fill="#3b82f6" />
            <text x="105" y="45" fill="#38bdf8" fontSize="6" fontFamily="monospace" fontWeight="bold">ETT</text>
          </g>

          {/* Central Venous Catheter (CVC) via Right Subclavian */}
          <g opacity="0.9">
            <path d="M 45 35 Q 70 40 98 42 L 98 80" fill="none" stroke="#3b82f6" strokeWidth="1.2" />
            <circle cx="98" cy="80" r="1" fill="#f43f5e" />
            <text x="60" y="32" fill="#38bdf8" fontSize="6" fontFamily="monospace" fontWeight="bold">CVC</text>
          </g>

          {/* Left Chest Tube (anatomical right, image left side) */}
          <g opacity="0.85">
            <path d="M 20 120 L 70 142" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <path d="M 20 120 L 70 142" fill="none" stroke="#000000" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="70" cy="142" r="1.5" fill="#10b981" />
            <text x="22" y="115" fill="#34d399" fontSize="6" fontFamily="monospace" fontWeight="bold">Chest Tube</text>
          </g>
        </g>
      )}

      {/* R and L labels */}
      <text x="20" y="30" fill="#ef4444" fontSize="11" fontWeight="bold" opacity="0.8">R</text>
      <text x="175" y="30" fill="#cbd5e1" fontSize="11" fontWeight="bold" opacity="0.8">L</text>
      
      <defs>
        <filter id="fog-blur">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="fog">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <radialGradient id="infiltration-grad" cx="20%" cy="80%" r="80%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export const AbdominalCtDrawing: React.FC<GraphicProps> = ({ className = "w-full h-64", hasAppendicitis = false }) => {
  return (
    <svg className={`${className} bg-slate-950 rounded-lg border border-slate-800`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#020617" />
      <rect width="200" height="200" fill="url(#grid)" />
      
      {/* Outer Body wall outline */}
      <ellipse cx="100" cy="100" rx="85" ry="70" fill="none" stroke="#64748b" strokeWidth="4" opacity="0.4" />
      <ellipse cx="100" cy="100" rx="82" ry="67" fill="#0d1527" opacity="0.8" />
      
      {/* Vertebra (Spine) at biological back (bottom of CT slice) */}
      <g transform="translate(100, 150)" opacity="0.8">
        <path d="M-15 -10 C-10 -15 10 -15 15 -10 C20 -5 18 10 12 12 C6 14 -6 14 -12 12 C-18 10 -20 -5 -15 -10 Z" fill="#e2e8f0" stroke="#94a3b8" />
        {/* Spinal canal */}
        <circle cx="0" cy="-2" r="5" fill="#020617" />
        {/* Spinous process */}
        <path d="M-5 12 L0 25 L5 12 Z" fill="#e2e8f0" />
        <path d="M-12 5 L-24 10 L-15 -2" fill="#e2e8f0" />
        <path d="M12 5 L24 10 L15 -2" fill="#e2e8f0" />
      </g>
      
      {/* Paraspinal Muscles */}
      <ellipse cx="73" cy="148" rx="14" ry="10" fill="#334155" opacity="0.6" />
      <ellipse cx="127" cy="148" rx="14" ry="10" fill="#334155" opacity="0.6" />
      
      {/* Aorta & IVC */}
      <circle cx="91" cy="132" r="5" fill="#ef4444" opacity="0.9" /> {/* Aorta */}
      <ellipse cx="108" cy="133" rx="7" ry="5" fill="#3b82f6" opacity="0.9" /> {/* IVC */}
      
      {/* Liver (Anatomical Right - Top Left of image) */}
      <path d="M 25 90 C 25 50 65 40 90 45 C 92 65 75 110 38 115 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" opacity="0.9" />
      <text x="45" y="75" fill="#cbd5e1" fontSize="9" opacity="0.4">Liver</text>
      
      {/* Spleen (Anatomical Left - Top Right of image) */}
      <path d="M 175 90 C 175 60 150 50 135 60 C 135 75 150 105 168 100 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" opacity="0.9" />
      <text x="145" y="80" fill="#cbd5e1" fontSize="9" opacity="0.4">Spleen</text>

      {/* Stomach (Anatomical Left upper - Right-Center top) */}
      <ellipse cx="120" cy="65" rx="15" ry="10" fill="#090d16" stroke="#475569" />
      {/* Fluid/air level in stomach */}
      <path d="M 106 66 Q 120 70 134 66 C 130 75 110 75 106 66 Z" fill="#ffffff" opacity="0.4" />
      
      {/* Kidneys */}
      <ellipse cx="48" cy="125" rx="10" ry="15" fill="#334155" stroke="#475569" transform="rotate(-15, 48, 125)" opacity="0.8" />
      <ellipse cx="152" cy="125" rx="10" ry="15" fill="#334155" stroke="#475569" transform="rotate(15, 152, 125)" opacity="0.8" />
      
      {/* Bowel loops (Mesenteric shadows) */}
      <g stroke="#334155" fill="none" opacity="0.6">
        <path d="M 80 85 C 75 75 90 70 100 80 Q 110 90 95 105" strokeWidth="3" />
        <path d="M 120 90 Q 110 110 130 115" strokeWidth="3" />
        <path d="M 100 110 Q 95 125 110 125" strokeWidth="3" />
        <path d="M 85 105 Q 75 115 85 120" strokeWidth="3" />
      </g>
      
      {/* Right Lower Quadrant / Appendicitis Pathology */}
      {/* RLQ is anatomical right-lower, so on CT it's the BOTTOM-LEFT area of the body */}
      {hasAppendicitis ? (
        <g>
          {/* Inflamed appendix target sign */}
          <circle cx="50" cy="98" r="10" fill="#ef4444" opacity="0.4" filter="url(#fog)" />
          <circle cx="50" cy="98" r="7" fill="#7f1d1d" stroke="#f87171" strokeWidth="1.5" />
          <circle cx="50" cy="98" r="2.5" fill="#ffffff" />
          {/* Message pointer */}
          <line x1="50" y1="98" x2="68" y2="84" stroke="#f87171" strokeWidth="1.2" strokeDasharray="2 1" />
          <text x="70" y="83" fill="#f87171" fontSize="8" fontWeight="bold">Inflamed Appendix</text>
          {/* Stranding surrounding */}
          <path d="M 38 90 L 44 94 M 35 102 L 42 100 M 56 110 L 51 104" stroke="#ef4444" strokeWidth="1" opacity="0.8" />
        </g>
      ) : (
        // Normal bowel loop in that area
        <circle cx="50" cy="98" r="5" fill="#1e293b" stroke="#334155" />
      )}
      
      {/* Orientation orientation */}
      <text x="15" y="105" fill="#ef4444" fontSize="10" fontWeight="bold">R</text>
      <text x="180" y="105" fill="#cbd5e1" fontSize="10" fontWeight="bold">L</text>
      <text x="94" y="25" fill="#64748b" fontSize="8">Anterior</text>
      <text x="94" y="185" fill="#64748b" fontSize="8">Posterior</text>
    </svg>
  );
};

export const BrainCtDrawing: React.FC<GraphicProps> = ({ className = "w-full h-64", hasBrainLesion = false }) => {
  return (
    <svg className={`${className} bg-slate-950 rounded-lg border border-slate-800`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#020617" />
      <rect width="200" height="200" fill="url(#grid)" />
      
      {/* Skull bone - very white cortical bone */}
      <circle cx="100" cy="100" r="80" fill="none" stroke="#f8fafc" strokeWidth="6" opacity="0.9" />
      <circle cx="100" cy="100" r="77" fill="#090d16" />
      
      {/* Brain parenchyma ventricles - butterfly shape in center */}
      <g opacity="0.6">
        {/* Left Lateral Ventricle */}
        <path d="M 97 100 C 97 85 85 80 82 92 C 80 102 93 112 97 122 C 95 110 97 105 97 100 Z" fill="#020617" stroke="#334155" strokeWidth="1.5" />
        {/* Right Lateral Ventricle */}
        <path d="M 103 100 C 103 85 115 80 118 92 C 120 102 107 112 103 122 C 105 110 103 105 103 100 Z" fill="#020617" stroke="#334155" strokeWidth="1.5" />
      </g>
      
      {/* Brain folds/sulci lines */}
      <g stroke="#1e293b" fill="none" strokeWidth="1.5" opacity="0.5">
        <path d="M 60 45 Q 75 55 50 70" />
        <path d="M 140 45 Q 125 55 150 70" />
        <path d="M 40 100 H 60 M 140 100 H 160" />
        <path d="M 50 130 C 65 125 70 145 60 155" />
        <path d="M 150 130 C 135 125 130 145 140 155" />
        <line x1="100" y1="26" x2="100" y2="75" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="100" y1="125" x2="100" y2="174" strokeWidth="1" strokeDasharray="3 3" />
      </g>
      
      {/* Pathology - Brain Hemorrhage (high density white smear) or tumor */}
      {hasBrainLesion ? (
        <g>
          {/* Hyperdense acute bleed in left temporal area (image right side) */}
          <path d="M 130 95 Q 148 85 152 105 Q 148 125 132 118 Q 120 110 130 95" fill="#f8fafc" opacity="0.8" filter="url(#fog)" />
          <path d="M 132 98 Q 144 90 147 105 Q 144 118 134 113 Z" fill="#ffffff" />
          <line x1="140" y1="105" x2="114" y2="128" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 1" />
          <text x="96" y="137" fill="#38bdf8" fontSize="8" fontWeight="bold">Intracerebral Bleed</text>
        </g>
      ) : (
        // Normal parenchyma shadow
        <circle cx="140" cy="105" r="8" fill="#0f172a" opacity="0.3" id="normal-brain" />
      )}
      
      {/* Orientation Labels */}
      <text x="12" y="105" fill="#ef4444" fontSize="10" fontWeight="bold">R</text>
      <text x="180" y="105" fill="#cbd5e1" fontSize="10" fontWeight="bold">L</text>
      <text x="94" y="21" fill="#64748b" fontSize="8">Anterior</text>
      <text x="94" y="191" fill="#64748b" fontSize="8">Posterior</text>
    </svg>
  );
};

export const UltrasoundDrawing: React.FC<GraphicProps> = ({ className = "w-full h-64" }) => {
  return (
    <svg className={`${className} bg-slate-950 rounded-lg border border-slate-800`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#020617" />
      <rect width="200" height="200" fill="url(#grid)" />
      
      {/* Pie slice/cone typical of US probe sector scope */}
      <path d="M 100 20 L 30 170 A 90 90 0 0 0 170 170 Z" fill="#090d16" stroke="#475569" strokeWidth="1.5" />
      
      {/* Ultrasound waves arcs */}
      <path d="M 85 50 A 20 20 0 0 0 115 50" fill="none" stroke="#2a3342" strokeWidth="1" />
      <path d="M 70 80 A 50 50 0 0 0 130 80" fill="none" stroke="#2a3342" strokeWidth="1" />
      <path d="M 55 110 A 80 80 0 0 0 145 110" fill="none" stroke="#2a3342" strokeWidth="1" />
      <path d="M 40 140 A 110 110 0 0 0 160 140" fill="none" stroke="#2a3342" strokeWidth="1" />
      
      {/* Ultrasound target echo (e.g. cyst, gallbladder or appendix probe) */}
      <ellipse cx="100" cy="110" rx="25" ry="14" fill="#020617" stroke="#94a3b8" strokeDasharray="3 1" opacity="0.8" />
      <circle cx="100" cy="110" r="10" fill="#000000" stroke="#f1f5f9" strokeWidth="2" />
      
      {/* Posterior Acoustic Enhancement shadow (white column beneath) */}
      <rect x="90" y="121" width="20" height="40" fill="url(#acoustic-enhancement)" opacity="0.25" />
      
      {/* Screen annotations */}
      <text x="35" y="40" fill="#22c55e" fontSize="7" fontFamily="monospace">FPS: 32</text>
      <text x="35" y="50" fill="#22c55e" fontSize="7" fontFamily="monospace">G: 68%</text>
      <text x="35" y="60" fill="#22c55e" fontSize="7" fontFamily="monospace">DR: 120</text>
      <text x="140" y="40" fill="#22c55e" fontSize="7" fontFamily="monospace">VHIS-US</text>
      <text x="140" y="50" fill="#22c55e" fontSize="7" fontFamily="monospace">MI 1.1</text>
      
      {/* Depth ticks on the right side */}
      {[50, 75, 100, 125, 150].map((y, index) => (
        <line key={index} x1="163" y1={y} x2="167" y2={y} stroke="#475569" strokeWidth="1" />
      ))}
      
      <defs>
        <linearGradient id="acoustic-enhancement" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const PlaceholderDrawing: React.FC<GraphicProps> = ({ className = "w-full h-64" }) => {
  return (
    <svg className={`${className} bg-slate-950 rounded-lg border border-slate-800`} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#020617" />
      <rect width="200" height="200" fill="url(#grid)" />
      <circle cx="100" cy="100" r="40" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      <path d="M 50 100 H 150 M 100 50 V 150" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.3" />
      <text x="100" y="103" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="500">MOCK IMAGE</text>
      <text x="100" y="118" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">DICOM / LOSSLESS</text>
    </svg>
  );
};
