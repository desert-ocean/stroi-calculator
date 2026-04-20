function num(id) {
  return Number(document.getElementById(id)?.value || 0);
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function format(value, digits = 2) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits
  }).format(round(value, digits));
}

function reserveFactor() {
  return 1 + num('reserve') / 100;
}

function buildResult(text) {
  return { text };
}

function calc() {
  const form = document.getElementById('calc-form');
  const type = form?.dataset.type;
  const result = document.getElementById('result');

  if (!type || !result) {
    return;
  }

  let response = null;

  if (type === 'armatura') {
    const totalLength = num('length') * num('barsPerBelt') * num('belts') * reserveFactor();
    const totalWeight = totalLength * num('weightPerMeter');
    response = totalLength > 0 && totalWeight > 0
      ? buildResult(`Результат: ${format(totalLength, 1)} м арматуры, ориентировочно ${format(totalWeight, 1)} кг.`)
      : null;
  }

  if (type === 'beton') {
    const volume = num('length') * num('width') * num('height') * reserveFactor();
    response = volume > 0
      ? buildResult(`Результат: ${format(volume, 3)} м³ бетона.`)
      : null;
  }

  if (type === 'brus') {
    const volume = num('wallLength') * num('wallHeight') * (num('thickness') / 1000) * reserveFactor();
    response = volume > 0
      ? buildResult(`Результат: ${format(volume, 3)} м³ бруса.`)
      : null;
  }

  if (type === 'doska') {
    const area = num('length') * num('width');
    const boardArea = num('boardLength') * (num('boardWidth') / 1000);
    const quantity = area / boardArea * reserveFactor();
    response = area > 0 && boardArea > 0
      ? buildResult(`Результат: ${format(quantity, 0)} досок на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'dveri') {
    const sets = num('count') * reserveFactor();
    const openingArea = num('count') * num('width') * num('height');
    response = sets > 0 && openingArea > 0
      ? buildResult(`Результат: ${format(sets, 0)} дверных комплектов, площадь проёмов ${format(openingArea, 2)} м².`)
      : null;
  }

  if (type === 'block') {
    const masonryVolume = num('wallArea') * (num('thickness') / 1000);
    const blockVolume = (num('blockLength') / 1000) * (num('blockHeight') / 1000) * (num('blockWidth') / 1000);
    const quantity = masonryVolume / blockVolume * reserveFactor();
    response = masonryVolume > 0 && blockVolume > 0
      ? buildResult(`Результат: ${format(quantity, 0)} шт. материала на объём кладки ${format(masonryVolume, 3)} м³.`)
      : null;
  }

  if (type === 'sheet') {
    const area = num('length') * num('width');
    const sheetArea = num('sheetLength') * num('sheetWidth');
    const quantity = area / sheetArea * reserveFactor();
    response = area > 0 && sheetArea > 0
      ? buildResult(`Результат: ${format(quantity, 0)} листов на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'kley') {
    const mass = num('area') * num('consumption') * reserveFactor();
    response = mass > 0
      ? buildResult(`Результат: ${format(mass, 1)} кг клея.`)
      : null;
  }

  if (type === 'fasteners') {
    const quantity = num('area') * num('rate') * reserveFactor();
    response = quantity > 0
      ? buildResult(`Результат: ${format(quantity, 0)} шт. крепежа.`)
      : null;
  }

  if (type === 'kraska') {
    const liters = num('area') * num('layers') / num('coverage') * reserveFactor();
    response = liters > 0
      ? buildResult(`Результат: ${format(liters, 2)} л краски.`)
      : null;
  }

  if (type === 'krovlya') {
    const area = num('length') * num('width') * num('slopeFactor') * reserveFactor();
    response = area > 0
      ? buildResult(`Результат: ${format(area, 2)} м² кровли.`)
      : null;
  }

  if (type === 'laminat') {
    const area = num('length') * num('width');
    const packs = area / num('packArea') * reserveFactor();
    response = area > 0 && num('packArea') > 0
      ? buildResult(`Результат: ${format(packs, 0)} упаковок ламината на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'lestnica') {
    const steps = Math.ceil(num('height') / num('riser'));
    const run = steps * num('tread') / 1000;
    const angle = Math.atan(num('height') / 1000 / run) * 180 / Math.PI;
    response = steps > 0 && run > 0 && angle > 0
      ? buildResult(`Результат: ${format(steps, 0)} ступеней, длина марша ${format(run, 2)} м, угол подъёма ${format(angle, 1)}°.`)
      : null;
  }

  if (type === 'smesi') {
    const area = num('length') * num('width');
    const mass = area * num('thickness') * num('consumption') * reserveFactor();
    response = area > 0 && mass > 0
      ? buildResult(`Результат: ${format(mass, 1)} кг смеси на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'obem-komnaty') {
    const volume = num('length') * num('width') * num('height');
    response = volume > 0
      ? buildResult(`Результат: ${format(volume, 2)} м³ объёма помещения.`)
      : null;
  }

  if (type === 'oboi') {
    const area = num('perimeter') * num('height') - num('openings');
    const rollArea = num('rollLength') * num('rollWidth');
    const rolls = area / rollArea * reserveFactor();
    response = area > 0 && rollArea > 0
      ? buildResult(`Результат: ${format(rolls, 0)} рулонов обоев на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'wall-area') {
    const area = num('perimeter') * num('height') - num('openings');
    response = area > 0
      ? buildResult(`Результат: ${format(area, 2)} м² площади стен.`)
      : null;
  }

  if (type === 'sypuchie') {
    const volume = num('length') * num('width') * num('height') * reserveFactor();
    const weight = volume * num('density');
    response = volume > 0 && weight > 0
      ? buildResult(`Результат: ${format(volume, 3)} м³ материала, ориентировочно ${format(weight, 2)} т.`)
      : null;
  }

  if (type === 'plitka') {
    const area = num('length') * num('width');
    const tileArea = (num('tileLength') / 1000) * (num('tileWidth') / 1000);
    const quantity = area / tileArea * reserveFactor();
    response = area > 0 && tileArea > 0
      ? buildResult(`Результат: ${format(quantity, 0)} плиток на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'area') {
    const area = num('length') * num('width');
    response = area > 0
      ? buildResult(`Результат: ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'profil') {
    const quantity = num('perimeter') / num('profileLength') * reserveFactor();
    response = quantity > 0
      ? buildResult(`Результат: ${format(quantity, 0)} профилей.`)
      : null;
  }

  if (type === 'bassein') {
    const volume = num('length') * num('width') * num('depth');
    response = volume > 0
      ? buildResult(`Результат: ${format(volume, 2)} м³ воды, это примерно ${format(volume * 1000, 0)} л.`)
      : null;
  }

  if (type === 'materialy') {
    const total = num('area') * num('consumption') * reserveFactor();
    response = total > 0
      ? buildResult(`Результат: ${format(total, 2)} условных единиц материала.`)
      : null;
  }

  if (type === 'okno') {
    const area = num('width') * num('height') * num('count') * reserveFactor();
    response = area > 0
      ? buildResult(`Результат: ${format(area, 2)} м² остекления.`)
      : null;
  }

  if (type === 'plity') {
    const area = num('length') * num('width');
    const slabArea = num('slabLength') * num('slabWidth');
    const quantity = area / slabArea * reserveFactor();
    response = area > 0 && slabArea > 0
      ? buildResult(`Результат: ${format(quantity, 0)} плит перекрытия на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (type === 'cement') {
    const mass = num('volume') * num('rate') * reserveFactor();
    const bags = mass / 50;
    response = mass > 0
      ? buildResult(`Результат: ${format(mass, 1)} кг цемента, это примерно ${format(bags, 1)} мешков по 50 кг.`)
      : null;
  }

  if (type === 'remont') {
    const total = num('area') * num('price') * reserveFactor();
    response = total > 0
      ? buildResult(`Результат: ориентировочно ${format(total, 0)} ₽ на ремонт.`)
      : null;
  }

  if (type === 'shtukaturka') {
    const mass = num('area') * num('thickness') * num('consumption') / 10 * reserveFactor();
    response = mass > 0
      ? buildResult(`Результат: ${format(mass, 1)} кг штукатурки.`)
      : null;
  }

  if (type === 'teplopoteri') {
    const value = num('area') * num('deltaTemp') * num('uValue');
    response = value > 0
      ? buildResult(`Результат: ${format(value, 0)} Вт теплопотерь.`)
      : null;
  }

  if (type === 'ugol-kryshi') {
    const angle = Math.atan(num('rise') / (num('span') / 2)) * 180 / Math.PI;
    response = Number.isFinite(angle) && angle > 0
      ? buildResult(`Результат: угол наклона крыши ${format(angle, 1)}°.`)
      : null;
  }

  if (type === 'uteplitel') {
    const volume = num('area') * (num('thickness') / 1000) * reserveFactor();
    response = volume > 0
      ? buildResult(`Результат: ${format(volume, 3)} м³ утеплителя.`)
      : null;
  }

  if (type === 'vanna') {
    const liters = num('length') * num('width') * num('depth') / 1000 * (num('fill') / 100);
    response = liters > 0
      ? buildResult(`Результат: ${format(liters, 0)} л полезного объёма воды.`)
      : null;
  }

  if (type === 'zatirka') {
    const area = num('length') * num('width');
    const factor = ((num('tileLength') + num('tileWidth')) / (num('tileLength') * num('tileWidth')));
    const mass = area * factor * num('tileThickness') * num('jointWidth') * 1.6 * reserveFactor();
    response = area > 0 && mass > 0
      ? buildResult(`Результат: ${format(mass, 2)} кг затирки на площадь ${format(area, 2)} м².`)
      : null;
  }

  if (!response?.text) {
    result.textContent = 'Введите корректные значения для расчёта.';
    return;
  }

  result.textContent = response.text;
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
