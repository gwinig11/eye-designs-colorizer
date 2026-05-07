import { useState, useRef, useEffect } from 'react';
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
  }
];

const MAIN_PROMPT_TEMPLATE = `## **Ultra-Strict Floorplan Colorization Prompt (No Internal Detail Allowed)**

Take the provided black-and-white floorplan or 3D render and **apply color only**.

---

### **ABSOLUTE RULES (OVERRIDE EVERYTHING)**

* The output must be a **1:1 visual match** to the original in all geometry and detail
* **No new lines, edges, shapes, boundaries, or subdivisions may be introduced**
* **No existing lines or details may be altered, enhanced, thickened, or stylized**
* **No interpretation, cleanup, or improvement is allowed**
 
**CRITICAL:**

* Each enclosed region must remain a **single uninterrupted area**
* **Do NOT split, segment, outline, frame, border, or decorate any region internally**
* **Do NOT create contrast edges, bands, trims, borders, or framing effects inside any wall or surface**
* **Do NOT add light fixtures, or any element not in the original**
* **Do NOT add any new objects, including plants, furniture, decor, people, equipment, signage, labels, icons, or logos**
* **Do NOT generate fake text, pseudo-text, blurry labels, shadow text, or duplicate labels**
* **Do NOT remove logo box and/or frame if it is present in the original image**
* **Remove all architectural annotations and plan labels that are overlaid on floors, open areas, or drawings (e.g., material notes, room labels, dimension text, and construction notes such as "Vinyl Plank").

* **Preserve only environmental signage that is physically part of the space (e.g., wall-mounted signage, branding, names like "Vision Center").**

If any new visual separation or edge appears that is not in the original, the result is incorrect.

---

### **ALLOWED OPERATIONS (ONLY THESE)**

* Apply **flat or very lightly graded color fills within existing closed regions ONLY**
* Apply **subtle global lighting/shading that does not introduce edges or contrast boundaries**

---

### **TEXT + LINEWORK**

- Remove architectural annotations and plan labels only
- Preserve environmental signage exactly as-is (position, style, clarity)
- Do not modify, restyle, or replace any preserved text
- All linework must remain exactly as-is

---

### **STYLE (SWAP THIS SECTION ONLY)**

{STYLE_TEXT}

---

### **FINAL VALIDATION**

* The result must look like a **single transparent color layer applied over the original**
* **Every region = one continuous fill (no internal variation that creates edges)**
* Removing color should return the exact original with no differences
* Any edge, border, or contrast line not present in the original must be removed.`;

const MAX_GENERATION_ATTEMPTS = 2;

const shouldRetryGeneration = (status) => {
  if (status === 504) return false;
  return status === 408 || status === 429 || (status >= 500 && status < 600);
};

const createGenerationRequestId = (generationId, variationNumber, attempt) => (
  `${generationId}-v${variationNumber}-a${attempt}`
);

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

function App() {
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isRotatingUpload, setIsRotatingUpload] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImages, setResultImages] = useState([]);
  const numVariations = 3;
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showOriginalCompare, setShowOriginalCompare] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [stylePreviewIndex, setStylePreviewIndex] = useState(null);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const fileInputRef = useRef(null);

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

  const nextLightbox = (e) => {
    if (e) e.stopPropagation();
    setShowOriginalCompare(false);
    setLightboxIndex(prev => (prev + 1) % resultImages.length);
  };

  const prevLightbox = (e) => {
    if (e) e.stopPropagation();
    setShowOriginalCompare(false);
    setLightboxIndex(prev => (prev - 1 + resultImages.length) % resultImages.length);
  };

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
  }, [lightboxIndex, resultImages.length, imageFile]);

  const handleDownload = (dataUrl, filename) => {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || 'download.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Delay revocation to prevent browsers from downloading an empty file
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Failed to download image:", err);
      setErrorMsg("Failed to download the image.");
    }
  };

  const handleGenerate = async () => {
    if (!imagePreview || selectedStyleIndex === null) return;

    setIsGenerating(true);
    setErrorMsg("");
    setResultImages([]);

    try {
      const style = STYLES[selectedStyleIndex];
      let finalPrompt = MAIN_PROMPT_TEMPLATE.replace("{STYLE_TEXT}", style.promptText);

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
                requestId
              })
            });

            const responseBody = await response.json().catch(() => null);
            const attemptDurationSec = Math.round((performance.now() - attemptStartedAt) / 1000);

            if (!response.ok) {
              const error = new Error(responseBody?.error || `Generation request failed with status ${response.status}`);
              error.status = response.status;
              error.retryable = shouldRetryGeneration(response.status);
              error.requestId = responseBody?.requestId || requestId;
              error.durationMs = responseBody?.durationMs;
              throw error;
            }

            if (responseBody?.image) {
              console.log(`Variation ${idx + 1}: completed`, {
                requestId: responseBody.requestId || requestId,
                openaiResponseId: responseBody.responseId,
                browserReceivedAt: logTime(),
                serverCompletedAt: responseBody.completedAt,
                attemptDurationSec,
                serverDurationSec: responseBody.durationMs ? Math.round(responseBody.durationMs / 1000) : null,
                elapsedSinceGroupStartSec: Math.round((performance.now() - startedAt) / 1000)
              });
              return `data:image/png;base64,${responseBody.image}`;
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
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else if (attempt < MAX_GENERATION_ATTEMPTS) {
              break;
            }
          }
        }

        throw new Error(`Variation ${idx + 1} failed after ${MAX_GENERATION_ATTEMPTS} attempts. Last error: ${lastError?.message || lastError}`);
      };

      const settledResults = await Promise.allSettled(
        Array.from({ length: numVariations }, (_, idx) => generateVariation(idx))
      );

      const validResults = settledResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const failedResults = settledResults.filter((result) => result.status === "rejected");

      if (validResults.length > 0) {
        console.log(`Successfully retrieved ${validResults.length} image(s) in ${Math.round((performance.now() - startedAt) / 1000)}s.`, logTime());
        setResultImages(validResults);

        if (failedResults.length > 0) {
          setErrorMsg(`${validResults.length} of ${numVariations} images completed. ${failedResults.length} failed after retry.`);
        }
      } else {
        throw new Error("No image was generated by the API.");
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred");
      console.error("Error during generation:", err);
    } finally {
      setIsGenerating(false);
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
            {resultImages.length > 0 ? (
              <div className="section results-area" id="results">
                <h2>Colorized Result{resultImages.length > 1 ? 's' : ''}</h2>
                <p className="results-note">Results may contain differences from original, click compare to check accuracy</p>
                <div className="results-grid">
                  {resultImages.map((img, idx) => (
                    <div key={idx} className="result-card">
                      <div className="result-image-container">
                        <img
                          src={img}
                          alt={`Colorized Output ${idx + 1}`}
                          className="result-img"
                          onClick={() => openLightbox(idx)}
                        />
                      </div>
                      <button
                        type="button"
                        className="compare-btn"
                        onClick={() => openLightbox(idx)}
                      >
                        Compare
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
        {lightboxIndex !== null && (
          <div className="lightbox-overlay" onClick={closeLightbox}>

            {resultImages.length > 1 && (
              <button className="lightbox-nav prev" onClick={prevLightbox} aria-label="Previous result"></button>
            )}

            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={closeLightbox}>✕</button>

              <div className="compare-label">
                {showOriginalCompare ? 'Original' : `Result ${lightboxIndex + 1}`}
              </div>

              <div className="compare-stage">
                <img
                  src={showOriginalCompare ? imagePreview : resultImages[lightboxIndex]}
                  alt={showOriginalCompare ? "Original uploaded floorplan" : `Colorized Output ${lightboxIndex + 1}`}
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
                    handleDownload(resultImages[lightboxIndex], `colorized_floorplan_v${lightboxIndex + 1}.png`);
                  }}
                  className="download-btn"
                >
                  Download
                </a>
              </div>
            </div>

            {resultImages.length > 1 && (
              <button className="lightbox-nav next" onClick={nextLightbox} aria-label="Next result"></button>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default App;
