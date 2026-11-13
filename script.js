
function calculateBMI() {

    const weight = Number(document.getElementById("weight").value);
    const height = Number(document.getElementById("height").value);

    const result = document.getElementById("bmi-result");

    if (weight <= 0 || height <= 0 || !weight || !height) {
        result.innerHTML = "Please enter valid weight and height.";
        return;
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    let category = "";

    if (bmi < 18.5) {
        category = "Underweight";
    } else if (bmi < 25) {
        category = "Normal Weight";
    } else if (bmi < 30) {
        category = "Overweight";
    } else {
        category = "Obesity";
    }

    result.innerHTML = `
        <h3>Your BMI: ${bmi.toFixed(1)}</h3>
        <p>Category: <strong>${category}</strong></p>
    `;
}

// CALORIE CALCULATOR

function calculateCalories() {

    const gender = document.getElementById("gender").value;
    const age = Number(document.getElementById("age").value);
    const weight = Number(document.getElementById("cal-weight").value);
    const height = Number(document.getElementById("cal-height").value);
    const activity = Number(document.getElementById("activity").value);
    const goal = document.getElementById("goal").value;

    const result = document.getElementById("calorie-result");

    if (
        !Number.isFinite(age) || age < 15 || age > 100 ||
        !Number.isFinite(weight) || weight <= 0 ||
        !Number.isFinite(height) || height <= 0
    ) {
        result.innerHTML = "Please enter valid information.";
        return;
    }

    // Mifflin-St Jeor Formula
    let bmr;

    if (gender === "male") {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    const maintenance = Math.round(bmr * activity);

    let target = maintenance;

    if (goal === "lose") {
        target = maintenance - 300;
    } else if (goal === "gain") {
        target = maintenance + 200;
    }

    result.innerHTML = `
        <h3>${target} kcal / day</h3>
        <p>Maintenance: ${maintenance} kcal</p>
        <p>Estimated daily calories for your goal.</p>
    `;
}

// WORKOUT TRACKER

const exercises = document.querySelectorAll(".exercise-check");

function updateDashboard() {

    const completed = document.querySelectorAll(
        ".exercise-check:checked"
    ).length;

    const total = exercises.length;
    const percentage = Math.round((completed / total) * 100);

    document.getElementById("workout-count").textContent = completed;
    document.getElementById("goal-count").textContent = percentage + "%";
    document.getElementById("remaining-count").textContent =
        total - completed;

    document.getElementById("progress-fill").style.width =
        percentage + "%";

    document.getElementById("progress-text").textContent =
        `${completed} of ${total} completed`;

    localStorage.setItem("ironfit-workout", JSON.stringify(
        Array.from(exercises).map(item => item.checked)
    ));
}

// Restore saved progress
const savedWorkout = JSON.parse(
    localStorage.getItem("ironfit-workout") || "[]"
);

exercises.forEach((exercise, index) => {
    exercise.checked = savedWorkout[index] || false;

    exercise.addEventListener("change", updateDashboard);
});

function resetWorkout() {

    exercises.forEach(exercise => {
        exercise.checked = false;
    });

    updateDashboard();
}

updateDashboard();

// PROFILE SETTINGS

const profileForm = document.getElementById("profile-form");

function loadProfile() {
    const savedProfile = JSON.parse(
        localStorage.getItem("ironfit-profile")
    );

    if (!savedProfile) return;

    document.getElementById("profile-name").value = savedProfile.name;
    document.getElementById("profile-age").value = savedProfile.age;
    document.getElementById("profile-weight").value = savedProfile.weight;
    document.getElementById("profile-height").value = savedProfile.height;
    document.getElementById("profile-goal").value = savedProfile.goal;

    document.getElementById("profile-display-name").textContent =
        savedProfile.name;
}

if (profileForm) {
    profileForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const profile = {
            name: document.getElementById("profile-name").value,
            age: document.getElementById("profile-age").value,
            weight: document.getElementById("profile-weight").value,
            height: document.getElementById("profile-height").value,
            goal: document.getElementById("profile-goal").value
        };

        localStorage.setItem(
            "ironfit-profile",
            JSON.stringify(profile)
        );

        document.getElementById("profile-display-name").textContent =
            profile.name;

        document.getElementById("profile-message").textContent =
            "Profile updated successfully!";

    });

    loadProfile();
}
