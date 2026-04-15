(function () {
  const CEMENT_COEFFICIENTS = {
    M100: 220,
    M200: 280,
    M300: 350,
    M400: 400,
  };

  const modeInputs = document.querySelectorAll('input[name="calcMode"]');
  const volumeFields = document.getElementById('volumeFields');
  const sizeFields = document.getElementById('sizeFields');
  const volumeInput = document.getElementById('volume');
  const lengthInput = document.getElementById('length');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const gradeSelect = document.getElementById('concreteGrade');
  const resultBlock = document.getElementById('result');
  const calcButton = document.getElementById('calcButton');

  if (!calcButton) {
    return;
  }

  function getSelectedMode() {
    const checkedMode = document.querySelector('input[name="calcMode"]:checked');
    return checkedMode ? checkedMode.value : 'volume';
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function showModeFields() {
    const mode = getSelectedMode();
    const isVolumeMode = mode === 'volume';

    volumeFields.classList.toggle('hidden', !isVolumeMode);
    sizeFields.classList.toggle('hidden', isVolumeMode);
  }

  function getConcreteVolume(mode) {
    if (mode === 'volume') {
      return toNumber(volumeInput.value);
    }

    const length = toNumber(lengthInput.value);
    const width = toNumber(widthInput.value);
    const height = toNumber(heightInput.value);
    return length * width * height;
  }

  function formatNumber(value) {
    return value.toLocaleString('ru-RU');
  }

  function calc() {
    const mode = getSelectedMode();
    const volume = getConcreteVolume(mode);
    const grade = gradeSelect.value;
    const coefficient = CEMENT_COEFFICIENTS[grade];

    if (!volume || volume <= 0) {
      resultBlock.textContent = 'Введите корректные значения. Объем должен быть больше 0.';
      return;
    }

    if (!coefficient) {
      resultBlock.textContent = 'Не удалось определить коэффициент для выбранной марки бетона.';
      return;
    }

    const roundedVolume = Math.ceil(volume);
    const cementKg = Math.ceil(volume * coefficient);
    const cementBags = Math.ceil(cementKg / 50);

    resultBlock.innerHTML = [
      '<strong>Результат расчета:</strong>',
      '<ul>',
      `<li>Объем бетона: ${formatNumber(roundedVolume)} м³</li>`,
      `<li>Количество цемента: ${formatNumber(cementKg)} кг</li>`,
      `<li>Количество мешков (50 кг): ${formatNumber(cementBags)} шт.</li>`,
      '</ul>',
    ].join('');
  }

  modeInputs.forEach(function (input) {
    input.addEventListener('change', showModeFields);
  });

  calcButton.addEventListener('click', calc);
  showModeFields();

  window.calc = calc;
})();
