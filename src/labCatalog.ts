// LIS Lab Catalog containing comprehensive preset values, reference ranges, and default units
export interface LabCatalogItem {
  id: string;
  name: string;        // readable Chinese/English name
  defaultVal: string;
  unit: string;
  referenceRange: string;
}

export const CBC_DC_ITEMS: LabCatalogItem[] = [
  { id: 'WBC', name: 'WBC (白血球計數)', defaultVal: '6.5', unit: '10^3/μL', referenceRange: '4.0 - 10.0' },
  { id: 'Hb', name: 'Hb (血紅素)', defaultVal: '14.0', unit: 'g/dL', referenceRange: '12.0 - 16.0' },
  { id: 'Ht', name: 'Ht (血球比容)', defaultVal: '42.0', unit: '%', referenceRange: '36.0 - 50.0' },
  { id: 'CBC-1', name: 'CBC-1', defaultVal: 'Normal', unit: '', referenceRange: 'Normal' },
  { id: 'WBC_Classification', name: 'WBC Classification', defaultVal: 'Normal', unit: '', referenceRange: 'Normal' },
  { id: 'Neutrophil_Band', name: 'Neutrophil Band %', defaultVal: '1.5', unit: '%', referenceRange: '0 - 3' },
  { id: 'Seg', name: 'Neutrophil Seg % (分葉核嗜中性球)', defaultVal: '61.2', unit: '%', referenceRange: '40 - 70' },
  { id: 'Lymphocyte_S', name: 'Lymphocyte L %', defaultVal: '28.5', unit: '%', referenceRange: '20 - 45' },
  { id: 'L_Percent', name: 'Lymphocyte L %', defaultVal: '28.5', unit: '%', referenceRange: '20 - 45' },
  { id: 'Monocyte', name: 'Monocyte %', defaultVal: '7.8', unit: '%', referenceRange: '2 - 10' },
  { id: 'Eosinophil', name: 'Eosinophil %', defaultVal: '2.1', unit: '%', referenceRange: '0 - 6' },
  { id: 'Basophil', name: 'Basophil %', defaultVal: '0.4', unit: '%', referenceRange: '0 - 1' },
  { id: 'RBC', name: 'RBC', defaultVal: '4.50', unit: '10^6/μL', referenceRange: '4.0 - 5.5' },
  { id: 'RBC_morphology', name: 'RBC morphology', defaultVal: 'Normal', unit: '', referenceRange: 'Normal' },
  { id: 'MCV', name: 'MCV', defaultVal: '88.0', unit: 'fL', referenceRange: '80 - 100' },
  { id: 'MCH', name: 'MCH', defaultVal: '30.0', unit: 'pg', referenceRange: '27 - 34' },
  { id: 'MCHC', name: 'MCHC', defaultVal: '33.5', unit: 'g/dL', referenceRange: '32 - 36' },
  { id: 'Platelet', name: 'Platelet (血小板計數)', defaultVal: '250', unit: '10^3/μL', referenceRange: '150 - 450' },
  { id: 'Parasite', name: 'Parasite(malaria or filaria)', defaultVal: 'Negative', unit: '', referenceRange: 'Negative' },
  { id: 'Reticulocyte', name: 'Reticulocyte', defaultVal: '1.2', unit: '%', referenceRange: '0.5 - 2.0' },
  { id: 'Total_Eosinophil', name: 'Total Eosinophil Count', defaultVal: '150', unit: '/μL', referenceRange: '50 - 350' },
  { id: 'Hct_Ped', name: 'Hct 血球比容值測定', defaultVal: '42.0', unit: '%', referenceRange: '36.0 - 50.0' },
  { id: 'ESR', name: 'ESR', defaultVal: '8.0', unit: 'mm/1hr', referenceRange: '< 15' },
  { id: 'Bleeding_Time', name: 'Bleeding Time', defaultVal: '3.5', unit: 'mins', referenceRange: '2.0 - 7.0' },
  { id: 'PT', name: 'P.T. (Control / INR)', defaultVal: '11.5', unit: 'sec', referenceRange: '10.0 - 13.0' },
  { id: 'PTT', name: 'P.T.T. (Control)', defaultVal: '31.5', unit: 'sec', referenceRange: '28.0 - 38.0' },
  { id: 'Fibrinogen', name: 'Fibrinogen', defaultVal: '280', unit: 'mg/dL', referenceRange: '200 - 400' },
  { id: 'FDP', name: 'F.D.P.', defaultVal: '< 5.0', unit: 'μg/mL', referenceRange: '< 5.0' },
  { id: 'D_Dimer', name: 'D-Dimer', defaultVal: '210', unit: 'ng/mL', referenceRange: '< 500' },
  { id: 'Mixed_APTT', name: 'Mixed APTT', defaultVal: 'Normal', unit: '', referenceRange: 'Normal' },
  { id: 'Blood_Smear', name: '血液抹片檢查', defaultVal: 'Normal', unit: '', referenceRange: 'Normal' },
];

export const BIO_ITEMS: LabCatalogItem[] = [
  { id: 'Blood_Gas', name: 'Blood Gas (生化血氣)', defaultVal: 'Normal', unit: '', referenceRange: 'Normal' },
  { id: 'Na', name: 'Na', defaultVal: '141', unit: 'mEq/L', referenceRange: '135 - 145' },
  { id: 'K', name: 'K', defaultVal: '4.1', unit: 'mEq/L', referenceRange: '3.5 - 5.1' },
  { id: 'Calcium', name: 'Calcium', defaultVal: '9.4', unit: 'mg/dL', referenceRange: '8.6 - 10.2' },
  { id: 'Cl', name: 'Cl', defaultVal: '101', unit: 'mEq/L', referenceRange: '98 - 107' },
  { id: 'Na_Ped', name: 'Na (小兒腳跟血專用)', defaultVal: '141', unit: 'mEq/L', referenceRange: '135 - 145' },
  { id: 'Osmolality', name: 'Osmolality (滲透壓測定)', defaultVal: '287', unit: 'mOsm/kg', referenceRange: '275 - 295' },
  { id: 'Glucose_AC', name: 'Glucose(AC) (空腹血糖)', defaultVal: '92', unit: 'mg/dL', referenceRange: '70 - 100' },
  { id: 'Glucose_PC', name: 'Glucose(PC) (餐後血糖)', defaultVal: '115', unit: 'mg/dL', referenceRange: '< 140' },
  { id: 'Glucose', name: 'Glucose (血糖)', defaultVal: '98', unit: 'mg/dL', referenceRange: '70 - 140' },
  { id: 'BUN', name: 'B.U.N. (尿素氮)', defaultVal: '12.0', unit: 'mg/dL', referenceRange: '7 - 20' },
  { id: 'Creatinine', name: 'Creatinine (肌酸酐)', defaultVal: '0.82', unit: 'mg/dL', referenceRange: '0.5 - 1.2' },
  { id: 'Amylase', name: 'Amylase (澱粉酶)', defaultVal: '55', unit: 'U/L', referenceRange: '28 - 100' },
  { id: 'Bilirubin_Total', name: 'Bilirubin, Total (總膽紅素)', defaultVal: '0.7', unit: 'mg/dL', referenceRange: '0.2 - 1.2' },
  { id: 'Bilirubin_Direct', name: 'Bilirubin, Direct (直接膽紅素)', defaultVal: '0.15', unit: 'mg/dL', referenceRange: '0.0 - 0.3' },
  { id: 'GOT', name: 'G.O.T. (AST肝功能)', defaultVal: '22', unit: 'U/L', referenceRange: '0 - 40' },
  { id: 'GPT', name: 'G.P.T. (ALT肝功能)', defaultVal: '18', unit: 'U/L', referenceRange: '0 - 40' },
  { id: 'LDH', name: 'L.D.H. (乳酸脫氫酶)', defaultVal: '165', unit: 'U/L', referenceRange: '140 - 280' },
  { id: 'CPK', name: 'C.P.K. (肌酸激酶)', defaultVal: '85', unit: 'U/L', referenceRange: '38 - 174' },
  { id: 'CPK_MB', name: 'C.P.K. MB isoenzyme', defaultVal: '1.8', unit: 'ng/mL', referenceRange: '< 5.0' },
  { id: 'Myoglobin', name: 'Myoglobin (肌紅蛋白)', defaultVal: '45', unit: 'ng/mL', referenceRange: '< 90' },
  { id: 'Inorganic_Phosphorus', name: 'Inorganic Phosphorus (無機磷)', defaultVal: '3.4', unit: 'mg/dL', referenceRange: '2.5 - 4.5' },
  { id: 'Lipase', name: 'Lipase (解脂酶)', defaultVal: '32', unit: 'U/L', referenceRange: '13 - 60' },
  { id: 'Ammonia', name: 'Ammonia (血氨)', defaultVal: '31', unit: 'μg/dL', referenceRange: '15 - 45' },
  { id: 'Ketone_body', name: 'Ketone body (尿酮體)', defaultVal: '< 0.3', unit: 'mmol/L', referenceRange: '< 0.3' },
  { id: 'CRP', name: 'C.R.P. (C反應蛋白)', defaultVal: '2.3', unit: 'mg/L', referenceRange: '0 - 5.0' },
  { id: 'Mg', name: 'Mg (鎂離子)', defaultVal: '2.1', unit: 'mg/dL', referenceRange: '1.7 - 2.2' },
  { id: 'Ionized_Ca', name: 'Ionized Ca (游離鈣)', defaultVal: '1.21', unit: 'mmol/L', referenceRange: '1.15 - 1.30' },
  { id: 'Alk_PTase', name: 'Alk P-Tase (鹼性磷酸酶)', defaultVal: '65', unit: 'U/L', referenceRange: '40 - 130' },
  { id: 'COHb', name: 'COHb (一氧化碳血紅素)', defaultVal: '0.8', unit: '%', referenceRange: '< 1.5' },
  { id: 'Lactate', name: 'Lactic acid (Lactate, 乳酸)', defaultVal: '1.2', unit: 'mmol/L', referenceRange: '0.5 - 2.2' },
  { id: 'Troponin_I', name: 'Troponin I (心肌特異性鈣蛋白I)', defaultVal: '< 0.01', unit: 'ng/mL', referenceRange: '< 0.03' },
  { id: 'Procalcitonin', name: 'Procalcitonin (PCT, 降鈣素原)', defaultVal: '0.04', unit: 'ng/mL', referenceRange: '< 0.05' },
];

export const ABG_ITEMS: LabCatalogItem[] = [
  { id: 'pH', name: 'pH (動脈血酸鹼度)', defaultVal: '7.41', unit: '', referenceRange: '7.35 - 7.45' },
  { id: 'PaCO2', name: 'PaCO₂ (動脈血二氧化碳分壓)', defaultVal: '41.2', unit: 'mmHg', referenceRange: '35 - 45' },
  { id: 'PaO2', name: 'PaO₂ (動脈血氧氣分壓)', defaultVal: '94.0', unit: 'mmHg', referenceRange: '80 - 100' },
  { id: 'HCO3', name: 'HCO₃⁻ (動脈血碳酸氫根)', defaultVal: '24.8', unit: 'mEq/L', referenceRange: '22 - 26' },
  { id: 'BE', name: 'Base excess (鹼超值)', defaultVal: '0.5', unit: 'mEq/L', referenceRange: '-2.0 - 2.5' },
  { id: 'SaO2', name: 'SaO₂ (血氧飽和度分析)', defaultVal: '98.5', unit: '%', referenceRange: '95 - 100' },
];

export function getCatalogItemById(id: string): LabCatalogItem | undefined {
  const match = [...CBC_DC_ITEMS, ...BIO_ITEMS, ...ABG_ITEMS].find(item => item.id === id);
  if (match) return match;
  // match by name prefix if id mismatch
  return [...CBC_DC_ITEMS, ...BIO_ITEMS, ...ABG_ITEMS].find(item => item.name.includes(id) || id.includes(item.id));
}
