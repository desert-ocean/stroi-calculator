const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'programmatic-seo.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'templates', 'programmatic-template.html'), 'utf8');
const outputDir = path.join(root, 'programmatic');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatRu(value, digits = 2) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(Number(value.toFixed(digits)));
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickVariant(seed, options) {
  return options[hashString(seed) % options.length];
}

function fieldHtml(field) {
  return `<div>
            <label for="${field.id}">${field.label}</label>
            <input id="${field.id}" type="number" step="${field.step}" value="${field.value}" placeholder="${field.placeholder}">
            <p>${field.help}</p>
          </div>`;
}

function buildForm(preset, values) {
  const presets = {
    foundation: { type: 'beton', fields: [
      { id: 'length', label: 'Суммарная длина ленты, м', step: '0.1', value: values.length, placeholder: 'Например, 40', help: 'Сложите наружный периметр и внутренние несущие участки.' },
      { id: 'width', label: 'Ширина ленты, м', step: '0.01', value: values.width, placeholder: 'Например, 0.4', help: 'Берите рабочую ширину бетонной ленты.' },
      { id: 'height', label: 'Высота бетонирования, м', step: '0.01', value: values.height, placeholder: 'Например, 1.2', help: 'Укажите именно высоту бетонной части.' },
      { id: 'reserve', label: 'Запас, %', step: '0.1', value: values.reserve, placeholder: 'Например, 7', help: 'Резерв нужен на потери смеси и неточные замеры.' }
    ]},
    beton: { type: 'beton', fields: [
      { id: 'length', label: 'Длина участка, м', step: '0.1', value: values.length, placeholder: 'Например, 8', help: 'Чистая длина плиты, площадки или дорожки.' },
      { id: 'width', label: 'Ширина участка, м', step: '0.1', value: values.width, placeholder: 'Например, 6', help: 'Для сложной формы считайте зоны отдельно.' },
      { id: 'height', label: 'Толщина слоя, м', step: '0.01', value: values.height, placeholder: 'Например, 0.18', help: 'Для плиты и дорожек это толщина бетонного слоя.' },
      { id: 'reserve', label: 'Запас, %', step: '0.1', value: values.reserve, placeholder: 'Например, 7', help: 'Резерв на потери при подаче и подрезку.' }
    ]},
    screed: { type: 'smesi', fields: [
      { id: 'length', label: 'Длина помещения, м', step: '0.1', value: values.length, placeholder: 'Например, 6', help: 'Длина пола или одной рабочей зоны.' },
      { id: 'width', label: 'Ширина помещения, м', step: '0.1', value: values.width, placeholder: 'Например, 5', help: 'Ширина той же зоны, где делается стяжка.' },
      { id: 'thickness', label: 'Средняя толщина стяжки, мм', step: '1', value: values.thickness, placeholder: 'Например, 50', help: 'Толщину берите после выставления уровня и маяков.' },
      { id: 'consumption', label: 'Расход смеси на 1 мм, кг/м²', step: '0.01', value: values.consumption, placeholder: 'Например, 1.8', help: 'Норма расхода зависит от выбранной смеси.' },
      { id: 'reserve', label: 'Запас, %', step: '0.1', value: values.reserve, placeholder: 'Например, 8', help: 'Запас нужен на локальные перепады и потери.' }
    ]},
    tile: { type: 'plitka', fields: [
      { id: 'length', label: 'Длина поверхности, м', step: '0.1', value: values.length, placeholder: 'Например, 3', help: 'Для пола это длина комнаты, для стены длина участка.' },
      { id: 'width', label: 'Ширина или высота поверхности, м', step: '0.1', value: values.width, placeholder: 'Например, 2', help: 'Второй размер облицовываемой зоны.' },
      { id: 'tileLength', label: 'Длина плитки, мм', step: '1', value: values.tileLength, placeholder: 'Например, 600', help: 'Размер плитки по рабочему формату.' },
      { id: 'tileWidth', label: 'Ширина плитки, мм', step: '1', value: values.tileWidth, placeholder: 'Например, 600', help: 'Для прямоугольной плитки ширина и длина разные.' },
      { id: 'reserve', label: 'Запас, %', step: '0.1', value: values.reserve, placeholder: 'Например, 10', help: 'Резерв нужен на подрезку и диагональную раскладку.' }
    ]},
    insulation: { type: 'uteplitel', fields: [
      { id: 'area', label: 'Площадь стен, м²', step: '0.1', value: values.area, placeholder: 'Например, 100', help: 'Берите чистую площадь без крупных проёмов.' },
      { id: 'thickness', label: 'Толщина утеплителя, мм', step: '1', value: values.thickness, placeholder: 'Например, 100', help: 'Рабочая толщина выбранного материала.' },
      { id: 'reserve', label: 'Запас, %', step: '0.1', value: values.reserve, placeholder: 'Например, 8', help: 'Резерв нужен на подрезку плит и сложные узлы.' }
    ]},
    repair: { type: 'remont', fields: [
      { id: 'area', label: 'Площадь квартиры, м²', step: '0.1', value: values.area, placeholder: 'Например, 50', help: 'Суммарная площадь всех помещений в ремонте.' },
      { id: 'price', label: 'Стоимость ремонта за 1 м², ₽', step: '1', value: values.price, placeholder: 'Например, 19000', help: 'Цена зависит от региона и уровня отделки.' },
      { id: 'reserve', label: 'Запас, %', step: '0.1', value: values.reserve, placeholder: 'Например, 12', help: 'Резерв нужен на скрытые работы и материалы.' }
    ]}
  };

  const config = presets[preset];
  return `<form id="calc-form" data-type="${config.type}">
        <div class="form-grid">
${config.fields.map(fieldHtml).join('\n')}
        </div>
        <button type="submit">Рассчитать</button>
      </form>`;
}

function calculateMetrics(cluster, scenario) {
  if (cluster.formPreset === 'foundation') {
    const baseVolume = scenario.length * scenario.width * scenario.height;
    const finalVolume = baseVolume * (1 + scenario.reserve / 100);
    const cementKg = finalVolume * 320;
    return {
      liveResult: `Результат: ${formatRu(finalVolume, 3)} м³ бетона.`,
      summary: `Для фундамента ${scenario.sizeText} расчёт даёт ${formatRu(finalVolume, 3)} м³ бетона с резервом ${scenario.reserve}%. Это уже готовая цифра для заказа бетона, а не только текстовый пример.`,
      formula: `V = длина ленты × ширина × высота × (1 + запас / 100) = ${scenario.length} × ${scenario.width} × ${scenario.height} × ${formatRu(1 + scenario.reserve / 100, 2)}`,
      inputs: [
        `Суммарная длина ленты: ${formatRu(scenario.length, 1)} м`,
        `Ширина ленты: ${formatRu(scenario.width, 2)} м`,
        `Высота бетонирования: ${formatRu(scenario.height, 2)} м`,
        `Чистый объём без запаса: ${formatRu(baseVolume, 3)} м³`
      ],
      results: [
        `Итоговый объём бетона: ${formatRu(finalVolume, 3)} м³`,
        `Ориентир по цементу при норме 320 кг/м³: ${formatRu(cementKg, 0)} кг`,
        `Это примерно ${formatRu(cementKg / 50, 1)} мешков цемента по 50 кг`,
        `При доставке миксером по 7 м³ понадобится около ${formatRu(finalVolume / 7, 1)} рейса`
      ],
      explanation: `Если в проекте появится внутренняя несущая лента или ростверк, достаточно увеличить общую длину и пересчитать сценарий. Базовая формула совпадает с логикой основного калькулятора фундамента.`
    };
  }

  if (cluster.formPreset === 'beton') {
    const baseVolume = scenario.length * scenario.width * scenario.height;
    const finalVolume = baseVolume * (1 + scenario.reserve / 100);
    const area = scenario.length * scenario.width;
    return {
      liveResult: `Результат: ${formatRu(finalVolume, 3)} м³ бетона.`,
      summary: `Для сценария «${scenario.object} ${scenario.sizeText}» итоговый расчёт составляет ${formatRu(finalVolume, 3)} м³ бетона. Пользователь сразу видит реальные числа по площади и толщине слоя.`,
      formula: `V = длина × ширина × толщина × (1 + запас / 100) = ${scenario.length} × ${scenario.width} × ${scenario.height} × ${formatRu(1 + scenario.reserve / 100, 2)}`,
      inputs: [
        `Длина участка: ${formatRu(scenario.length, 1)} м`,
        `Ширина участка: ${formatRu(scenario.width, 1)} м`,
        `Площадь участка: ${formatRu(area, 2)} м²`,
        `Толщина слоя: ${formatRu(scenario.height * 100, 0)} см`
      ],
      results: [
        `Чистый объём без запаса: ${formatRu(baseVolume, 3)} м³`,
        `Итоговый объём бетона: ${formatRu(finalVolume, 3)} м³`,
        `Запас в абсолютном значении: ${formatRu(finalVolume - baseVolume, 3)} м³`,
        `При заливке миксером по 7 м³ это около ${formatRu(finalVolume / 7, 1)} рейса`
      ],
      explanation: `Такой формат особенно полезен для плит, отмосток и дорожек, где пользователь обычно ищет готовую кубатуру под конкретный размер, а не общий справочный калькулятор.`
    };
  }

  if (cluster.formPreset === 'screed') {
    const area = scenario.length * scenario.width;
    const mass = area * scenario.thickness * scenario.consumption * (1 + scenario.reserve / 100);
    const cleanMass = area * scenario.thickness * scenario.consumption;
    return {
      liveResult: `Результат: ${formatRu(mass, 1)} кг смеси на площадь ${formatRu(area, 2)} м².`,
      summary: `Для стяжки площадью ${formatRu(area, 2)} м² и толщиной ${formatRu(scenario.thickness / 10, 0)} см нужно ${formatRu(mass, 1)} кг смеси с учётом запаса. Это уже можно переводить в мешки и бюджет.`,
      formula: `M = площадь × толщина в мм × расход на 1 мм × (1 + запас / 100) = ${formatRu(area, 2)} × ${scenario.thickness} × ${scenario.consumption} × ${formatRu(1 + scenario.reserve / 100, 2)}`,
      inputs: [
        `Длина помещения: ${formatRu(scenario.length, 1)} м`,
        `Ширина помещения: ${formatRu(scenario.width, 1)} м`,
        `Площадь пола: ${formatRu(area, 2)} м²`,
        `Средняя толщина стяжки: ${formatRu(scenario.thickness / 10, 0)} см`
      ],
      results: [
        `Чистый расход без запаса: ${formatRu(cleanMass, 1)} кг`,
        `Итоговый расход смеси: ${formatRu(mass, 1)} кг`,
        `Это примерно ${formatRu(mass / 25, 0)} мешков по 25 кг`,
        `Или около ${formatRu(mass / 40, 0)} мешков по 40 кг`
      ],
      explanation: `Здесь расчёт строится по той же логике, что и основной калькулятор стяжки: площадь умножается на толщину и норму расхода. Отличие в том, что сценарий уже адаптирован под конкретную толщину и площадь запроса.`
    };
  }

  if (cluster.formPreset === 'tile') {
    const area = scenario.length * scenario.width;
    const tileArea = (scenario.tileLength / 1000) * (scenario.tileWidth / 1000);
    const cleanTiles = area / tileArea;
    const finalTiles = cleanTiles * (1 + scenario.reserve / 100);
    return {
      liveResult: `Результат: ${formatRu(finalTiles, 0)} плиток на площадь ${formatRu(area, 2)} м².`,
      summary: `Для облицовки ${scenario.object} площадью ${scenario.sizeText} понадобится около ${formatRu(finalTiles, 0)} плиток с запасом ${scenario.reserve}%. Страница показывает реальное количество, а не только общие рекомендации.`,
      formula: `N = площадь облицовки ÷ площадь одной плитки × (1 + запас / 100) = ${formatRu(area, 2)} ÷ ${formatRu(tileArea, 3)} × ${formatRu(1 + scenario.reserve / 100, 2)}`,
      inputs: [
        `Размер поверхности: ${formatRu(scenario.length, 1)} × ${formatRu(scenario.width, 1)} м`,
        `Площадь облицовки: ${formatRu(area, 2)} м²`,
        `Формат плитки: ${scenario.tileLength} × ${scenario.tileWidth} мм`,
        `Площадь одной плитки: ${formatRu(tileArea, 3)} м²`
      ],
      results: [
        `Чистое количество плиток без запаса: ${formatRu(cleanTiles, 0)} шт.`,
        `Итоговое количество с запасом: ${formatRu(finalTiles, 0)} шт.`,
        `Дополнительный резерв: ${formatRu(finalTiles - cleanTiles, 0)} шт.`,
        `Запрос лучше закрывается под практический кейс: конкретная площадь + формат плитки`
      ],
      explanation: `В отличие от шаблонной SEO-страницы здесь расчёт зависит от реальной площади поверхности и размера плитки. Если пользователь меняет формат с 300×300 на 600×600 мм, количество пересчитывается сразу.`
    };
  }

  if (cluster.formPreset === 'insulation') {
    const cleanVolume = scenario.area * (scenario.thickness / 1000);
    const finalVolume = cleanVolume * (1 + scenario.reserve / 100);
    return {
      liveResult: `Результат: ${formatRu(finalVolume, 3)} м³ утеплителя.`,
      summary: `Для утепления ${scenario.object} площадью ${scenario.sizeText} и толщиной ${scenario.thickness} мм требуется ${formatRu(finalVolume, 3)} м³ утеплителя с учётом подрезки и технологического запаса.`,
      formula: `V = площадь × толщина слоя × (1 + запас / 100) = ${scenario.area} × ${formatRu(scenario.thickness / 1000, 3)} × ${formatRu(1 + scenario.reserve / 100, 2)}`,
      inputs: [
        `Площадь стен: ${formatRu(scenario.area, 1)} м²`,
        `Толщина утепления: ${scenario.thickness} мм`,
        `Чистый объём без запаса: ${formatRu(cleanVolume, 3)} м³`,
        `Запас на подрезку: ${scenario.reserve}%`
      ],
      results: [
        `Итоговый объём утеплителя: ${formatRu(finalVolume, 3)} м³`,
        `Добавочный резерв: ${formatRu(finalVolume - cleanVolume, 3)} м³`,
        `При слое ${scenario.thickness} мм объём напрямую зависит от площади фасада`,
        `Страница уже содержит готовый набор параметров для типового long-tail запроса`
      ],
      explanation: `На практике пользователю важнее всего быстро получить кубатуру утеплителя по своей площади и толщине, а затем перейти к расчёту фасада или теплопотерь. Эта страница решает именно эту задачу.`
    };
  }

  const cleanBudget = scenario.area * scenario.price;
  const finalBudget = cleanBudget * (1 + scenario.reserve / 100);
  return {
    liveResult: `Результат: ориентировочно ${formatRu(finalBudget, 0)} ₽ на ремонт.`,
    summary: `Для квартиры площадью ${scenario.sizeText} ориентировочный бюджет ремонта составляет ${formatRu(finalBudget, 0)} ₽ с резервом ${scenario.reserve}%. Число зависит от реальной ставки за м² и не является шаблонной подстановкой.`,
    formula: `Бюджет = площадь × цена за м² × (1 + запас / 100) = ${scenario.area} × ${scenario.price} × ${formatRu(1 + scenario.reserve / 100, 2)}`,
    inputs: [
      `Площадь квартиры: ${formatRu(scenario.area, 1)} м²`,
      `Ставка ремонта: ${formatRu(scenario.price, 0)} ₽ за м²`,
      `Бюджет без запаса: ${formatRu(cleanBudget, 0)} ₽`,
      `Резерв на скрытые работы: ${scenario.reserve}%`
    ],
    results: [
      `Итоговая смета: ${formatRu(finalBudget, 0)} ₽`,
      `Размер резерва: ${formatRu(finalBudget - cleanBudget, 0)} ₽`,
      `Средний бюджет на каждый м² с резервом: ${formatRu(finalBudget / scenario.area, 0)} ₽`,
      `Расчёт удобен как стартовая точка перед детальной сметой по материалам`
    ],
    explanation: `Здесь страница отличается не только цифрой площади. Меняется итоговая смета, размер резерва и пояснение сценария, поэтому long-tail URL выглядит как самостоятельный расчётный кейс.`
  };
}

function scenarioDescriptor(cluster, scenario) {
  if (cluster.id === 'foundation') {
    return `фундамент ${scenario.sizeText}`;
  }
  if (cluster.id === 'slab-beton') {
    return `${scenario.object} ${scenario.sizeText}`;
  }
  if (cluster.id === 'screed') {
    return `стяжка ${scenario.sizeText} толщиной ${formatRu(scenario.thickness / 10, 0)} см`;
  }
  if (cluster.id === 'tile') {
    return `плитка для ${scenario.object} ${scenario.sizeText}`;
  }
  if (cluster.id === 'insulation') {
    return `утепление ${scenario.object} ${scenario.sizeText}`;
  }
  return `ремонт квартиры ${scenario.sizeText}`;
}

function meta(cluster, scenario, metrics) {
  const seed = scenario.slug;
  const introLead = pickVariant(seed, [
    'Страница собрана под конкретный long-tail запрос и сразу показывает рабочий сценарий с числами.',
    'Это не абстрактное описание, а готовый расчётный кейс с параметрами, которые можно сразу проверить в форме.',
    'Пользователь попадает на страницу уже с заданными размерами и видит итоговый результат без ручной подготовки.'
  ]);

  if (cluster.id === 'foundation') {
    const finalVolume = scenario.length * scenario.width * scenario.height * (1 + scenario.reserve / 100);
    return {
      title: `Расчет бетона для фундамента ${scenario.sizeText} — ${formatRu(finalVolume, 3)} м³ бетона онлайн`,
      description: `Расчет бетона для фундамента ${scenario.sizeText}: длина ленты ${scenario.length} м, ширина ${scenario.width} м, высота ${scenario.height} м. Итог ${formatRu(scenario.length * scenario.width * scenario.height * (1 + scenario.reserve / 100), 3)} м³.`,
      h1: `Расчет бетона для фундамента ${scenario.sizeText}`,
      intro: `${introLead} Для фундамента ${scenario.sizeText} уже подставлены длина ленты, ширина и высота бетонирования, поэтому итоговая кубатура считается по реальной формуле, а не по шаблонной вставке текста.`,
      intro2: `Страница заточена под запросы вида «сколько бетона нужно на фундамент ${scenario.sizeText}» и показывает конкретный объём ${formatRu(finalVolume, 3)} м³. После проверки пользователь может сразу перейти в основной калькулятор фундамента.`,
      body1: `Для сценария ${scenarioDescriptor(cluster, scenario)} ключевой параметр — суммарная длина ленты ${scenario.length} м. Именно она чаще всего теряется в общих статьях, где говорят о площади дома, но не переводят её в реальную кубатуру бетона.`,
      body2: `В этом кейсе итоговый объём получен по той же логике, что и в существующем калькуляторе: длина умножается на ширину, высоту и коэффициент запаса. Поэтому страница полезна не только для SEO, но и как быстрый инженерный ориентир.`,
      body3: `Если проект отличается по высоте ленты или ширине основания, цифры можно тут же изменить в форме. Это сохраняет пользу страницы и не превращает её в статичный текст без практического выхода.`,
      exampleText: `При текущих параметрах фундамент ${scenario.sizeText} требует ${formatRu(finalVolume, 3)} м³ бетона. Дополнительно можно ориентироваться на ${formatRu((finalVolume * 320) / 50, 1)} мешков цемента по 50 кг, если расчёт нужен для собственной смеси.`
    };
  }

  if (cluster.id === 'slab-beton') {
    const finalVolume = scenario.length * scenario.width * scenario.height * (1 + scenario.reserve / 100);
    return {
      title: `Сколько бетона нужно на ${scenario.object} ${scenario.sizeText} — ${formatRu(finalVolume, 3)} м³`,
      description: `Расчёт бетона для ${scenario.object} ${scenario.sizeText}: площадь ${formatRu(scenario.length * scenario.width, 2)} м², толщина ${formatRu(scenario.height * 100, 0)} см, итог ${formatRu(finalVolume, 3)} м³.`,
      h1: `Сколько бетона нужно на ${scenario.object} ${scenario.sizeText}`,
      intro: `${introLead} В кейсе для ${scenario.object} ${scenario.sizeText} уже задана площадь ${formatRu(scenario.length * scenario.width, 2)} м² и толщина ${formatRu(scenario.height * 100, 0)} см, поэтому объём бетона получается сразу после открытия страницы.`,
      intro2: `Такая страница выглядит как готовый расчёт для реального объекта, а не как статья о бетоне. Итоговый объём ${formatRu(finalVolume, 3)} м³ можно пересчитать прямо в встроенной форме без перехода на другой URL.`,
      body1: `По long-tail запросам о плитах, дорожках и площадках пользователю обычно нужна конкретная кубатура. Здесь она уже рассчитана для сценария ${scenarioDescriptor(cluster, scenario)}, что делает страницу полезной и для поиска, и для практики.`,
      body2: `Формула остаётся прозрачной: площадь участка переводится в объём через толщину слоя. За счёт этого пользователь понимает, откуда берётся результат ${formatRu(finalVolume, 3)} м³, и может легко проверить его сам.`,
      body3: `Если объект состоит из нескольких прямоугольников, расчёт можно повторить по частям. Но для типовых плит и площадок эта страница уже даёт готовую цифру без промежуточных шагов.`,
      exampleText: `Для ${scenario.object} ${scenario.sizeText} площадь составляет ${formatRu(scenario.length * scenario.width, 2)} м². При толщине ${formatRu(scenario.height * 100, 0)} см и запасе ${scenario.reserve}% получается ${formatRu(finalVolume, 3)} м³ бетона.`
    };
  }

  if (cluster.id === 'screed') {
    const area = scenario.length * scenario.width;
    const mass = area * scenario.thickness * scenario.consumption * (1 + scenario.reserve / 100);
    return {
      title: `Сколько нужно смеси на стяжку ${formatRu(scenario.thickness / 10, 0)} см ${scenario.sizeText} — ${formatRu(mass, 1)} кг`,
      description: `Расчёт смеси на стяжку ${formatRu(scenario.thickness / 10, 0)} см для ${scenario.sizeText}: площадь ${formatRu(area, 2)} м², расход ${scenario.consumption} кг/м²/мм, итог ${formatRu(mass, 1)} кг.`,
      h1: `Сколько нужно смеси на стяжку ${formatRu(scenario.thickness / 10, 0)} см на ${scenario.sizeText}`,
      intro: `${introLead} Для стяжки на ${scenario.sizeText} уже рассчитана площадь ${formatRu(area, 2)} м², а результат пересчитан в массу сухой смеси по заданной толщине ${formatRu(scenario.thickness / 10, 0)} см.`,
      intro2: `Это полезнее обычной SEO-страницы, потому что пользователь сразу видит реальный расход ${formatRu(mass, 1)} кг и может перевести его в мешки, а не только читать общие советы о стяжке пола.`,
      body1: `В запросах по стяжке почти всегда фигурируют площадь и толщина слоя. Поэтому для сценария ${scenarioDescriptor(cluster, scenario)} страница сразу показывает оба параметра и итоговую массу смеси.`,
      body2: `Если изменить среднюю толщину хотя бы на 1 см, итоговый расход меняется заметно. Именно поэтому такие long-tail страницы хорошо работают: они дают готовый ответ на конкретный инженерный вопрос.`,
      body3: `Здесь используется тот же принцип, что и в основном калькуляторе стяжки: площадь умножается на толщину в миллиметрах, норму расхода и запас. Пользователь видит расчёт в явном виде и может проверить его вручную.`,
      exampleText: `Для площади ${formatRu(area, 2)} м² и толщины ${formatRu(scenario.thickness / 10, 0)} см получается ${formatRu(mass, 1)} кг смеси. Это около ${formatRu(mass / 25, 0)} мешков по 25 кг или ${formatRu(mass / 40, 0)} мешков по 40 кг.`
    };
  }

  if (cluster.id === 'tile') {
    const area = scenario.length * scenario.width;
    const tileArea = (scenario.tileLength / 1000) * (scenario.tileWidth / 1000);
    const finalTiles = area / tileArea * (1 + scenario.reserve / 100);
    return {
      title: `Расчет плитки для ${scenario.object} ${scenario.sizeText} — ${formatRu(finalTiles, 0)} плиток`,
      description: `Расчёт плитки для ${scenario.object} ${scenario.sizeText}: площадь ${formatRu(area, 2)} м², формат ${scenario.tileLength}×${scenario.tileWidth} мм, итог ${formatRu(finalTiles, 0)} плиток с запасом.`,
      h1: `Расчет плитки для ${scenario.object} ${scenario.sizeText}`,
      intro: `${introLead} Для страницы уже задан формат плитки ${scenario.tileLength}×${scenario.tileWidth} мм, поэтому расчёт зависит не только от площади ${scenario.sizeText}, но и от реального размера облицовочного материала.`,
      intro2: `За счёт этого результат ${formatRu(finalTiles, 0)} плиток выглядит как полноценный практический кейс. Пользователь может проверить другой формат плитки прямо во встроенной форме и увидеть новое число.`,
      body1: `В long-tail запросах о плитке важно показать не просто площадь ванной или кухни, а ещё и размер самой плитки. Без этого страница была бы текстовой копией, а не отдельным расчётным сценарием.`,
      body2: `Для ${scenario.object} ${scenario.sizeText} итог меняется, если выбрать другой формат плитки или другой запас на подрезку. Поэтому страница строится вокруг реальных вычислений, а не вокруг набора одинаковых абзацев.`,
      body3: `После оценки количества плитки пользователь обычно переходит к плиточному клею и затирке. Такая логика помогает расширять кластер отделки без ручного создания десятков статей.`,
      exampleText: `При площади ${formatRu(area, 2)} м² и формате ${scenario.tileLength}×${scenario.tileWidth} мм нужно около ${formatRu(finalTiles, 0)} плиток. Из них примерно ${formatRu(finalTiles - (area / tileArea), 0)} плиток приходятся на запас и подрезку.`
    };
  }

  if (cluster.id === 'insulation') {
    const finalVolume = scenario.area * (scenario.thickness / 1000) * (1 + scenario.reserve / 100);
    return {
      title: `Расчет утеплителя для ${scenario.object} ${scenario.sizeText} ${scenario.thickness} мм — ${formatRu(finalVolume, 3)} м³`,
      description: `Расчёт утеплителя для ${scenario.object} ${scenario.sizeText}: толщина ${scenario.thickness} мм, запас ${scenario.reserve}%, итог ${formatRu(finalVolume, 3)} м³ утеплителя.`,
      h1: `Расчет утеплителя для ${scenario.object} ${scenario.sizeText} толщиной ${scenario.thickness} мм`,
      intro: `${introLead} В этом сценарии уже задана площадь ${scenario.sizeText} и рабочая толщина ${scenario.thickness} мм, поэтому пользователь сразу получает не общий совет по утеплению, а кубатуру материала для своего случая.`,
      intro2: `Итоговый объём ${formatRu(finalVolume, 3)} м³ делает страницу самостоятельным расчётным URL. При изменении толщины утеплителя или площади значения пересчитываются на месте через встроенную форму.`,
      body1: `Long-tail запросы по утеплению почти всегда содержат площадь фасада или стен и толщину слоя. Именно эти параметры сильнее всего влияют на объём материала и поэтому вынесены в основу сценария.`,
      body2: `Для страницы ${scenarioDescriptor(cluster, scenario)} результат не генерируется из шаблонного текста. Он строится по реальным входным значениям и сразу показывает, как меняется кубатура утеплителя при другом слое.`,
      body3: `После такого расчёта пользователь обычно идёт в теплопотери или фасадные работы. Поэтому page работает и как поисковый landing, и как вход в основной кластер утепления.`,
      exampleText: `Для площади ${scenario.sizeText} и толщины ${scenario.thickness} мм нужен объём ${formatRu(finalVolume, 3)} м³ утеплителя. Если оставить ту же площадь, но увеличить слой, итоговая кубатура вырастет пропорционально.`
    };
  }

  const finalBudget = scenario.area * scenario.price * (1 + scenario.reserve / 100);
  return {
    title: `Стоимость ремонта квартиры ${scenario.sizeText} — ${formatRu(finalBudget, 0)} ₽`,
    description: `Расчёт стоимости ремонта квартиры ${scenario.sizeText}: ставка ${formatRu(scenario.price, 0)} ₽/м², резерв ${scenario.reserve}%, итог ${formatRu(finalBudget, 0)} ₽.`,
    h1: `Стоимость ремонта квартиры ${scenario.sizeText}`,
    intro: `${introLead} Для квартиры площадью ${scenario.sizeText} уже задана ставка ${formatRu(scenario.price, 0)} ₽ за м², поэтому пользователь сразу видит ориентировочный бюджет ремонта без промежуточных вычислений.`,
    intro2: `Итоговая смета ${formatRu(finalBudget, 0)} ₽ отличается от других страниц не только числом площади, но и фактическим размером бюджета, резерва и среднего бюджета на квадратный метр.`,
    body1: `В long-tail запросах о ремонте квартиры человек почти всегда хочет понять порядок бюджета для своей площади. Поэтому здесь результат привязан к конкретному размеру квартиры, а не к абстрактной формуле без цифр.`,
    body2: `На странице расчёт уже разложен на площадь, ставку и резерв. Это делает её полезной для сравнения сценариев: можно быстро проверить квартиру 40 м², 50 м² или 60 м² без ручного пересчёта.`,
    body3: `После грубой оценки бюджета пользователь обычно идёт в смежные расчёты по плитке, краске или стяжке. За счёт этого сценарная страница участвует в общей навигации по кластеру ремонта.`,
    exampleText: `При площади ${scenario.sizeText}, ставке ${formatRu(scenario.price, 0)} ₽ за м² и резерве ${scenario.reserve}% ориентировочная смета составляет ${formatRu(finalBudget, 0)} ₽. Это можно использовать как стартовую цифру перед детализацией по материалам и работам.`
  };
}

function listItems(items) {
  return items.map((item) => `<li>${item}</li>`).join('\n');
}

function relatedPages(cluster, slug) {
  return cluster.scenarios
    .filter((item) => item.slug !== slug)
    .slice(0, 4)
    .map((item) => {
      const scenarioMetrics = calculateMetrics(cluster, item);
      return `<li><a href="${item.slug}.html">${meta(cluster, item, scenarioMetrics).h1}</a></li>`;
    })
    .join('\n');
}

function relatedCalculators(cluster) {
  return [{ name: cluster.calculatorName, url: cluster.calculatorUrl }, ...cluster.relatedCalculators]
    .map((item) => `<li><a href="${item.url}">${item.name}</a></li>`)
    .join('\n');
}

function renderPage(cluster, scenario) {
  const metrics = calculateMetrics(cluster, scenario);
  const pageMeta = meta(cluster, scenario, metrics);
  const replacements = {
    '{{TITLE}}': pageMeta.title,
    '{{DESCRIPTION}}': pageMeta.description,
    '{{H1}}': pageMeta.h1,
    '{{INTRO}}': pageMeta.intro,
    '{{INTRO_2}}': pageMeta.intro2,
    '{{RESULT_SUMMARY}}': metrics.summary,
    '{{INPUT_ITEMS}}': listItems(metrics.inputs),
    '{{FORMULA}}': metrics.formula,
    '{{RESULT_ITEMS}}': listItems(metrics.results),
    '{{RESULT_EXPLANATION}}': metrics.explanation,
    '{{FORM}}': buildForm(cluster.formPreset, scenario),
    '{{LIVE_RESULT}}': metrics.liveResult,
    '{{CALCULATOR_URL}}': cluster.calculatorUrl,
    '{{BODY_1}}': pageMeta.body1,
    '{{BODY_2}}': pageMeta.body2,
    '{{BODY_3}}': pageMeta.body3,
    '{{EXAMPLE_TEXT}}': pageMeta.exampleText,
    '{{RELATED_PAGES}}': relatedPages(cluster, scenario.slug),
    '{{RELATED_CALCULATORS}}': relatedCalculators(cluster)
  };

  let html = template;
  Object.entries(replacements).forEach(([key, value]) => {
    html = html.split(key).join(value);
  });
  return html;
}

function renderHub() {
  const sections = data.clusters.map((cluster) => {
    const links = cluster.scenarios.map((scenario) => {
      const scenarioMetrics = calculateMetrics(cluster, scenario);
      return `<li><a href="${scenario.slug}.html">${meta(cluster, scenario, scenarioMetrics).h1}</a></li>`;
    }).join('\n');
    return `<section class="card">
      <h2>${cluster.name}</h2>
      <p>Кластер привязан к странице <a href="${cluster.calculatorUrl}">${cluster.calculatorName}</a> и покрывает long-tail запросы с размерами, толщиной, площадью и типом объекта.</p>
      <ul class="calc-list">
        ${links}
      </ul>
    </section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.hub.title}</title>
  <meta name="description" content="${data.hub.description}">
  <link rel="stylesheet" href="../assets/style.css">
</head>
<body>
  <main class="container">
    <section class="card">
      <h1>${data.hub.title}</h1>
      <p>${data.hub.description}</p>
      <p>Хаб собирает сценарные SEO-страницы под запросы с размерами, толщиной слоя, площадью объекта и типом работ. Каждая страница ведёт в основной калькулятор и показывает заранее посчитанные результаты прямо в HTML.</p>
    </section>
    ${sections}
    <section class="card">
      <p><a href="../index.html">На главную</a></p>
    </section>
  </main>
</body>
</html>`;
}

ensureDir(outputDir);

const urls = [];
data.clusters.forEach((cluster) => {
  cluster.scenarios.forEach((scenario) => {
    const fileName = `${scenario.slug}.html`;
    fs.writeFileSync(path.join(outputDir, fileName), renderPage(cluster, scenario), 'utf8');
    urls.push(`programmatic/${fileName}`);
  });
});

fs.writeFileSync(path.join(outputDir, 'index.html'), renderHub(), 'utf8');
fs.writeFileSync(path.join(root, 'seo', 'programmatic-urls.txt'), urls.join('\n'), 'utf8');

console.log(`Generated ${urls.length} programmatic pages.`);
