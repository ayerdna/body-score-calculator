document.getElementById("calculate").addEventListener("click", function() {
    // Inputs
    let height = parseFloat(document.getElementById("height").value); // in inches
    let weight = parseFloat(document.getElementById("weight").value); // in pounds
    let wrist = parseFloat(document.getElementById("wrist").value);   // in inches
    let sex = document.getElementById("sex").value;

    // Validation
    if (isNaN(height) || isNaN(weight) || isNaN(wrist)) {
        document.getElementById("result").innerHTML = "⚠️ Please fill in all fields.";
        return;
    }

    // Basic BMI
    let bmi = (weight / (height * height)) * 703;

    // Frame size from wrist
    let frame = "Medium";
    if (sex === "female") {
        if (wrist <= 5.5) frame = "Small";
        else if (wrist > 5.75) frame = "Large";
    } else if (sex === "male") {
        if (wrist <= 6.5) frame = "Small";
        else if (wrist > 7.5) frame = "Large";
    }

    // Adjust BMI for frame size
    let adjusted = bmi;
    if (frame === "Small") adjusted -= 1.5;
    if (frame === "Large") adjusted += 1.5;

    // Classification (reference scale)
    let category = "";
    if (adjusted < 18) category = "Underweight";
    else if (adjusted < 23) category = "Lean / Athletic";
    else if (adjusted < 28) category = "Balanced / Healthy";
    else if (adjusted < 33) category = "Heavy Build";
    else if (adjusted < 38) category = "Muscular / Stocky";
    else category = "Obese range";

    // Display results
    document.getElementById("result").innerHTML = `
        <strong>Score:</strong> ${adjusted.toFixed(1)} <br>
        <strong>Frame Size:</strong> ${frame} <br>
        <strong>Category:</strong> ${category}
    `;
});
