frontend/src/
├─ store/
│   ├─ editorStore.types.ts   ← contrato de estado + acciones (usalo tal cual cuando migres a zustand)
│   └─ useEditorStore.ts      ← implementación actual con useReducer
├─ utils/
│   └─ elementDefaults.ts     ← valores por defecto al crear texto/barcode/qr
├─ hooks/
│   ├─ usePrinterProfiles.ts  ← fetch de GET /api/printers
│   └─ useTemplate.ts         ← fetch de GET /api/templates/:id (para /editor/:id)
├─ components/
│   └─ editor/
│       ├─ TopBar.tsx          ← nombre plantilla, selector de perfil, botones Guardar/Actualizar/Imprimir/Preview
│       ├─ Toolbar.tsx            ← "Agregar texto / barcode / qr"
│       ├─ Canvas.tsx             ← área mm→px, drag & drop
│       ├─ CanvasElement.tsx      ← render de un elemento + mini-toolbar flotante (rotar/duplicar/eliminar)
│       ├─ PropertiesPanel.tsx    ← arma qué campos mostrar según tipo + positionLocked + locked del elemento
│       ├─ properties/  
│       │   ├─ CommonFields.tsx   ← x, y, rotación
│       │   ├─ TextFields.tsx 
│       │   ├─ BarcodeFields.tsx  
│       │   └─ QrFields.tsx 
│       └─ SaveTemplateModal.tsx  ← nombre, público, positionLocked, checkboxes de locked por elemento, byRequest
└─ pages/
    └─ EditorPage.tsx  ← orquesta todo: lee :id de la ruta, usa useTemplate + usePrinterProfiles, arma useEditorStore
