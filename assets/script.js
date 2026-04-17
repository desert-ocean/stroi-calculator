function num(id) {
  return Number(document.getElementById(id)?.value || 0);
}

function calc() {
  const form = document.getElementById('calc-form');
  const type = form?.dataset.type;
  const result = document.getElementById('result');

  if (!type || !result) {
    return;
  }

  let value = 0;
  let unit = '';

  if (type === 'cement') {
    value = num('volume') * 1400 * num('ratio');
    unit = 'кг цемента';
  }

  if (type === 'beton') {
    value = num('volume') * 300 * (1 + num('reserve') / 100);
    unit = 'кг сухой смеси';
  }

  if (type === 'plitka') {
    value = (num('area') / num('tileArea')) * 1.1;
    unit = 'шт. плитки';
  }

  if (type === 'oboi') {
    value = (num('wallArea') / num('rollArea')) * 1.1;
    unit = 'рулонов обоев';
  }

  if (type === 'kraski') {
    value = num('area') / num('consumption');
    unit = 'л краски';
  }

  if (type === 'kirpich') {
    value = num('wallVolume') / num('brickVolume');
    unit = 'шт. кирпича';
  }

  if (type === 'shtukaturka') {
    value = num('area') * num('thickness') * num('density');
    unit = 'кг штукатурки';
  }

  if (type === 'gipsokarton') {
    value = num('area') / num('sheetArea');
    unit = 'листов гипсокартона';
  }

  if (type === 'pol') {
    value = num('area') / num('boardArea');
    unit = 'досок для пола';
  }

  if (type === 'doski') {
    value = num('area') / num('boardArea');
    unit = 'досок';
  }

  if (type === 'teplopoteri') {
    value = num('area') * num('deltaTemp') * num('uValue');
    unit = 'Вт теплопотерь';
  }

  if (!Number.isFinite(value) || value <= 0) {
    result.textContent = 'Введите корректные значения для расчёта.';
    return;
  }

  result.textContent = `Результат: ${Math.ceil(value)} ${unit}.`;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calc-form');

  if (!form) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calc();
  });
});