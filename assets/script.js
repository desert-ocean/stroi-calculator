function calc() {
    let volume = document.getElementById("volume").value;
    let ratio = document.getElementById("ratio").value;

    let cement = volume * (ratio / 100) * 1400; // пример формулы

    document.getElementById("result").innerText =
        "Нужно цемента: " + Math.ceil(cement) + " кг";
}