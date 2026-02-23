# Інтернатура React App

Окремий React + TypeScript + Vite застосунок, який повторює функціональність основного навігатора:

- карта поверху на `canvas` з drag/zoom;
- побудова маршруту між аудиторіями (A* pathfinding);
- вибір аудиторій через autocomplete combobox;
- панель інших будівель з переходом у Google Maps / Apple Maps.
- PWA підтримка (installable + кешування основних ресурсів для офлайн-режиму).

## Запуск

```bash
npm install
npm run dev
```

Відкрийте [http://localhost:5173](http://localhost:5173).

## Команди

- `npm run dev` — dev сервер
- `npm run build` — production build
- `npm run lint` — eslint
- `npm run preview` — preview production build

## Структура

- `src/App.tsx` — UI та поведінка екрана
- `src/components/Combobox.tsx` — autocomplete combobox
- `src/lib/mapData.ts` — дані плану та граф
- `src/lib/pathfinding.ts` — A* алгоритм
- `src/lib/mapCanvas.ts` — рендеринг/взаємодія з `canvas`
- `public/floors/*.svg` — плани поверхів (локальні assets)
- `public/manifest.webmanifest` — PWA маніфест
- `public/sw.js` — service worker для кешування shell/resources
