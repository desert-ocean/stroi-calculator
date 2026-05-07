const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'programmatic-seo.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'templates', 'programmatic-template.html'), 'utf8');
const { writeSitemaps } = require('./generate-sitemap');
const outputDir = path.join(root, 'programmatic');
const seoDir = path.join(root, 'seo');

const INDEXED_TARGET = Number(process.env.PSEO_INDEXED_TARGET || 1200);
const MAX_PAGES = Number(process.env.PSEO_MAX_PAGES || 1400);
const MIN_INDEX_SCORE = 78;
const MIN_CREATE_SCORE = 62;

const calculators = {
  beton: {
    name: 'Калькулятор бетона',
    url: '../calculators/kalkulyator-betona.html',
    related: [
      { name: 'Калькулятор фундамента', url: '../calculators/kalkulyator-fundamenta.html' },
      { name: 'Калькулятор объёма бетона', url: '../calculators/kalkulyator-obema-betona.html' },
      { name: 'Калькулятор расхода цемента', url: '../calculators/kalkulyator-rashoda-cementa.html' }
    ]
  },
  smesi: {
    name: 'Калькулятор стяжки пола',
    url: '../calculators/kalkulyator-styazhki.html',
    related: [
      { name: 'Калькулятор наливного пола', url: '../calculators/kalkulyator-nalivnogo-pola.html' },
      { name: 'Калькулятор расхода цемента', url: '../calculators/kalkulyator-rashoda-cementa.html' },
      { name: 'Калькулятор пола', url: '../calculators/kalkulyator-pola.html' }
    ]
  },
  plitka: {
    name: 'Калькулятор плитки',
    url: '../calculators/kalkulyator-plitki.html',
    related: [
      { name: 'Калькулятор плиточного клея', url: '../calculators/kalkulyator-rashoda-kleya-plitochnogo.html' },
      { name: 'Калькулятор затирки', url: '../calculators/kalkulyator-zatirki.html' },
      { name: 'Калькулятор площади стен', url: '../calculators/kalkulyator-ploshchadi-sten.html' }
    ]
  },
  uteplitel: {
    name: 'Калькулятор утепления стен',
    url: '../calculators/kalkulyator-utepleniya-sten.html',
    related: [
      { name: 'Калькулятор утеплителя', url: '../calculators/kalkulyator-uteplitelya.html' },
      { name: 'Калькулятор теплопотерь дома', url: '../calculators/kalkulyator-teplopoter.html' },
      { name: 'Калькулятор фасада', url: '../calculators/kalkulyator-rascheta-fasada.html' }
    ]
  },
  bassein: {
    name: 'Калькулятор расчёта бассейна',
    url: '../calculators/kalkulyator-rascheta-basseina.html',
    related: [
      { name: 'Калькулятор бетона', url: '../calculators/kalkulyator-betona.html' },
      { name: 'Калькулятор плитки', url: '../calculators/kalkulyator-plitki.html' },
      { name: 'Калькулятор объёма комнаты', url: '../calculators/kalkulyator-obema-komnaty.html' }
    ]
  }
};

const formFields = {
  beton: [
    ['length', 'Длина, м', '0.1', 'Для ленты это суммарная длина, для плиты или дорожки - длина участка.'],
    ['width', 'Ширина, м', '0.1', 'Ширина ленты, плиты, дорожки или площадки.'],
    ['height', 'Толщина или высота, м', '0.01', 'Для плиты это толщина, для ленты - высота бетонирования.'],
    ['reserve', 'Запас, %', '0.1', 'Резерв на потери, подачу и неточные замеры.']
  ],
  smesi: [
    ['length', 'Длина помещения, м', '0.1', 'Длина зоны, где выполняется стяжка.'],
    ['width', 'Ширина помещения, м', '0.1', 'Ширина той же зоны.'],
    ['thickness', 'Толщина стяжки, мм', '1', 'Средняя толщина слоя после выставления уровня.'],
    ['consumption', 'Расход смеси на 1 мм, кг/м²', '0.01', 'Норма расхода из технической карты смеси.'],
    ['reserve', 'Запас, %', '0.1', 'Запас на перепады основания и потери.']
  ],
  plitka: [
    ['length', 'Длина поверхности, м', '0.1', 'Длина пола, стены или рабочей зоны.'],
    ['width', 'Ширина или высота поверхности, м', '0.1', 'Второй размер облицовываемой поверхности.'],
    ['tileLength', 'Длина плитки, мм', '1', 'Рабочий формат плитки по длине.'],
    ['tileWidth', 'Ширина плитки, мм', '1', 'Рабочий формат плитки по ширине.'],
    ['reserve', 'Запас, %', '0.1', 'Запас на подрезку, бой и раскладку.']
  ],
  uteplitel: [
    ['area', 'Площадь стен, м²', '0.1', 'Чистая площадь утепления без крупных проёмов.'],
    ['thickness', 'Толщина утеплителя, мм', '1', 'Рабочая толщина теплоизоляционного слоя.'],
    ['reserve', 'Запас, %', '0.1', 'Запас на подрезку плит и сложные узлы.']
  ],
  bassein: [
    ['length', 'Длина бассейна, м', '0.1', 'Внутренний размер чаши по длине.'],
    ['width', 'Ширина бассейна, м', '0.1', 'Внутренний размер чаши по ширине.'],
    ['depth', 'Глубина, м', '0.1', 'Средняя рабочая глубина чаши.']
  ]
};

const pageFamilies = [
  {
    family: 'foundation',
    calcType: 'beton',
    titleType: 'фундамент',
    scenarios: ['фундамент дома', 'фундамент гаража', 'фундамент бани', 'ленточный фундамент пристройки', 'ростверк под каркасный дом'],
    sizes: [[6, 6], [6, 8], [7, 8], [8, 8], [8, 10], [9, 9], [10, 10], [10, 12], [12, 12], [12, 14]],
    widths: [0.3, 0.35, 0.4, 0.45, 0.5],
    heights: [0.8, 1, 1.2, 1.4, 1.5],
    reserves: [7, 8, 10],
    demand: 4,
    build(seed) {
      const perimeter = 2 * (seed.size[0] + seed.size[1]);
      const inner = seed.size[0] >= 8 ? seed.size[0] : 0;
      return {
        ...seed,
        length: perimeter + inner,
        width: seed.width,
        height: seed.height,
        reserve: seed.reserve,
        sizeText: `${seed.size[0]}×${seed.size[1]} м`,
        parameterText: `лента ${formatRu(perimeter + inner, 1)} м, ${formatRu(seed.width, 2)}×${formatRu(seed.height, 2)} м`
      };
    }
  },
  {
    family: 'concrete-flat',
    calcType: 'beton',
    titleType: 'бетон',
    scenarios: ['монолитная плита под дом', 'плита под гараж', 'бетонная площадка под авто', 'отмостка вокруг дома', 'садовая дорожка', 'площадка под беседку'],
    sizes: [[3, 4], [4, 4], [4, 6], [5, 6], [6, 6], [6, 8], [8, 8], [8, 10], [10, 12], [12, 1.2], [18, 1.2], [24, 1.2], [30, 1]],
    heights: [0.08, 0.1, 0.12, 0.15, 0.18, 0.2, 0.25],
    reserves: [7, 8, 10, 12],
    demand: 4,
    build(seed) {
      return {
        ...seed,
        length: seed.size[0],
        width: seed.size[1],
        height: seed.height,
        reserve: seed.reserve,
        sizeText: `${formatRu(seed.size[0], 1)}×${formatRu(seed.size[1], 1)} м`,
        parameterText: `площадь ${formatRu(seed.size[0] * seed.size[1], 2)} м², слой ${formatRu(seed.height * 100, 0)} см`
      };
    }
  },
  {
    family: 'screed',
    calcType: 'smesi',
    titleType: 'стяжка',
    scenarios: ['стяжка в квартире', 'стяжка в гараже', 'стяжка в ванной', 'стяжка на кухне', 'стяжка пола в доме', 'полусухая стяжка'],
    sizes: [[3, 3], [3, 4], [4, 4], [4, 5], [5, 5], [5, 6], [6, 7], [7, 8], [8, 10], [10, 10], [12, 10]],
    thicknesses: [30, 40, 50, 60, 70, 80, 90],
    consumptions: [1.65, 1.7, 1.8, 1.9],
    reserves: [7, 8, 9, 10],
    demand: 5,
    build(seed) {
      return {
        ...seed,
        length: seed.size[0],
        width: seed.size[1],
        thickness: seed.thickness,
        consumption: seed.consumption,
        reserve: seed.reserve,
        sizeText: `${formatRu(seed.size[0] * seed.size[1], 0)} м²`,
        parameterText: `площадь ${formatRu(seed.size[0] * seed.size[1], 0)} м², слой ${formatRu(seed.thickness / 10, 0)} см`
      };
    }
  },
  {
    family: 'tile',
    calcType: 'plitka',
    titleType: 'плитка',
    scenarios: ['плитка для ванной', 'плитка на кухонный фартук', 'керамогранит на пол кухни', 'плитка для санузла', 'керамогранит в коридор', 'плитка на стену душевой'],
    sizes: [[2, 2], [2.5, 2], [3, 2], [3, 3], [4, 2], [4, 3], [5, 2], [6, 2], [6, 3], [8, 2.5], [10, 2]],
    formats: [[200, 300], [250, 400], [300, 300], [300, 600], [400, 400], [600, 600], [600, 1200]],
    reserves: [8, 10, 12, 15],
    demand: 5,
    build(seed) {
      return {
        ...seed,
        length: seed.size[0],
        width: seed.size[1],
        tileLength: seed.format[0],
        tileWidth: seed.format[1],
        reserve: seed.reserve,
        sizeText: `${formatRu(seed.size[0] * seed.size[1], 1)} м²`,
        parameterText: `${formatRu(seed.size[0] * seed.size[1], 1)} м², формат ${seed.format[0]}×${seed.format[1]} мм`
      };
    }
  },
  {
    family: 'insulation',
    calcType: 'uteplitel',
    titleType: 'утеплитель',
    scenarios: ['утепление фасада дома', 'утепление стен гаража', 'утепление бани', 'утепление стен коттеджа', 'утепление пристройки', 'утепление мансардной стены'],
    areas: [36, 48, 60, 72, 80, 96, 100, 120, 140, 150, 180, 220],
    thicknesses: [50, 80, 100, 120, 150, 200],
    reserves: [7, 8, 9, 10, 12],
    demand: 4,
    build(seed) {
      return {
        ...seed,
        area: seed.area,
        thickness: seed.thickness,
        reserve: seed.reserve,
        sizeText: `${seed.area} м²`,
        parameterText: `${seed.area} м², слой ${seed.thickness} мм`
      };
    }
  },
  {
    family: 'pool',
    calcType: 'bassein',
    titleType: 'бассейн',
    scenarios: ['бассейн во дворе', 'бассейн для бани', 'семейный бассейн', 'купель', 'детский бассейн', 'техническая чаша'],
    sizes: [[2, 2], [3, 2], [4, 2.5], [5, 3], [6, 3], [7, 3.5], [8, 4], [10, 4]],
    depths: [1.1, 1.2, 1.4, 1.5, 1.6, 1.8],
    demand: 3,
    build(seed) {
      return {
        ...seed,
        length: seed.size[0],
        width: seed.size[1],
        depth: seed.depth,
        sizeText: `${formatRu(seed.size[0], 1)}×${formatRu(seed.size[1], 1)} м`,
        parameterText: `${formatRu(seed.size[0], 1)}×${formatRu(seed.size[1], 1)} м, глубина ${formatRu(seed.depth, 1)} м`
      };
    }
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanGeneratedPages(dir) {
  fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.html'))
    .forEach((fileName) => fs.unlinkSync(path.join(dir, fileName)));
}

function formatRu(value, digits = 2) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(Number(value.toFixed(digits)));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function hashString(value) {
  return [...String(value)].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function pick(seed, variants) {
  return variants[Math.abs(hashString(seed)) % variants.length];
}

function translit(value) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };
  return value.toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/×/g, 'x')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function fieldHtml(page, field) {
  const [id, label, step, help] = field;
  return `<div>
            <label for="${id}">${label}</label>
            <input id="${id}" type="number" step="${step}" value="${escapeHtml(page[id] ?? '')}">
            <p>${help}</p>
          </div>`;
}

function buildForm(page) {
  return `<form id="calc-form" data-type="${page.calcType}">
        <div class="form-grid">
${formFields[page.calcType].map((field) => fieldHtml(page, field)).join('\n')}
        </div>
        <button type="submit">Рассчитать</button>
      </form>`;
}

function concreteMetrics(page) {
  const area = page.family === 'foundation' ? null : page.length * page.width;
  const cleanVolume = page.length * page.width * page.height;
  const reserveVolume = cleanVolume * page.reserve / 100;
  const finalVolume = cleanVolume + reserveVolume;
  const cementKg = finalVolume * (page.family === 'foundation' ? 320 : 300);
  const mixerTrips = finalVolume / 7;
  const inputItems = page.family === 'foundation'
    ? [
      `Суммарная длина ленты: ${formatRu(page.length, 1)} м`,
      `Ширина ленты: ${formatRu(page.width, 2)} м`,
      `Высота бетонирования: ${formatRu(page.height, 2)} м`,
      `Запас: ${page.reserve}%`
    ]
    : [
      `Длина: ${formatRu(page.length, 1)} м`,
      `Ширина: ${formatRu(page.width, 1)} м`,
      `Площадь: ${formatRu(area, 2)} м²`,
      `Толщина слоя: ${formatRu(page.height * 100, 0)} см`
    ];

  return {
    unit: 'м³',
    resultNumber: finalVolume,
    title: `Расчёт бетона: ${page.scenario} ${page.sizeText}, ${formatRu(finalVolume, 3)} м³`,
    description: `${page.scenario}: ${page.parameterText}. Итоговый объём бетона ${formatRu(finalVolume, 3)} м³ с запасом ${page.reserve}%.`,
    h1: `Сколько бетона нужно: ${page.scenario} ${page.sizeText}`,
    liveResult: `Результат: ${formatRu(finalVolume, 3)} м³ бетона.`,
    summary: `Для задачи «${page.scenario} ${page.sizeText}» расчёт даёт ${formatRu(finalVolume, 3)} м³ бетона. Чистый объём по геометрии: ${formatRu(cleanVolume, 3)} м³, резерв: ${formatRu(reserveVolume, 3)} м³.`,
    inputs: inputItems,
    formula: `V = ${formatRu(page.length, 2)} × ${formatRu(page.width, 2)} × ${formatRu(page.height, 2)} × (1 + ${page.reserve} / 100)`,
    results: [
      `Чистый объём: ${formatRu(cleanVolume, 3)} м³`,
      `Запас: ${formatRu(reserveVolume, 3)} м³`,
      `Итого к заказу: ${formatRu(finalVolume, 3)} м³`,
      `Ориентир по цементу: ${formatRu(cementKg, 0)} кг, или ${formatRu(cementKg / 50, 1)} мешка по 50 кг`,
      `При миксере 7 м³: около ${formatRu(mixerTrips, 1)} рейса`
    ],
    explanation: page.family === 'foundation'
      ? `Для ленточного фундамента результат зависит от суммарной длины ленты, а не только от внешнего размера здания. В этом сценарии в расчёт заложено ${formatRu(page.length, 1)} м рабочей длины.`
      : `В таких работах главная связка параметров - площадь и толщина слоя. При той же площади увеличение толщины на 2 см заметно меняет кубатуру заказа.`,
    recommendation: pick(page.slug, [
      `Перед заказом бетона проверьте высоту опалубки и фактическую толщину слоя: именно эти значения чаще всего дают лишний объём.`,
      `Если объект разбит на несколько зон, считайте каждую отдельно и складывайте объёмы до добавления общего резерва.`,
      `Для поставки миксером округляйте итог по правилам поставщика, но сохраняйте исходную цифру расчёта для контроля сметы.`
    ])
  };
}

function screedMetrics(page) {
  const area = page.length * page.width;
  const cleanMass = area * page.thickness * page.consumption;
  const reserveMass = cleanMass * page.reserve / 100;
  const finalMass = cleanMass + reserveMass;

  return {
    unit: 'кг',
    resultNumber: finalMass,
    title: `Расчёт стяжки: ${page.scenario} ${page.sizeText}, ${formatRu(finalMass, 1)} кг`,
    description: `${page.scenario}: ${page.parameterText}. Нужно ${formatRu(finalMass, 1)} кг смеси, включая запас ${page.reserve}%.`,
    h1: `Сколько смеси нужно: ${page.scenario} ${page.parameterText}`,
    liveResult: `Результат: ${formatRu(finalMass, 1)} кг смеси на площадь ${formatRu(area, 2)} м².`,
    summary: `Для сценария «${page.scenario}» потребуется ${formatRu(finalMass, 1)} кг сухой смеси. Расчёт учитывает площадь ${formatRu(area, 2)} м², слой ${formatRu(page.thickness / 10, 0)} см и норму ${page.consumption} кг/м² на 1 мм.`,
    inputs: [
      `Длина: ${formatRu(page.length, 1)} м`,
      `Ширина: ${formatRu(page.width, 1)} м`,
      `Площадь пола: ${formatRu(area, 2)} м²`,
      `Средняя толщина: ${formatRu(page.thickness / 10, 0)} см`
    ],
    formula: `M = ${formatRu(area, 2)} × ${page.thickness} × ${page.consumption} × (1 + ${page.reserve} / 100)`,
    results: [
      `Расход без запаса: ${formatRu(cleanMass, 1)} кг`,
      `Запас: ${formatRu(reserveMass, 1)} кг`,
      `Итого: ${formatRu(finalMass, 1)} кг`,
      `Мешки по 25 кг: ${formatRu(finalMass / 25, 0)} шт.`,
      `Мешки по 40 кг: ${formatRu(finalMass / 40, 0)} шт.`
    ],
    explanation: `Расход стяжки считается через толщину в миллиметрах, потому что производители обычно дают норму на 1 мм слоя. Для этой площади каждый дополнительный сантиметр добавляет около ${formatRu(area * 10 * page.consumption, 1)} кг смеси до запаса.`,
    recommendation: pick(page.slug, [
      `Если основание имеет перепады, берите среднюю толщину по маякам, а не минимальную точку.`,
      `Для гаража и влажных зон лучше оставить запас отдельной строкой: так проще увидеть, сколько добавлено на неровности.`,
      `Перед закупкой сравните итог в мешках с фасовкой конкретной смеси, потому что округление упаковок влияет на бюджет.`
    ])
  };
}

function tileMetrics(page) {
  const area = page.length * page.width;
  const tileArea = page.tileLength / 1000 * page.tileWidth / 1000;
  const cleanTiles = area / tileArea;
  const reserveTiles = cleanTiles * page.reserve / 100;
  const finalTiles = Math.ceil(cleanTiles + reserveTiles);

  return {
    unit: 'шт.',
    resultNumber: finalTiles,
    title: `Расчёт плитки: ${page.scenario} ${page.parameterText}, ${finalTiles} шт.`,
    description: `${page.scenario}: площадь ${formatRu(area, 2)} м², формат ${page.tileLength}×${page.tileWidth} мм. Итог ${finalTiles} плиток с запасом ${page.reserve}%.`,
    h1: `Сколько плитки нужно: ${page.scenario} ${page.sizeText}`,
    liveResult: `Результат: ${finalTiles} плиток на площадь ${formatRu(area, 2)} м².`,
    summary: `Для задачи «${page.scenario}» нужно ${finalTiles} плиток. Без резерва получается ${formatRu(cleanTiles, 1)} шт., запас на подрезку добавляет ${formatRu(reserveTiles, 1)} шт.`,
    inputs: [
      `Длина поверхности: ${formatRu(page.length, 1)} м`,
      `Ширина или высота: ${formatRu(page.width, 1)} м`,
      `Площадь облицовки: ${formatRu(area, 2)} м²`,
      `Формат плитки: ${page.tileLength}×${page.tileWidth} мм`
    ],
    formula: `N = (${formatRu(area, 2)} / ${formatRu(tileArea, 3)}) × (1 + ${page.reserve} / 100)`,
    results: [
      `Площадь одной плитки: ${formatRu(tileArea, 3)} м²`,
      `Количество без запаса: ${formatRu(cleanTiles, 1)} шт.`,
      `Запас: ${formatRu(reserveTiles, 1)} шт.`,
      `Итого с округлением вверх: ${finalTiles} шт.`
    ],
    explanation: `Здесь итог зависит не только от площади, но и от формата плитки. На той же поверхности плитка 600×600 мм и 200×300 мм даст совершенно разное количество штук.`,
    recommendation: pick(page.slug, [
      `Для диагональной раскладки или большого числа углов увеличьте запас в форме и пересчитайте результат.`,
      `Если материал продаётся коробками, разделите итог на количество плиток в упаковке и округлите вверх.`,
      `Для фартука и душевой зоны проверьте высоту рядов: иногда один дополнительный ряд меняет закупку сильнее, чем общий процент запаса.`
    ])
  };
}

function insulationMetrics(page) {
  const cleanVolume = page.area * page.thickness / 1000;
  const reserveVolume = cleanVolume * page.reserve / 100;
  const finalVolume = cleanVolume + reserveVolume;

  return {
    unit: 'м³',
    resultNumber: finalVolume,
    title: `Расчёт утеплителя: ${page.scenario} ${page.parameterText}, ${formatRu(finalVolume, 3)} м³`,
    description: `${page.scenario}: площадь ${formatRu(page.area, 1)} м², толщина ${page.thickness} мм. Нужно ${formatRu(finalVolume, 3)} м³ утеплителя.`,
    h1: `Сколько утеплителя нужно: ${page.scenario} ${page.parameterText}`,
    liveResult: `Результат: ${formatRu(finalVolume, 3)} м³ утеплителя.`,
    summary: `Для сценария «${page.scenario}» потребуется ${formatRu(finalVolume, 3)} м³ утеплителя. Чистый объём: ${formatRu(cleanVolume, 3)} м³, резерв: ${formatRu(reserveVolume, 3)} м³.`,
    inputs: [
      `Площадь утепления: ${formatRu(page.area, 1)} м²`,
      `Толщина слоя: ${page.thickness} мм`,
      `Толщина в метрах: ${formatRu(page.thickness / 1000, 3)} м`,
      `Запас: ${page.reserve}%`
    ],
    formula: `V = ${formatRu(page.area, 1)} × ${formatRu(page.thickness / 1000, 3)} × (1 + ${page.reserve} / 100)`,
    results: [
      `Объём без запаса: ${formatRu(cleanVolume, 3)} м³`,
      `Запас: ${formatRu(reserveVolume, 3)} м³`,
      `Итого: ${formatRu(finalVolume, 3)} м³`,
      `Ориентир при упаковке 0,3 м³: ${formatRu(finalVolume / 0.3, 0)} упаковок`
    ],
    explanation: `Объём утеплителя растёт пропорционально толщине. Если оставить ту же площадь, но заменить 100 мм на 150 мм, кубатура увеличится в полтора раза.`,
    recommendation: pick(page.slug, [
      `Для фасада вычитайте крупные проёмы до расчёта, а запас оставляйте на откосы и углы.`,
      `У разных производителей объём пачки отличается, поэтому основной итог оставлен в кубометрах.`,
      `Если утепление идёт в два слоя, считайте суммарную толщину или каждый слой отдельно при разном материале.`
    ])
  };
}

function poolMetrics(page) {
  const volume = page.length * page.width * page.depth;
  const liters = volume * 1000;

  return {
    unit: 'м³',
    resultNumber: volume,
    title: `Объём бассейна: ${page.scenario} ${page.parameterText}, ${formatRu(volume, 2)} м³`,
    description: `${page.scenario}: ${page.parameterText}. Объём воды ${formatRu(volume, 2)} м³, примерно ${formatRu(liters, 0)} л.`,
    h1: `Расчёт объёма воды: ${page.scenario} ${page.parameterText}`,
    liveResult: `Результат: ${formatRu(volume, 2)} м³ воды, это примерно ${formatRu(liters, 0)} л.`,
    summary: `Для задачи «${page.scenario}» объём чаши составляет ${formatRu(volume, 2)} м³, или примерно ${formatRu(liters, 0)} л воды.`,
    inputs: [
      `Длина чаши: ${formatRu(page.length, 1)} м`,
      `Ширина чаши: ${formatRu(page.width, 1)} м`,
      `Средняя глубина: ${formatRu(page.depth, 1)} м`,
      `Площадь зеркала воды: ${formatRu(page.length * page.width, 2)} м²`
    ],
    formula: `V = ${formatRu(page.length, 1)} × ${formatRu(page.width, 1)} × ${formatRu(page.depth, 1)}`,
    results: [
      `Объём воды: ${formatRu(volume, 2)} м³`,
      `Литры: ${formatRu(liters, 0)} л`,
      `Ориентировочная масса воды: ${formatRu(volume, 2)} т`,
      `При заполнении 2 м³/ч потребуется около ${formatRu(volume / 2, 1)} ч`
    ],
    explanation: `Для бассейна важен не только размер в плане, но и средняя глубина. Она влияет на подбор фильтрации, химию и время заполнения чаши.`,
    recommendation: pick(page.slug, [
      `Если дно имеет уклон, вместо максимальной глубины используйте среднюю рабочую глубину.`,
      `Для чаш сложной формы этот расчёт подходит как предварительный ориентир перед детальной разбивкой на зоны.`,
      `Литраж добавлен отдельно, потому что оборудование и химия часто подбираются именно по литрам.`
    ])
  };
}

const metricByType = {
  beton: concreteMetrics,
  smesi: screedMetrics,
  plitka: tileMetrics,
  uteplitel: insulationMetrics,
  bassein: poolMetrics
};

function variantsForFamily(family) {
  const rows = [];
  family.scenarios.forEach((scenario) => {
    if (family.family === 'foundation') {
      family.sizes.forEach((size) => family.widths.forEach((width) => family.heights.forEach((height) => family.reserves.forEach((reserve) => {
        rows.push(family.build({ scenario, size, width, height, reserve }));
      }))));
    }
    if (family.family === 'concrete-flat') {
      family.sizes.forEach((size) => family.heights.forEach((height) => family.reserves.forEach((reserve) => {
        rows.push(family.build({ scenario, size, height, reserve }));
      })));
    }
    if (family.family === 'screed') {
      family.sizes.forEach((size) => family.thicknesses.forEach((thickness) => family.consumptions.forEach((consumption) => family.reserves.forEach((reserve) => {
        rows.push(family.build({ scenario, size, thickness, consumption, reserve }));
      }))));
    }
    if (family.family === 'tile') {
      family.sizes.forEach((size) => family.formats.forEach((format) => family.reserves.forEach((reserve) => {
        rows.push(family.build({ scenario, size, format, reserve }));
      })));
    }
    if (family.family === 'insulation') {
      family.areas.forEach((area) => family.thicknesses.forEach((thickness) => family.reserves.forEach((reserve) => {
        rows.push(family.build({ scenario, area, thickness, reserve }));
      })));
    }
    if (family.family === 'pool') {
      family.sizes.forEach((size) => family.depths.forEach((depth) => {
        rows.push(family.build({ scenario, size, depth }));
      }));
    }
  });

  return rows.map((page) => ({ ...page, family: family.family, calcType: family.calcType, titleType: family.titleType, demand: family.demand }));
}

function enrichPage(page) {
  const slugSource = `${page.scenario}-${page.parameterText}`;
  const slug = translit(slugSource);
  const metrics = metricByType[page.calcType]({ ...page, slug });
  return {
    ...page,
    slug,
    metrics,
    intentKey: `${page.family}|${page.scenario}`,
    inputKey: `${page.family}|${page.scenario}|${page.parameterText}`,
    resultKey: `${page.family}|${page.scenario}|${Math.round(metrics.resultNumber * 10) / 10}${metrics.unit}`,
    signature: `${page.scenario}|${page.parameterText}|${metrics.formula}|${metrics.results.slice(0, 3).join('|')}`
  };
}

function qualityScore(page, seen) {
  let score = 38;
  score += page.demand * 5;
  score += page.parameterText.length > 12 ? 8 : 0;
  score += page.metrics.results.length >= 4 ? 8 : 0;
  score += page.metrics.explanation.length > 120 ? 8 : 0;
  score += page.metrics.recommendation.length > 80 ? 7 : 0;
  score += page.metrics.resultNumber > 0 ? 8 : -20;
  score += seen.intentCounts.get(page.intentKey) < 80 ? 5 : -8;
  score += seen.resultKeys.has(page.resultKey) ? -18 : 0;
  score += seen.inputKeys.has(page.inputKey) ? -30 : 0;
  return score;
}

function buildCandidates() {
  const candidates = pageFamilies.flatMap(variantsForFamily).map(enrichPage);
  candidates.sort((a, b) => {
    const aHash = Math.abs(hashString(a.signature));
    const bHash = Math.abs(hashString(b.signature));
    return (b.demand - a.demand) || (aHash - bHash);
  });
  return candidates;
}

function selectPages(candidates) {
  const seen = {
    slugs: new Set(),
    inputKeys: new Set(),
    resultKeys: new Set(),
    signatures: new Set(),
    intentCounts: new Map()
  };
  const selected = [];
  let indexed = 0;
  const familyIndexCounts = new Map();
  const familyCreateCounts = new Map();
  const families = [...new Set(candidates.map((candidate) => candidate.family))];
  const familyIndexCap = Math.ceil(INDEXED_TARGET / families.length);
  const familyCreateCap = Math.ceil(MAX_PAGES / families.length) + 20;

  const buckets = families.map((family) => candidates.filter((candidate) => candidate.family === family));
  let cursor = 0;

  while (selected.length < MAX_PAGES && indexed < INDEXED_TARGET && buckets.some((bucket) => bucket.length > 0)) {
    const bucket = buckets[cursor % buckets.length];
    cursor += 1;

    if (!bucket.length) {
      continue;
    }

    const candidate = bucket.shift();
    const familyIndexed = familyIndexCounts.get(candidate.family) || 0;
    const familyCreated = familyCreateCounts.get(candidate.family) || 0;

    if (familyIndexed >= familyIndexCap || familyCreated >= familyCreateCap) {
      continue;
    }

    const currentIntentCount = seen.intentCounts.get(candidate.intentKey) || 0;
    seen.intentCounts.set(candidate.intentKey, currentIntentCount);

    if (seen.slugs.has(candidate.slug) || seen.signatures.has(candidate.signature)) {
      continue;
    }

    const score = qualityScore(candidate, seen);
    if (score < MIN_CREATE_SCORE) {
      continue;
    }

    const shouldIndex = score >= MIN_INDEX_SCORE && indexed < INDEXED_TARGET && familyIndexed < familyIndexCap;
    const page = { ...candidate, qualityScore: score, indexable: shouldIndex };
    selected.push(page);

    seen.slugs.add(page.slug);
    seen.inputKeys.add(page.inputKey);
    seen.signatures.add(page.signature);
    familyCreateCounts.set(page.family, familyCreated + 1);
    if (shouldIndex) {
      indexed += 1;
      seen.resultKeys.add(page.resultKey);
      seen.intentCounts.set(page.intentKey, currentIntentCount + 1);
      familyIndexCounts.set(page.family, familyIndexed + 1);
    }
  }

  let weakCursor = 0;
  while (selected.length < MAX_PAGES && buckets.some((bucket) => bucket.length > 0)) {
    const bucket = buckets[weakCursor % buckets.length];
    weakCursor += 1;
    if (!bucket.length) {
      continue;
    }

    const candidate = bucket.shift();
    if (seen.slugs.has(candidate.slug) || seen.signatures.has(candidate.signature)) {
      continue;
    }

    const score = qualityScore(candidate, seen);
    if (score < MIN_CREATE_SCORE) {
      continue;
    }

    const page = { ...candidate, qualityScore: score, indexable: false };
    selected.push(page);
    seen.slugs.add(page.slug);
    seen.inputKeys.add(page.inputKey);
    seen.signatures.add(page.signature);
  }

  return selected;
}

function listItems(items) {
  return items.map((item) => `<li>${item}</li>`).join('\n');
}

function card(title, body) {
  return `<section class="card">
      <h2>${title}</h2>
      ${body}
    </section>`;
}

function dynamicBlocks(page) {
  const metrics = page.metrics;
  const blocks = {
    task: card('Задача', `<p>${metrics.summary}</p>`),
    calc: card('Расчёт', `<ul class="also-list">${listItems(metrics.inputs)}</ul><p><strong>Формула:</strong> ${metrics.formula}</p>`),
    result: card('Итоговые значения', `<ul class="also-list">${listItems(metrics.results)}</ul>`),
    explain: card('Пояснение результата', `<p>${metrics.explanation}</p>`),
    advice: card('Рекомендация', `<p>${metrics.recommendation}</p>`)
  };
  const orders = [
    ['task', 'calc', 'result', 'explain', 'advice'],
    ['task', 'result', 'calc', 'advice', 'explain'],
    ['calc', 'task', 'result', 'explain', 'advice'],
    ['task', 'explain', 'calc', 'result', 'advice'],
    ['result', 'task', 'calc', 'advice', 'explain']
  ];
  return pick(page.slug, orders).map((key) => blocks[key]).join('\n\n');
}

function relatedPages(page, allPages) {
  return allPages
    .filter((item) => item.indexable && item.family === page.family && item.slug !== page.slug && item.scenario !== page.scenario)
    .slice(0, 3)
    .map((item) => `<li><a href="${item.slug}.html">${item.metrics.h1}</a></li>`)
    .join('\n') || `<li><a href="${calculators[page.calcType].url}">${calculators[page.calcType].name}</a></li>`;
}

function relatedCalculators(page) {
  const calculator = calculators[page.calcType];
  return [{ name: calculator.name, url: calculator.url }, ...calculator.related]
    .map((item) => `<li><a href="${item.url}">${item.name}</a></li>`)
    .join('\n');
}

function replaceAll(html, replacements) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.split(key).join(value),
    html
  );
}

function renderPage(page, allPages) {
  const calculator = calculators[page.calcType];
  const intro = pick(page.slug, [
    `Это не справочная статья, а готовый расчёт под конкретный сценарий: ${page.scenario}, ${page.parameterText}.`,
    `Страница отвечает на прикладной запрос с заданными размерами: ${page.scenario}, ${page.parameterText}.`,
    `Ниже зафиксированы входные данные и результат, чтобы расчёт можно было проверить без ручной подстановки.`
  ]);
  const task = pick(`${page.slug}-task`, [
    `Страница создана только потому, что сочетание объекта, размеров и результата даёт отдельный смысл для пользователя.`,
    `Если изменить размеры в форме, итог пересчитается тем же скриптом, который используется в основном калькуляторе.`,
    `В HTML уже есть формула, исходные параметры и итоговые числа, поэтому робот получает не пустой шаблон, а видимый расчёт.`
  ]);

  return replaceAll(template, {
    '{{TITLE}}': page.metrics.title,
    '{{DESCRIPTION}}': page.metrics.description,
    '{{ROBOTS_META}}': page.indexable ? '' : '<meta name="robots" content="noindex,follow">',
    '{{CANONICAL}}': page.indexable ? '' : `<link rel="canonical" href="${calculator.url}">`,
    '{{H1}}': page.metrics.h1,
    '{{INTRO}}': intro,
    '{{TASK}}': task,
    '{{DYNAMIC_BLOCKS}}': dynamicBlocks(page),
    '{{FORM}}': buildForm(page),
    '{{LIVE_RESULT}}': page.metrics.liveResult,
    '{{CALCULATOR_URL}}': calculator.url,
    '{{RELATED_PAGES}}': relatedPages(page, allPages),
    '{{RELATED_CALCULATORS}}': relatedCalculators(page)
  });
}

function renderHub(pages) {
  const grouped = Object.groupBy(pages.filter((page) => page.indexable), (page) => page.family);
  const sections = Object.entries(grouped).map(([family, items]) => {
    const sampleLinks = items.slice(0, 12).map((page) => `<li><a href="${page.slug}.html">${page.metrics.h1}</a></li>`).join('\n');
    return `<section class="card">
      <h2>${family}</h2>
      <p>В индексе оставлены сценарии с отдельным интентом, реальными параметрами и расчётом. Показаны первые 12 страниц кластера.</p>
      <ul class="calc-list">${sampleLinks}</ul>
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
      <p>Генератор строит кандидаты из востребованных сценариев, отбрасывает дубли по интенту и результату, а в sitemap добавляет только страницы с достаточным качественным скорингом.</p>
    </section>
    ${sections}
    <section class="card">
      <p><a href="../index.html">На главную</a></p>
    </section>
  </main>
</body>
</html>`;
}

function writeQualityReport(pages, candidatesCount) {
  const report = {
    generatedAt: new Date().toISOString(),
    candidates: candidatesCount,
    pages: pages.length,
    indexable: pages.filter((page) => page.indexable).length,
    noindex: pages.filter((page) => !page.indexable).length,
    minIndexScore: MIN_INDEX_SCORE,
    minCreateScore: MIN_CREATE_SCORE,
    examples: pages.filter((page) => page.indexable).slice(0, 30).map((page) => ({
      url: `programmatic/${page.slug}.html`,
      score: page.qualityScore,
      intent: page.intentKey,
      result: `${formatRu(page.metrics.resultNumber, 2)} ${page.metrics.unit}`
    }))
  };
  fs.writeFileSync(path.join(seoDir, 'programmatic-quality-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

ensureDir(outputDir);
ensureDir(seoDir);
cleanGeneratedPages(outputDir);

const candidates = buildCandidates();
const pages = selectPages(candidates);
const indexablePages = pages.filter((page) => page.indexable);

pages.forEach((page) => {
  fs.writeFileSync(path.join(outputDir, `${page.slug}.html`), renderPage(page, pages), 'utf8');
});

fs.writeFileSync(path.join(outputDir, 'index.html'), renderHub(pages), 'utf8');
fs.writeFileSync(path.join(seoDir, 'programmatic-urls.txt'), `${indexablePages.map((page) => `programmatic/${page.slug}.html`).join('\n')}\n`, 'utf8');
writeSitemaps();
writeQualityReport(pages, candidates.length);

console.log(`Candidates: ${candidates.length}`);
console.log(`Generated pages: ${pages.length}`);
console.log(`Indexable pages: ${indexablePages.length}`);
console.log(`Noindex pages: ${pages.length - indexablePages.length}`);
