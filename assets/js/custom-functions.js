const MY_BIRTH_YEAR = 1998;

function calculateYearDiff(year) {
    return new Date().getFullYear() - year;
}

function populateAge() {
    document.getElementById("age-container").innerText = calculateYearDiff(MY_BIRTH_YEAR);
}

document.addEventListener("DOMContentLoaded", populateAge);
