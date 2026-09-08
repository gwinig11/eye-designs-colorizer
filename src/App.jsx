import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { zipSync } from 'fflate';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import './App.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const STYLES = [
  {
    name: "Contemporary #1",
    description: "Controlled Blue Accent + Grey + Wood",
    promptText: "Modern Optical (Controlled Blue Accent + Grey + Wood)\nUse a neutral base with intentionally placed blue accents and warm wood tones. Blue must be used only as a focal feature, never randomly. Base palette: Walls: soft warm white / light grey (majority of space) Cabinetry / shelving: clean white + light wood tones (oak / light walnut) Floors: warm wood or neutral grey wood tone BLUE USAGE (STRICT PLACEMENT RULE): Blue may be used ONLY on primary focal walls Centered feature walls Main display back walls Key visual anchor areas (e.g., behind reception or central shelving) Do NOT apply blue to: Side walls Secondary or transitional walls Random surfaces or scattered sections Blue must appear: Intentional and symmetrical where possible As a single cohesive focal zone, not multiple competing areas Use muted, desaturated blue (dusty/slate blue) — never bright or dominant Balance rule: ~65% neutral (white/grey) ~25% wood tones ~10% blue (focal use only) Lighting: Bright, clean retail lighting Neutral to slightly warm Even illumination with soft shadows Material behavior: Realistic surfaces with subtle depth No flat color blocks — slight tonal variation only Wood adds warmth to offset cool tones Overall vibe: Modern optical retail with intentional design hierarchy — clean, balanced, and visually guided by a single blue focal area, supported by warm wood and neutral tones.",
    color: "#4a6076",
    previewImage: "/modern-preview.png"
  },
  {
    name: "Contemporary #2",
    description: "White + Marble + Wood Contrast",
    promptText: "Modern Luxury Optical (White + Marble + Wood Contrast)\nUse a bright, minimal base with strong material contrast and subtle premium detailing. CORE MATERIALS Walls: crisp soft white / off-white (clean, gallery-like) Feature surfaces: white marble with soft gray veining (reception, key counters) Wood elements: medium-dark walnut / espresso slats or panels (adds depth + contrast) Floors: light gray large-format tile or polished concrete look EXISTING ELEMENT COLOR ONLY Shelving, counters, hardware, furniture, and fixtures may receive color/material treatment ONLY if they already exist in the original image. Do not add new decor, plants, objects, furniture, fixtures, or display items. ACCENTS (VERY CONTROLLED) Minimal black/charcoal for existing line definition only Occasional soft neutral upholstery only on existing seating No bright colors No heavy textures No clutter LIGHTING Bright, even retail lighting Neutral-white temperature (not warm yellow, not cool blue) Soft shadows only where they already align with original geometry MATERIAL BEHAVIOR Surfaces should feel real and premium Marble = subtle veining, not dramatic Wood = clean grain, not rustic Everything = crisp edges, no softness or blur SPATIAL FEEL Open, airy, uncluttered Clear sightlines across the space Symmetry and alignment where possible OVERALL VIBE Modern luxury optical showroom — clean, architectural, high-end, and minimal with strong material contrast.",
    color: "#7d8c97",
    previewImage: "/modern-light-preview.png"
  },
  {
    name: "Transitional",
    description: "Lightened Floor + Dark Contrast",
    promptText: "Classic Luxury Optical (Lightened Floor + Blue-Gray Walls)\nUse a refined traditional palette, but with slightly brighter flooring and cooler wall tones to create a more open, modern-luxury feel while preserving classic materials. CORE MATERIALS / COLORS Walls: soft blue-gray (cool neutral, slightly desaturated, not warm gray) Millwork / display cabinets: deep dark wood (mahogany / espresso) Floors: light-to-medium warm wood (lift brightness ~20–30% vs typical dark wood, maintain natural tone, no dark heavy stain) Cabinet interiors: soft white or lightly backlit neutral EXISTING ELEMENT COLOR ONLY Cabinetry, display cases, desks, tables, seating, hardware, and fixtures may receive color/material treatment ONLY if they already exist in the original image. Do not add new decor, plants, objects, furniture, fixtures, or display items. ACCENTS No bold colors COLOR BEHAVIOR Walls must read clearly cooler (blue-gray), not beige or taupe Floor must read noticeably lighter than millwork while still wood Maintain contrast: dark wood vs lighter floor vs cool walls LIGHTING Soft warm ambient lighting only where it aligns with existing geometry MATERIAL BEHAVIOR Wood grain visible but do not increase contrast or introduce edge lines Walls must remain perfectly flat with zero banding or edge shading SPATIAL FEEL Open, slightly brighter than traditional luxury Balanced warm (wood) + cool (walls) OVERALL VIBE Classic luxury optical showroom with a lighter, more breathable feel — cooler walls and brighter flooring while preserving rich wood contrast",
    color: "#36454f",
    previewImage: "/classic-luxury-preview.png"
  },
  {
    name: "Soft Neutral",
    description: "Clean + Minimal + Light Wood",
    promptText: "Soft Neutral Optical (Clean + Minimal + Light Wood)\nUse a bright, neutral palette with minimal variation to create a clean, modern optical environment without strong accents. CORE MATERIALS / COLORS Walls: soft warm white or neutral off-white throughout (no feature walls) Millwork / cabinetry: light natural wood (oak / blonde tone, low contrast) Floors: light neutral surface (soft gray, beige, or subtle speckled tone) DISPLAY + FIXTURES Shelving: simple light wood or white, minimal contrast Display tables: light wood or white, clean and uniform Glass: clear and minimal, no tint or color cast ACCENTS No bold or contrasting accent colors Seating and furniture remain within neutral tones (beige, light tan, soft gray) Avoid any strong color contrast between elements COLOR BEHAVIOR Keep all tones closely related and low contrast Avoid focal points or feature walls entirely All surfaces should feel consistent and blended LIGHTING Bright, even lighting with neutral to slightly warm tone No dramatic shadows or directional lighting effects MATERIAL BEHAVIOR Surfaces should feel soft and lightly textured but visually uniform Wood should be light and smooth, not grain-heavy or high contrast SPATIAL FEEL Open, clean, and highly uniform Minimal, calm, and professional Focused on clarity and simplicity over visual expression OVERALL VIBE Clean, minimal optical retail — quiet, neutral, and consistent with no visual distractions",
    color: "#8a7f76",
    previewImage: "/soft-preview.png"
  },
  {
    id: "aspen-quick-ship",
    name: "Aspen Quick Ship",
    description: "White Wood + Driftwood Walls + Black",
    allowFeatureWallTexture: true,
    promptText: `Aspen Quick Ship Optical (White Zebrano Cabinetry + Gray Weathered Wood Walls + Black Hardware)
Use the Aspen showroom references for a bright white wood-grain optical interior with black hardware, a pale neutral floor, and gray weathered-wood main walls. The main retail feature walls must clearly read as horizontal wood, with sage and slate used only as restrained secondary accents. Keep the reduced tan/beige cast: white cabinetry must read clean white, the floor light ash-gray, and secondary walls neutral off-white; do not blend them into one cream, sand, or sepia palette.
FEATURE WALLS — REQUIRED IN THE MAIN RETAIL AREA
Apply a gray weathered horizontal wood-board finish to the main existing retail wall planes, including long perimeter walls facing the showroom, the largest eyewear display run, and the reception/waiting or branding wall. Any existing wall bearing signage such as "Vision Center" must receive this wood finish, with its original signage preserved exactly. Wood should cover most visible main retail wall area, not just the strips behind display units. Do not substitute green or blue paint, colored slats, or colored paneling on these main walls. Apply finishes by wall face: a partition's retail-facing side may be wood while its exam-room-facing side stays neutral off-white.
Use cool driftwood gray, silvery aged wood, soft gray-greige, and lightly whitewashed variation, with just a trace of natural brown. Show believable horizontal boards of varied lengths, fine worn grain, and restrained tonal variation, clearly visible from the overhead view. Keep this wall wood moderately deeper than the white cabinetry and pale floor without becoming dark brown or charcoal. Avoid tan, caramel, honey oak, orange pine, yellow stain, espresso, and glossy varnish.
Use each full existing vertical wall plane, stopping at its actual corners and openings; do not invent inset panels or accent rectangles. Keep the wood visible above, beside, and between existing display units. Display backing panels themselves remain white Zebrano. Keep the horizontal board effect on the wall surface only, not on the display furniture.
GREEN — OPTIONAL, ONE SMALL ACCENT ONLY
Allow soft desaturated sage or eucalyptus green on at most ONE naturally small existing retail accent wall or column face, covering no more than about 5% of the total visible wall area. Never use green on a long wall, outer perimeter, main display wall, reception/branding wall, corridor, or exam-room interior. Do not wrap green around corners, onto adjoining faces, or across several rooms. If the only available wall is large, use wood or neutral off-white and omit the green wall accent; never invent a small green rectangle within a larger wall. Use smooth matte color with gentle tonal depth; no copied wallpaper motifs or added geometric patterns.
BLUE — OPTIONAL, SMALLER THAN THE WOOD AREAS
Allow a little muted slate-blue on one separate, naturally small existing secondary retail surface. Keep blue and green wall accents together below roughly 10% of the total visible wall area, with wood clearly dominant in the showroom. Never use blue on a long wall, principal display wall, or branding/reception wall, and never split a wall to create a blue zone. Omit either accent if the layout lacks a suitable small surface.
On the wood feature walls only, a flat horizontal board finish may have softly worn grain, subtle seams, and tonal variation. Do not add wall thickness, raised battens, shelving, trim, borders, or partitions. Preserve any existing modeled ribs/slats and their spacing rather than adding conflicting divisions. Keep texture proportional to the floorplan scale and follow the wall's perspective.
SECONDARY WALLS
All remaining retail wall faces, exam-room interiors, and corridors: clean neutral off-white or very light neutral gray, with no yellow, beige, mushroom, or brown cast. Exam-room walls and enclosed back rooms must stay neutral even when their outward-facing retail walls use wood. No green or blue room interiors, repeated green walls, or green perimeter. Keep the limited accent colors within the main retail area only.
EXPOSED WALL TOPS — KEEP LIGHT (MANDATORY)
All exposed horizontal tops, caps, and cut faces of the cutaway walls must be white, warm off-white, or very pale warm gray. This includes the entire outer perimeter and every interior partition. These visible wall-thickness strips are wall surfaces, not black hardware or metal frames. Never fill them black, charcoal, dark brown, or dark gray; do not create a heavy dark rim or band around rooms. Keep only the original thin outline, with light surface fill and gentle shading. On wood feature walls, apply the weathered wood finish to the vertical face only and keep the exposed top light.
CORE MATERIALS / COLORS
Existing millwork, display backing panels, laminate shelving, cabinet doors, drawer fronts, reception desks, and dispensing tables: Nevamar Zebrano White laminate, a white base with very subtle pale gray linear wood grain. The finish must read as white textured wood, not beige oak, yellow wood, dark zebra stripes, marble, or glossy painted white. Keep the laminate consistent across these existing surfaces.
Existing cabinet pulls, handles, metal legs, and metal display-case frames: matte or satin black. Apply black only to hardware and metal supports already visible in the original; preserve their exact shape and thickness. Do not extend black onto wall tops, wall caps, or cut faces. Do not add handles, legs, outlines, trim, or framing to suggest hardware.
Floors: pale washed ash-gray wood with a balanced neutral undertone and soft natural grain; avoid yellow oak, golden tan, or a beige wash. Keep the floor lighter and less contrasty than the accent walls. Retain existing floor seams without adding new ones. Do not copy the reference's rugs, herringbone pattern, or new floor zones unless those elements already exist in the source. Existing glass and mirrors: retain their original transparency and reflections; no wood grain or colored fill on glass. Existing upholstered seat surfaces may use muted deep sage/gray-green or subdued teal like the reference; other seating stays light gray or off-white. Do not add upholstery to wire, mesh, or open-frame chairs, or fill their openings.
TEXTURE / GEOMETRY RULES
On WHITE CABINETRY, suggest the Zebrano texture through faint pale-gray grain following the existing surface perspective. Keep it much quieter than the feature-wall wood; no dark stripes, knots, added seams, grooves, or borders on cabinetry. In small or distant laminate regions, use a continuous white / pale gray fill. The feature-wall texture permission does not extend to furniture, glass, the page background, or the title block. Preserve all original architectural outlines and object geometry.
EXISTING ELEMENTS ONLY
Treat only surfaces and hardware already present. Do not introduce furniture, eyewear, displays, signage, plants, decor, rugs, or lighting. No stone, marble, or bright/saturated accent colors.
LIGHTING / OVERALL FEEL
Bright, even neutral-white retail lighting with soft realistic shading; no amber lighting, warm beige filter, or overall blue/green color cast. Preserve the material separation: clean white wood-grain cabinetry against predominantly gray weathered horizontal wood retail walls, a light neutral ash floor, and crisp black hardware. A little muted blue and green is acceptable only on small accent surfaces. Before returning the image, verify that long retail walls, main display walls, and branding/reception walls show wood; green occupies at most one small wall face and never a room or perimeter; exam rooms stay neutral; the room is not predominantly tan; white furniture stays white; and every exposed wall top stays light with no dark bands.`,
    color: "#e7e7e2",
    previewImage: "/aspen-quick-ship-preview.png"
  }
];

const buildColorizationPrompt = (style) => `## **Ultra-Strict Floorplan Colorization Prompt (${style.allowFeatureWallTexture ? 'Preserve Architecture, Allow Specified Wall Finishes' : 'No Internal Detail Allowed'})**

Take the provided black-and-white floorplan or 3D render of an Eye Doctors office and **apply ${style.allowFeatureWallTexture ? 'color and the specified surface finishes only' : 'color only'}**.

**MANDATORY: Keep the surrounding page/background solid white (#FFFFFF) and preserve the entire original Eye Designs logo/title block in the TOP-RIGHT corner, including its border and all text.**

---

### **ABSOLUTE RULES (OVERRIDE EVERYTHING)**

* The output must be a **1:1 visual match** to the original in all geometry and ${style.allowFeatureWallTexture ? 'architectural detail' : 'detail'}
* **${style.allowFeatureWallTexture ? 'No new architectural lines, edges, shapes, boundaries, or subdivisions may be introduced. Surface grain and board seams are permitted only within the existing feature-wall faces specified by the style; they must not change geometry or obscure original linework.' : 'No new lines, edges, shapes, boundaries, or subdivisions may be introduced'}**
* **No existing lines or details may be altered, enhanced, thickened, or stylized**
* **${style.allowFeatureWallTexture ? 'Do not redesign, repair, or reinterpret the architecture; only the specified color and surface-finish changes are allowed' : 'No interpretation, cleanup, or improvement is allowed'}**
 
**CRITICAL:**

* Each enclosed region must remain a **${style.allowFeatureWallTexture ? 'single physical surface with its original extent and boundaries' : 'single uninterrupted area'}**
* **${style.allowFeatureWallTexture ? 'Do NOT split, frame, border, or subdivide any region architecturally. Only the specified feature-wall material may have internal grain, board seams, and tonal variation.' : 'Do NOT split, segment, outline, frame, border, or decorate any region internally'}**
* **${style.allowFeatureWallTexture ? 'Do NOT add trims, borders, framing effects, raised boards, or geometric relief. Feature-wall board seams must read as a flat material finish, never new construction.' : 'Do NOT create contrast edges, bands, trims, borders, or framing effects inside any wall or surface'}**
* **Do NOT add light fixtures, or any element not in the original**
* **Do NOT add any new objects, including plants, furniture, decor, people, equipment, signage, labels, icons, or logos**
* **Do NOT generate fake text, pseudo-text, blurry labels, shadow text, or duplicate labels**
* **Remove architectural annotations and plan labels overlaid on the floorplan itself (e.g., material notes, room labels, dimension text, and construction notes such as "Vinyl Plank"). NEVER remove any part of the logo/title block, including its sheet and drawing numbers.**
* **Wall displays are almost always *Frame Dispalys* do not turn them into plants. This is an eye doctors office.


* **Preserve environmental signage that is physically part of the space (e.g., wall-mounted signage, branding, names like "Vision Center") AND all original logo/title blocks and their text.**

${style.allowFeatureWallTexture ? 'Any new architectural separation or edge is incorrect. Only the specified flat feature-wall finish may introduce grain and board seams within an unchanged wall face.' : 'If any new visual separation or edge appears that is not in the original, the result is incorrect.'}

### **WHITE PAGE BACKGROUND (MANDATORY)**

- All empty page space outside the floorplan and around the title block must be uniform, solid white (#FFFFFF), with a fully opaque output
- Never output transparency, a checkerboard/transparency grid, gray or colored backgrounds, gradients, textures, or shadows in the surrounding page space
- Preserve the full original composition, aspect ratio, and margins; do not crop, zoom, or reframe the image to remove the top-right title block
- Apply the selected colors only to existing architectural surfaces inside the floorplan; the surrounding page and title-block background must stay white

---

### **ALLOWED OPERATIONS (ONLY THESE)**

* Apply **${style.allowFeatureWallTexture ? 'color fills within existing closed regions, plus the specified wood grain, board seams, and tonal variation on existing feature-wall faces ONLY' : 'flat or very lightly graded color fills within existing closed regions ONLY'}**
* Apply **subtle lighting/shading to existing architectural surfaces only, without introducing edges or contrast boundaries or shading the white page/title block**

---

### **TEXT + LINEWORK**

- Remove architectural annotations and plan labels only from the floorplan itself; the logo/title block and all text inside it are exempt
- Preserve environmental signage exactly as-is (position, style, clarity)
- Do not modify, restyle, or replace any preserved text
- All linework must remain exactly as-is

### **LOGO MARK PRESERVATION (MANDATORY)**

- If the original image includes a logo mark, logo box, title block, or framed label, it must remain visible in the output
- Do not crop out, erase, cover, blur, repaint, simplify, move, shrink, enlarge, or replace the logo mark
- Preserve the entire TOP-RIGHT Eye Designs logo/title block in the exact same location, size, shape, border/frame, and contrast, with its white background
- Keep every original logo, letter, number, divider line, sheet number, drawing number, copyright notice, and contact detail inside that block unchanged; do not invent or substitute text or numbers
- The entire title block is protected even though it sits outside the room and contains drawing metadata; it is not an architectural annotation to remove when cleaning plan labels

---

### **STYLE (SWAP THIS SECTION ONLY)**

${style.promptText}

---

### **FINAL VALIDATION**

* The result must look like **${style.allowFeatureWallTexture ? 'color and specified finishes' : 'color'} applied only to the original architectural surfaces on a fully opaque, solid white page**
* **${style.allowFeatureWallTexture ? 'Every region retains its original shape and boundaries. Specified feature-wall grain and board seams may be visible only as surface texture; all other regions keep continuous fills without new edges.' : 'Every region = one continuous fill (no internal variation that creates edges)'}**
* **The surrounding background must be solid white (#FFFFFF), with no transparency, checkerboard pattern, gray fill, texture, or gradient**
* **If the source contains the TOP-RIGHT Eye Designs logo/title block, the output is invalid unless the entire block, border, and all original text remain visible and unchanged in the same position and size**
* Preserve any other original logo mark, logo box, title block, or framed label as well
* Removing ${style.allowFeatureWallTexture ? 'the applied colors and material textures' : 'color'} should return the exact original with no differences
* Any ${style.allowFeatureWallTexture ? 'architectural edge, border, or contrast line outside the permitted feature-wall texture' : 'edge, border, or contrast line'} not present in the original must be removed.`;

const MAX_GENERATION_ATTEMPTS = 2;

const shouldRetryGeneration = (status) => {
  if (status === 504) return false;
  return status === 408 || status === 429 || (status >= 500 && status < 600);
};

const createGenerationRequestId = (generationId, variationNumber, attempt) => (
  `${generationId}-v${variationNumber}-a${attempt}`
);

const createEmptyResultSlots = (count) => Array.from({ length: count }, (_, idx) => ({
  id: idx,
  src: "",
  status: "pending",
  partialImageIndex: null,
  requestId: null,
  error: ""
}));

const dataUrlFromBase64 = (imageBase64) => `data:image/png;base64,${imageBase64}`;

const imageBytesFromDataUrl = (dataUrl) => (
  Uint8Array.from(atob(dataUrl.split(',')[1]), (character) => character.charCodeAt(0))
);

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Give the browser time to start reading the file before releasing it.
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  }
};

const readJsonLineStream = async (response, onEvent) => {
  if (!response.body) {
    throw new Error("Streaming is not supported by this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      onEvent(JSON.parse(trimmed));
    }

    if (done) break;
  }

  const trimmed = buffer.trim();
  if (trimmed) {
    onEvent(JSON.parse(trimmed));
  }
};

const logTime = () => ({
  iso: new Date().toISOString(),
  local: new Date().toLocaleString()
});

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const rotateDataUrl = async (dataUrl, degrees) => {
  const image = await loadImage(dataUrl);
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  const quarterTurn = normalizedDegrees === 90 || normalizedDegrees === 270;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = quarterTurn ? image.naturalHeight : image.naturalWidth;
  canvas.height = quarterTurn ? image.naturalWidth : image.naturalHeight;

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((normalizedDegrees * Math.PI) / 180);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  return canvas.toDataURL('image/png');
};

const imageFileToDataUrl = async (file) => {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn("Browser image orientation normalization failed, using FileReader fallback:", err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const createAirtableUploadQueue = (originalImage, generatedImages) => (
  generatedImages.flatMap((generatedImage, idx) => [
    {
      source: originalImage,
      filename: `original-upload-${idx + 1}.png`
    },
    {
      source: generatedImage,
      filename: `colorized-result-${idx + 1}.png`
    }
  ])
);

const postAirtableLogAction = async (payload) => {
  const response = await fetch('/api/log-airtable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || `Airtable logging failed with status ${response.status}`);
  }

  return body;
};

const logImagesToAirtable = async ({
  originalImage,
  generatedImages,
  style,
  specialInstructions,
  requestStartTime,
  requestCompletionTime
}) => {
  const { recordId } = await postAirtableLogAction({
    action: 'create',
    style,
    specialInstructions,
    requestStartTime,
    requestCompletionTime
  });
  const uploadQueue = createAirtableUploadQueue(originalImage, generatedImages);

  try {
    for (const attachment of uploadQueue) {
      await postAirtableLogAction({
        action: 'upload',
        recordId,
        ...attachment
      });
    }
  } catch (err) {
    await postAirtableLogAction({
      action: 'delete',
      recordId
    }).catch((deleteErr) => {
      console.error("Failed to delete incomplete Airtable record:", deleteErr);
    });

    throw err;
  }

  return recordId;
};

function App() {
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isRotatingUpload, setIsRotatingUpload] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImages, setResultImages] = useState([]);
  const [resultSlots, setResultSlots] = useState([]);
  const numVariations = 4;
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showOriginalCompare, setShowOriginalCompare] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [stylePreviewIndex, setStylePreviewIndex] = useState(null);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const fileInputRef = useRef(null);
  const resultSlotAssignmentsRef = useRef(new Map());
  const nextResultSlotRef = useRef(0);
  const finalImagesBySlotRef = useRef([]);

  const displayResultSlots = useMemo(() => (
    resultSlots.length > 0
      ? resultSlots
      : resultImages.map((src, idx) => ({
      id: idx,
      src,
      status: "completed",
      partialImageIndex: null,
      requestId: null,
      error: ""
    }))
  ), [resultImages, resultSlots]);
  const lightboxSlot = lightboxIndex !== null ? displayResultSlots[lightboxIndex] : null;
  const lightboxResultSrc = lightboxSlot?.src || "";
  const hasMultiplePreviewableResults = useMemo(
    () => displayResultSlots.filter((slot) => slot.src).length > 1,
    [displayResultSlots]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setStylePreviewIndex(null);
        setLightboxIndex(null);
        setShowUploadPreview(false);
      } else if (e.key === 'ArrowRight') {
        if (stylePreviewIndex !== null) {
          setStylePreviewIndex((prev) => {
            let next = (prev + 1) % STYLES.length;
            while (!STYLES[next].previewImage && next !== prev) next = (next + 1) % STYLES.length;
            return next;
          });
        }
      } else if (e.key === 'ArrowLeft') {
        if (stylePreviewIndex !== null) {
          setStylePreviewIndex((prev) => {
            let next = (prev - 1 + STYLES.length) % STYLES.length;
            while (!STYLES[next].previewImage && next !== prev) next = (next - 1 + STYLES.length) % STYLES.length;
            return next;
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stylePreviewIndex]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRotateUpload = async (e, degrees) => {
    if (e) e.stopPropagation();
    if (!imagePreview || isRotatingUpload) return;

    setIsRotatingUpload(true);
    setErrorMsg("");
    try {
      const rotatedImage = await rotateDataUrl(imagePreview, degrees);
      setImagePreview(rotatedImage);
    } catch (err) {
      console.error("Failed to rotate upload:", err);
      setErrorMsg("Failed to rotate the uploaded floorplan.");
    } finally {
      setIsRotatingUpload(false);
    }
  };

  const handleFile = async (file) => {
    setErrorMsg("");

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function () {
          try {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const page = await pdf.getPage(1);

            // Use a high scale for better quality
            const scale = 3.0;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };

            await page.render(renderContext).promise;
            const imageUrl = canvas.toDataURL('image/png');
            setImagePreview(imageUrl);
            setImageFile(file);
          } catch (innerErr) {
            setErrorMsg("Failed to process PDF content.");
            console.error(innerErr);
          }
        };
        fileReader.readAsArrayBuffer(file);
      } catch (err) {
        setErrorMsg("Failed to read PDF.");
        console.error(err);
      }
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg("Please upload an image or PDF file.");
      return;
    }
    setImageFile(file);
    if (file) {
      try {
        const imageUrl = await imageFileToDataUrl(file);
        setImagePreview(imageUrl);
      } catch (err) {
        setErrorMsg("Failed to read image.");
        console.error(err);
      }
    }
  };

  const openLightbox = (index) => {
    setShowOriginalCompare(false);
    setLightboxIndex(index);
  };
  const closeLightbox = () => {
    setShowOriginalCompare(false);
    setLightboxIndex(null);
  };

  const nextLightbox = useCallback((e) => {
    if (e) e.stopPropagation();
    setShowOriginalCompare(false);
    const navigableSlots = displayResultSlots.filter((slot) => slot.src);
    if (navigableSlots.length < 2) return;
    setLightboxIndex(prev => {
      const currentPosition = navigableSlots.findIndex((slot) => slot.id === displayResultSlots[prev]?.id);
      const nextPosition = currentPosition === -1 ? 0 : (currentPosition + 1) % navigableSlots.length;
      return displayResultSlots.findIndex((slot) => slot.id === navigableSlots[nextPosition].id);
    });
  }, [displayResultSlots]);

  const prevLightbox = useCallback((e) => {
    if (e) e.stopPropagation();
    setShowOriginalCompare(false);
    const navigableSlots = displayResultSlots.filter((slot) => slot.src);
    if (navigableSlots.length < 2) return;
    setLightboxIndex(prev => {
      const currentPosition = navigableSlots.findIndex((slot) => slot.id === displayResultSlots[prev]?.id);
      const nextPosition = currentPosition === -1
        ? 0
        : (currentPosition - 1 + navigableSlots.length) % navigableSlots.length;
      return displayResultSlots.findIndex((slot) => slot.id === navigableSlots[nextPosition].id);
    });
  }, [displayResultSlots]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === ' ') {
        e.preventDefault();
        setShowOriginalCompare((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        nextLightbox();
      } else if (e.key === 'ArrowLeft') {
        prevLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, imageFile, nextLightbox, prevLightbox]);

  const handleDownload = (dataUrl, filename) => {
    try {
      const mime = dataUrl.split(',')[0].match(/:(.*?);/)[1];
      const blob = new Blob([imageBytesFromDataUrl(dataUrl)], { type: mime });
      downloadBlob(blob, filename || 'download.png');
    } catch (err) {
      console.error("Failed to download image:", err);
      setErrorMsg("Failed to download the image.");
    }
  };

  const handleDownloadAll = () => {
    if (isGenerating || resultImages.length === 0) return;

    try {
      const files = Object.fromEntries(resultImages.map((src, idx) => [
        `colorized_floorplan_v${idx + 1}.png`,
        imageBytesFromDataUrl(src)
      ]));
      // PNGs are already compressed; store their original bytes unchanged.
      const archive = zipSync(files, { level: 0 });
      downloadBlob(new Blob([archive], { type: 'application/zip' }), 'colorized_floorplans.zip');
    } catch (err) {
      console.error("Failed to download all images:", err);
      setErrorMsg("Failed to download all images. Please try again or download them individually.");
    }
  };

  const updateResultSlot = (idx, updates) => {
    setResultSlots((currentSlots) => currentSlots.map((slot, slotIdx) => (
      slotIdx === idx ? { ...slot, ...updates } : slot
    )));
  };

  const getAssignedResultSlot = (variationIdx) => resultSlotAssignmentsRef.current.get(variationIdx);

  const assignNextResultSlot = (variationIdx) => {
    const assignedSlot = getAssignedResultSlot(variationIdx);

    if (assignedSlot !== undefined) {
      return assignedSlot;
    }

    const nextSlot = Math.min(nextResultSlotRef.current, numVariations - 1);
    resultSlotAssignmentsRef.current.set(variationIdx, nextSlot);
    nextResultSlotRef.current += 1;
    return nextSlot;
  };

  const handleGenerate = async () => {
    if (!imagePreview || selectedStyleIndex === null) return;

    const requestStartTime = new Date().toISOString();

    setIsGenerating(true);
    setErrorMsg("");
    setResultImages([]);
    resultSlotAssignmentsRef.current = new Map();
    nextResultSlotRef.current = 0;
    finalImagesBySlotRef.current = [];
    setResultSlots(createEmptyResultSlots(numVariations));

    try {
      const style = STYLES[selectedStyleIndex];
      let finalPrompt = buildColorizationPrompt(style);

      if (specialInstructions.trim() !== "") {
        finalPrompt += "\n\n### **SPECIAL INSTRUCTIONS**\n" + specialInstructions.trim();
      }

      console.log("==================== GENERATION STARTED ====================");
      console.log(`Style selected: ${style.name}`);
      console.log(`Generating ${numVariations} variation(s)`);
      console.log("Prompt being sent to OpenAI:");
      console.log(finalPrompt);
      console.log("============================================================");

      console.log("Calling OpenAI Responses API in parallel...");
      const startedAt = performance.now();
      const generationId = `gen-${Date.now().toString(36)}`;
      console.log(`Generation request group: ${generationId}`, logTime());

      const generateVariation = async (idx) => {
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
          const requestId = createGenerationRequestId(generationId, idx + 1, attempt);
          const attemptStartedAt = performance.now();

          try {
            const assignedSlot = getAssignedResultSlot(idx);

            if (assignedSlot !== undefined) {
              updateResultSlot(assignedSlot, {
                status: attempt === 1 ? "pending" : "retrying",
                requestId,
                error: ""
              });
            }

            console.log(`Variation ${idx + 1}: starting attempt ${attempt}`, {
              requestId,
              ...logTime(),
              elapsedSinceGroupStartSec: Math.round((attemptStartedAt - startedAt) / 1000)
            });
            const response = await fetch('/api/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                prompt: finalPrompt,
                image: imagePreview,
                styleId: style.id,
                requestId,
                stream: true
              })
            });

            if (!response.ok) {
              const responseBody = await response.json().catch(() => null);
              const error = new Error(responseBody?.error || `Generation request failed with status ${response.status}`);
              error.status = response.status;
              error.retryable = shouldRetryGeneration(response.status);
              error.requestId = responseBody?.requestId || requestId;
              error.durationMs = responseBody?.durationMs;
              throw error;
            }

            let completedEvent = null;

            await readJsonLineStream(response, (event) => {
              if (event.type === "started") {
                const slotIdx = getAssignedResultSlot(idx);

                if (slotIdx !== undefined) {
                  updateResultSlot(slotIdx, {
                    status: "generating",
                    requestId: event.requestId || requestId
                  });
                }
              } else if (event.type === "partial") {
                const slotIdx = assignNextResultSlot(idx);

                updateResultSlot(slotIdx, {
                  status: "partial",
                  src: dataUrlFromBase64(event.image),
                  partialImageIndex: event.partialImageIndex,
                  requestId: event.requestId || requestId
                });
              } else if (event.type === "completed") {
                completedEvent = event;
                const slotIdx = assignNextResultSlot(idx);
                const completedImage = dataUrlFromBase64(event.image);
                finalImagesBySlotRef.current[slotIdx] = completedImage;

                updateResultSlot(slotIdx, {
                  status: "completed",
                  src: completedImage,
                  partialImageIndex: null,
                  requestId: event.requestId || requestId
                });
              } else if (event.type === "error") {
                const error = new Error(event.error || "Generation stream failed.");
                error.status = event.status;
                error.retryable = shouldRetryGeneration(event.status || 500);
                error.requestId = event.requestId || requestId;
                error.durationMs = event.durationMs;
                throw error;
              }
            });

            if (completedEvent?.image) {
              const attemptDurationSec = Math.round((performance.now() - attemptStartedAt) / 1000);
              console.log(`Variation ${idx + 1}: completed`, {
                requestId: completedEvent.requestId || requestId,
                openaiResponseId: completedEvent.responseId,
                browserReceivedAt: logTime(),
                serverCompletedAt: completedEvent.completedAt,
                attemptDurationSec,
                serverDurationSec: completedEvent.durationMs ? Math.round(completedEvent.durationMs / 1000) : null,
                elapsedSinceGroupStartSec: Math.round((performance.now() - startedAt) / 1000)
              });
              return dataUrlFromBase64(completedEvent.image);
            }

            throw new Error("No image data returned from API.");
          } catch (err) {
            lastError = err;
            console.warn(`Variation ${idx + 1} attempt ${attempt} failed`, {
              requestId: err.requestId || requestId,
              status: err.status,
              retryable: err.retryable !== false,
              failedAt: logTime(),
              clientDurationSec: Math.round((performance.now() - attemptStartedAt) / 1000),
              serverDurationSec: err.durationMs ? Math.round(err.durationMs / 1000) : null,
              message: err.message
            });

            if (attempt < MAX_GENERATION_ATTEMPTS && err.retryable !== false) {
              const slotIdx = getAssignedResultSlot(idx);

              if (slotIdx !== undefined) {
                updateResultSlot(slotIdx, {
                  status: "retrying",
                  error: "Retrying..."
                });
              }

              await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (attempt < MAX_GENERATION_ATTEMPTS) {
              break;
            }
          }
        }

        updateResultSlot(assignNextResultSlot(idx), {
          status: "failed",
          error: lastError?.message || "Generation failed."
        });
        throw new Error(`Variation ${idx + 1} failed after ${MAX_GENERATION_ATTEMPTS} attempts. Last error: ${lastError?.message || lastError}`);
      };

      const settledResults = await Promise.allSettled(
        Array.from({ length: numVariations }, (_, idx) => generateVariation(idx))
      );
      const requestCompletionTime = new Date().toISOString();

      const validResults = settledResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failedResults = settledResults.filter((result) => result.status === "rejected");

      if (validResults.length > 0) {
        console.log(`Successfully retrieved ${validResults.length} image(s) in ${Math.round((performance.now() - startedAt) / 1000)}s.`, logTime());
        const completedImages = finalImagesBySlotRef.current.filter(Boolean);
        setResultImages(completedImages);

        if (failedResults.length > 0) {
          setErrorMsg(`${validResults.length} of ${numVariations} images completed. ${failedResults.length} failed after retry.`);
        } else if (completedImages.length === numVariations) {
          logImagesToAirtable({
            originalImage: imagePreview,
            generatedImages: completedImages,
            style: style.name,
            specialInstructions: specialInstructions.trim(),
            requestStartTime,
            requestCompletionTime
          })
            .then((airtableRecordId) => {
              console.log("Airtable image request logged", {
                recordId: airtableRecordId,
                galleryItems: completedImages.length * 2,
                loggedAt: logTime()
              });
            })
            .catch((airtableErr) => {
              console.error("Failed to log images to Airtable:", airtableErr);
            });
        }
      } else {
        const firstFailure = failedResults[0]?.reason?.message;
        throw new Error(firstFailure ? `All ${numVariations} image generations failed. ${firstFailure}` : "No image was generated by the API.");
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred");
      console.error("Error during generation:", err);
    } finally {
      setIsGenerating(false);
      setResultSlots([]);
      console.log("==================== GENERATION FINISHED ===================");
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="main-layout">
          <div className="left-column section">
            <div className="header" style={{ marginBottom: '5px' }}>
              <h1>Eye Designs Colorizer</h1>
              <p>Transform floorplans with intelligent colorization</p>
            </div>
            {/* Style Selection */}
            <div className="style-section">
              <h2>1. Select Style</h2>
              <div className="styles-grid">
                {STYLES.map((style, idx) => (
                  <div
                    key={idx}
                    className={`style-card ${selectedStyleIndex === idx ? 'selected' : ''}`}
                    onClick={() => setSelectedStyleIndex(idx)}
                    style={{ position: 'relative' }}
                  >
                    <div className="style-color-block" style={{ backgroundColor: style.color }}></div>
                    <div className="style-info">
                      <h3>{style.name}</h3>
                      <p>{style.description}</p>
                      {style.id === 'aspen-quick-ship' && (
                        <p>Includes 2 style reference images</p>
                      )}
                      {style.previewImage && (
                        <button
                          type="button"
                          className="style-example-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.blur();
                            setStylePreviewIndex(idx);
                          }}
                        >
                          View Example
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="setup-stack">
              {/* Special Instructions */}
              <div className="instructions-section">
                <h2>2. Special Instructions</h2>
                <textarea
                  className="instructions-input"
                  placeholder="Special Instructions (Optional)"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  style={{ resize: 'vertical', minHeight: '95px' }}
                />
              </div>

              {/* Upload Area */}
              <div className="upload-section" style={{ pointerEvents: isGenerating ? 'none' : 'auto' }}>
                <h2>3. Upload Floorplan</h2>
                <div
                  className={`upload-area ${imagePreview ? 'has-preview' : ''} ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={isGenerating ? undefined : handleDrag}
                  onDragLeave={isGenerating ? undefined : handleDrag}
                  onDragOver={isGenerating ? undefined : handleDrag}
                  onDrop={isGenerating ? undefined : handleDrop}
                  onClick={() => {
                    if (isGenerating) return;
                    if (imagePreview) {
                      setShowUploadPreview(true);
                    } else {
                      fileInputRef.current.click();
                    }
                  }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={handleChange}
                    disabled={isGenerating}
                  />
                  {imagePreview ? (
                    <div style={{ position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="preview-image"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUploadPreview(true);
                        }}
                      />
                      <div className="upload-tools" aria-label="Floorplan preview controls">
                        <button
                          type="button"
                          className="upload-tool-btn"
                          aria-label="Replace floorplan"
                          title="Replace floorplan"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current.click();
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="upload-tool-btn"
                          aria-label="Preview floorplan larger"
                          title="Preview larger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUploadPreview(true);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M15 3h6v6"></path>
                            <path d="M21 3l-7 7"></path>
                            <path d="M9 21H3v-6"></path>
                            <path d="M3 21l7-7"></path>
                          </svg>
                        </button>
                      </div>
                      {isRotatingUpload && (
                        <div className="upload-rotation-status">Rotating...</div>
                      )}
                    </div>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#888' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <p style={{ margin: 0, color: '#aaa', textAlign: 'center', fontSize: '0.9rem' }}>
                        Drag & drop your image or PDF here<br />
                        or click to browse
                      </p>
                    </>
                  )}
                </div>
                {imagePreview && (
                  <div className="upload-review-actions" aria-label="Floorplan review controls">
                    <button
                      type="button"
                      className="upload-review-btn"
                      onClick={(e) => handleRotateUpload(e, -90)}
                      disabled={isRotatingUpload}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                      </svg>
                      Rotate Left
                    </button>
                    <button
                      type="button"
                      className="upload-review-btn"
                      onClick={(e) => handleRotateUpload(e, 90)}
                      disabled={isRotatingUpload}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                        <path d="M21 3v5h-5"></path>
                      </svg>
                      Rotate Right
                    </button>
                  </div>
                )}
                {errorMsg && <p style={{ color: '#ff6b6b', marginTop: '10px' }}>{errorMsg}</p>}
              </div>
            </div>
            {/* Generate Button */}
            <button
              className="btn-generate"
              onClick={handleGenerate}
              disabled={!imagePreview || isGenerating || isRotatingUpload || selectedStyleIndex === null}
            >
              {isGenerating ? (
                <>
                  <div className="spinner"></div>
                  Colorizing...
                </>
              ) : (
                'Colorize'
              )}
            </button>
          </div>

          <div className="right-column">
            {/* Results Area */}
            {displayResultSlots.length > 0 ? (
              <div className="section results-area" id="results">
                <h2>Colorized Result{displayResultSlots.length > 1 ? 's' : ''}</h2>
                <p className="results-note">
                  {isGenerating ? 'Partial previews will sharpen as each result finishes' : 'Results may contain differences from original, click compare to check accuracy'}
                </p>
                <button
                  type="button"
                  className="download-all-btn"
                  onClick={handleDownloadAll}
                  disabled={isGenerating || resultImages.length === 0}
                  title="Download all PNG images in a ZIP"
                >
                  Download All
                </button>
                <div className="results-grid">
                  {displayResultSlots.map((slot, idx) => (
                    <div key={slot.id} className={`result-card result-card-${slot.status}`}>
                      <div className="result-image-container">
                        {slot.src ? (
                          <img
                            src={slot.src}
                            alt={slot.status === "completed" ? `Colorized Output ${idx + 1}` : `Partial preview ${idx + 1}`}
                            className={`result-img ${slot.status !== "completed" ? "is-partial" : ""}`}
                            onClick={() => {
                              if (slot.src) {
                                openLightbox(idx);
                              }
                            }}
                          />
                        ) : (
                          <div className="result-loading-placeholder">
                            <div className="spinner"></div>
                          </div>
                        )}
                        {slot.status !== "completed" && slot.status !== "pending" && slot.status !== "generating" && (
                          <div className="result-status-badge">
                            {slot.status === "failed"
                              ? "Failed"
                              : slot.status === "partial"
                                ? `Preview ${(slot.partialImageIndex ?? 0) + 1}`
                                : "Retrying"}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="compare-btn"
                        disabled={slot.status !== "completed" || resultSlots.length > 0}
                        onClick={() => openLightbox(idx)}
                      >
                        {slot.status === "completed" && resultSlots.length === 0 ? "Compare" : "Waiting"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="section placeholder-area">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '15px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p style={{ margin: 0 }}>Rendered images will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Floorplan Preview */}
        {showUploadPreview && imagePreview && (
          <div className="lightbox-overlay" onClick={() => setShowUploadPreview(false)}>
            <div className="lightbox-content upload-preview-lightbox" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setShowUploadPreview(false)}>✕</button>
              <div className="upload-preview-stage">
                <img src={imagePreview} alt="Uploaded floorplan preview" className="upload-preview-large" />
              </div>
              <div className="upload-preview-actions">
                <button
                  type="button"
                  className="upload-preview-action-btn"
                  onClick={(e) => handleRotateUpload(e, -90)}
                  disabled={isRotatingUpload}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  Rotate Left
                </button>
                <button
                  type="button"
                  className="upload-preview-action-btn"
                  onClick={(e) => handleRotateUpload(e, 90)}
                  disabled={isRotatingUpload}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                  </svg>
                  Rotate Right
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Style Preview Lightbox */}
        {stylePreviewIndex !== null && (
          <div className="lightbox-overlay" onClick={() => setStylePreviewIndex(null)}>
            <button className="lightbox-nav style-preview-nav prev" onClick={(e) => {
              e.stopPropagation();
              setStylePreviewIndex((prev) => {
                let next = (prev - 1 + STYLES.length) % STYLES.length;
                while (!STYLES[next].previewImage && next !== prev) next = (next - 1 + STYLES.length) % STYLES.length;
                return next;
              });
            }}>❮</button>

            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setStylePreviewIndex(null)}>✕</button>
              <img src={STYLES[stylePreviewIndex].previewImage} alt="Style Preview" className="lightbox-img" />
              <div className="lightbox-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', color: '#fff', fontSize: '1.2rem', padding: '15px 0 0 0', fontWeight: 'bold' }}>
                <div>{STYLES[stylePreviewIndex].name}</div>
                <button
                  className="btn-generate"
                  style={{
                    fontSize: '0.8rem',
                    padding: '6px 16px',
                    whiteSpace: 'nowrap',
                    width: 'auto',
                    ...(selectedStyleIndex === stylePreviewIndex ? {
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      pointerEvents: 'none'
                    } : {})
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedStyleIndex !== stylePreviewIndex) {
                      setSelectedStyleIndex(stylePreviewIndex);
                      setStylePreviewIndex(null);
                    }
                  }}
                >
                  {selectedStyleIndex === stylePreviewIndex ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>

            <button className="lightbox-nav style-preview-nav next" onClick={(e) => {
              e.stopPropagation();
              setStylePreviewIndex((prev) => {
                let next = (prev + 1) % STYLES.length;
                while (!STYLES[next].previewImage && next !== prev) next = (next + 1) % STYLES.length;
                return next;
              });
            }}>❯</button>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxIndex !== null && (showOriginalCompare ? imagePreview : lightboxResultSrc) && (
          <div className="lightbox-overlay" onClick={closeLightbox}>

            {hasMultiplePreviewableResults && (
              <button className="lightbox-nav prev" onClick={prevLightbox} aria-label="Previous result"></button>
            )}

            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={closeLightbox}>✕</button>

              <div className="compare-label">
                {showOriginalCompare ? 'Original' : `${lightboxSlot?.status === "completed" ? "Result" : "Preview"} ${lightboxIndex + 1}`}
              </div>

              <div className="compare-stage">
                <img
                  src={showOriginalCompare ? imagePreview : lightboxResultSrc}
                  alt={showOriginalCompare ? "Original uploaded floorplan" : `${lightboxSlot?.status === "completed" ? "Colorized output" : "Partial preview"} ${lightboxIndex + 1}`}
                  className="lightbox-img"
                />
              </div>

              <div className="lightbox-footer">
                <div className="compare-controls">
                  <button
                    type="button"
                    className={`compare-toggle ${!showOriginalCompare ? 'active' : ''}`}
                    onClick={() => setShowOriginalCompare(false)}
                  >
                    Result
                  </button>
                  <button
                    type="button"
                    className={`compare-toggle ${showOriginalCompare ? 'active' : ''}`}
                    onClick={() => setShowOriginalCompare(true)}
                  >
                    Original
                  </button>
                </div>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (lightboxResultSrc) {
                      handleDownload(lightboxResultSrc, `colorized_floorplan_v${lightboxIndex + 1}.png`);
                    }
                  }}
                  className="download-btn"
                >
                  Download
                </a>
              </div>
            </div>

            {hasMultiplePreviewableResults && (
              <button className="lightbox-nav next" onClick={nextLightbox} aria-label="Next result"></button>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default App;
