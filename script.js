// Helpers: unit conversions
function ftInToCm(ft, inch){ return (parseFloat(ft||0)*12 + parseFloat(inch||0)) * 2.54; }
function inToCm(i){ return parseFloat(i||0) * 2.54; }
function lbsToKg(lbs){ return parseFloat(lbs||0) * 0.45359237; }
function cmToM(cm){ return parseFloat(cm||0) / 100.0; }

// DOM helpers
function el(id){ return document.getElementById(id); }
function show(id){ el(id).classList.remove('hidden'); }
function hide(id){ el(id).classList.add('hidden'); }

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// Body-fat mapping score: maps a value to a 0-100ish score with ideal range -> high score
function mapToScore(val, idealMin, idealMax, absoluteMin, absoluteMax){
  // if inside ideal → 90
  if(val >= idealMin && val <= idealMax) return 90;
  // below ideal: interpolate between absoluteMin -> idealMin to scores 20 -> 90
  if(val < idealMin){
    let t = (val - absoluteMin) / (idealMin - absoluteMin);
    t = clamp(t, 0, 1);
    return Math.round((20 + t * (90-20)) );
  }
  // above ideal: interpolate idealMax -> absoluteMax
  if(val > idealMax){
    let t = (val - idealMax) / (absoluteMax - idealMax);
    t = clamp(t, 0, 1);
    return Math.round((90 - t * (90-20)) );
  }
  return 50;
}

function bmiCategory(bmi){
  if(bmi < 18.5) return "Underweight";
  if(bmi < 25) return "Normal";
  if(bmi < 30) return "Overweight";
  return "Obese";
}

function bodyFatCategory(sex, bf){
  bf = parseFloat(bf);
  if(sex === 'male'){
    if(bf <= 5) return "Essential";
    if(bf <= 13) return "Athlete";
    if(bf <= 17) return "Fit";
    if(bf <= 24) return "Average";
    return "Obese";
  } else {
    if(bf <= 13) return "Essential";
    if(bf <= 20) return "Athlete";
    if(bf <= 24) return "Fit";
    if(bf <= 31) return "Average";
    return "Obese";
  }
}

// determine frame from wrist (in inches)
function frameFromWrist(sex, wristIn){
  let frame = "Medium";
  if(sex === 'female'){
    if(wristIn <= 5.5) frame = "Small";
    else if(wristIn > 5.75) frame = "Large";
    else frame = "Medium";
  } else {
    if(wristIn <= 6.5) frame = "Small";
    else if(wristIn > 7.5) frame = "Large";
    else frame = "Medium";
  }
  return frame;
}

// Score category & color
function scoreCategoryColor(score){
  // score 0-100
  if(score >= 80) return {cat:"Athlete", color:"#2563eb"}; // blue
  if(score >= 65) return {cat:"Lean", color:"#059669"}; // green
  if(score >= 50) return {cat:"Healthy", color:"#10b981"}; // light green
  if(score >= 35) return {cat:"Overfat", color:"#f59e0b"}; // orange
  return {cat:"Obese", color:"#ef4444"}; // red
}

// US Navy formulas expect cm. returns percentage
function navyBodyFat(sex, heightCm, neckCm, waistCm, hipCm){
  // Ensure inputs > 0
  if(!heightCm || !neckCm || !waistCm) return NaN;
  if(sex === 'male'){
    // male: uses waist - neck
    let a = 1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm);
    let bf = 495 / a - 450;
    return bf;
  } else {
    // female uses waist + hip - neck
    if(!hipCm) return NaN;
    let a = 1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm);
    let bf = 495 / a - 450;
    return bf;
  }
}

function parseInputs(){
  const sex = el('sex').value;

  // Height
  const heightUnit = el('heightUnit').value;
  let heightCm = null;
  if(heightUnit === 'cm'){
    heightCm = parseFloat(el('heightCm').value) || 0;
  } else {
    const ft = parseFloat(el('heightFt').value) || 0;
    const inch = parseFloat(el('heightIn').value) || 0;
    heightCm = ftInToCm(ft, inch);
  }

  // Weight
  const weightUnit = el('weightUnit').value;
  let weightKg = 0;
  if(weightUnit === 'kg') weightKg = parseFloat(el('weightKg').value) || 0;
  else weightKg = lbsToKg(parseFloat(el('weightLbs').value) || 0);

  // Circumferences
  let neck = parseFloat(el('neck').value) || 0;
  let waist = parseFloat(el('waist').value) || 0;
  let hip = parseFloat(el('hip').value) || 0;
  let wrist = parseFloat(el('wrist').value) || 0;

  // convert circumference units to cm
  const nUnit = el('circUnitNeck').value;
  const wUnit = el('circUnitWaist').value;
  const hUnit = el('circUnitHip').value;
  const wrUnit = el('circUnitWrist').value;

  if(nUnit === 'in') neck = inToCm(neck);
  if(wUnit === 'in') waist = inToCm(waist);
  if(hUnit === 'in') hip = inToCm(hip);
  if(wrUnit === 'in') wrist = inToCm(wrist);

  return { sex, heightCm, weightKg, neck, waist, hip, wrist };
}

function displayError(msg){
  el('output').classList.remove('hidden');
  el('bmiText').innerText = '';
  el('bmiCat').innerText = '';
  el('frameText').innerText = '';
  el('bfText').innerText = '';
  el('bfCategory').innerText = '';
  el('scoreText').innerText = msg;
  el('scoreFill').style.width = '0%';
  el('scoreCategory').innerText = '';
}

function calculateAll(){
  const inputs = parseInputs();
  const sex = inputs.sex;
  const heightCm = inputs.heightCm;
  const weightKg = inputs.weightKg;
  const neckCm = inputs.neck;
  const waistCm = inputs.waist;
  const hipCm = inputs.hip;
  const wristCm = inputs.wrist;

  // Basic validation
  if(!heightCm || !weightKg){
    displayError("Please enter valid height and weight.");
    return;
  }

  // Derived
  const heightM = cmToM(heightCm);
  const bmi = weightKg / (heightM * heightM);
  const bmiText = bmi.toFixed(1);

  // Navy BF (if measurements available)
  const bf = navyBodyFat(sex, heightCm, neckCm, waistCm, hipCm);
  const bfPretty = (isNaN(bf) ? "— (need neck/waist" + (sex==='female' ? "/hip" : "") + ")" : bf.toFixed(1)+"%");

  // Convert wrist to inches for frame sizing thresholds
  const wristIn = wristCm ? (wristCm / 2.54) : 0;
  const frame = wristIn ? frameFromWrist(sex, wristIn) : "—";

  // Lean mass proxy if bf available
  let leanMassKg = NaN;
  if(!isNaN(bf)){
    leanMassKg = weightKg * (1 - bf/100);
  }

  // Component scores
  // bodyFatScore (50% weight)
  let bodyFatScore = 50; // fallback
  if(!isNaN(bf)){
    if(sex === 'male'){
      bodyFatScore = mapToScore(bf, 8, 20, 3, 45);
    } else {
      bodyFatScore = mapToScore(bf, 21, 33, 6, 50);
    }
  } else {
    // when bf unknown, estimate a neutral score from BMI
    bodyFatScore = (bmi >= 18.5 && bmi <= 24.9) ? 80 : 60;
  }

  // muscle proxy score (30% weight) use lean mass index (kg / m^2)
  let muscleScore = 60;
  if(!isNaN(leanMassKg)){
    const lmi = leanMassKg / (heightM * heightM);
    // thresholds: these are heuristics
    if(lmi >= 18) muscleScore = 90;
    else if(lmi >= 15) muscleScore = 75;
    else muscleScore = 55;
  } else {
    // fallback using BMI
    muscleScore = (bmi > 25) ? 65 : 70;
  }

  // bmiScore (20% weight) map BMI to 0-100 style
  let bmiScore = 50;
  if(!isNaN(bmi)){
    // ideal 18.5-24.9 -> score 90
    if(bmi >= 18.5 && bmi <= 24.9) bmiScore = 90;
    else if(bmi < 18.5){
      bmiScore = Math.round(20 + (bmi - 12) / (18.5 - 12) * (90-20));
      bmiScore = clamp(bmiScore, 10, 90);
    } else {
      bmiScore = Math.round(90 - (bmi - 24.9) / (45 - 24.9) * (90-20));
      bmiScore = clamp(bmiScore, 10, 90);
    }
  }

  // Combine into Body Score (0-100)
  const bodyScore = Math.round( (0.5 * bodyFatScore) + (0.3 * muscleScore) + (0.2 * bmiScore) );

  // Determine Body Score category + color
  const sc = scoreCategoryColor(bodyScore);

  // Display results
  el('output').classList.remove('hidden');
  el('bmiText').innerHTML = `${bmiText} (kg/m²)`;
  el('bmiCat').innerText = `BMI category: ${bmiCategory(bmi)}`;

  el('frameText').innerText = `${frame} (${wristIn ? wristIn.toFixed(1) + " in" : "enter wrist"})`;
  el('frameExplain').innerText = `Estimated from wrist circumference`;

  el('bfText').innerText = bfPretty;
  if(!isNaN(bf)) el('bfCategory').innerText = `BF category: ${bodyFatCategory(sex, bf)}`; else el('bfCategory').innerText = '';

  el('scoreText').innerText = `${bodyScore}/100`;
  const pct = clamp(bodyScore, 0, 100) + '%';
  el('scoreFill').style.width = pct;
  el('scoreFill').style.background = sc.color;
  el('scoreCategory').innerText = `${sc.cat}`;

  // Optionally offer both metric and imperial display in small text
  // bmi in imperial already usable: BMI displayed is metric standard

}

// UI wiring
function wireUI(){
  // units toggles
  el('heightUnit').addEventListener('change', function(){
    if(this.value === 'cm'){
      el('heightCm').classList.remove('hidden');
      el('ftinInputs').classList.add('hidden');
    } else {
      el('heightCm').classList.add('hidden');
      el('ftinInputs').classList.remove('hidden');
    }
  });
  el('weightUnit').addEventListener('change', function(){
    if(this.value === 'kg'){
      el('weightKg').classList.remove('hidden');
      el('weightLbs').classList.add('hidden');
    } else {
      el('weightKg').classList.add('hidden');
      el('weightLbs').classList.remove('hidden');
    }
  });

  // show/hide hip input for male/female
  el('sex').addEventListener('change', function(){
    if(this.value === 'female'){
      el('hipLabel').classList.remove('hidden');
    } else {
      el('hipLabel').classList.add('hidden');
    }
  });

  // Buttons
  el('calcBtn').addEventListener('click', function(e){
    e.preventDefault();
    calculateAll();
  });
  el('clearBtn').addEventListener('click', function(){
    // clear inputs & output
    ['heightCm','heightFt','heightIn','weightKg','weightLbs','neck','waist','hip','wrist'].forEach(id => el(id).value = '');
    el('output').classList.add('hidden');
    el('scoreFill').style.width = '0%';
  });

  // initialize defaults
  el('heightUnit').dispatchEvent(new Event('change'));
  el('weightUnit').dispatchEvent(new Event('change'));
  el('sex').dispatchEvent(new Event('change'));
}

document.addEventListener('DOMContentLoaded', wireUI);
