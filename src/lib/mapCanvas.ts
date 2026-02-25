import type { PathNode } from "./pathfinding";

type StructureRect = [number, number, number, number];
type StructureJunction = Pick<PathNode, "x" | "y">;
type MapStructureData = {
  walls: StructureRect[];
  corridors: StructureRect[];
  junctions: StructureJunction[];
};

export type MapCanvasApi = {
  draw: () => void;
  resize: () => void;
  setRoomPoints: (points: MapMarker[]) => void;
  setStructureData: (data: MapStructureData) => void;
  setPath: (path: PathNode[]) => void;
  setFromRoom: (id: string | null) => void;
  setToRoom: (id: string | null) => void;
  setActiveFloor: (floor: number) => void;
  setFloorImage: (src: string) => void;
  resetView: () => void;
  focusOnNode: (id: string, minZoom?: number) => void;
  getFromRoom: () => string | null;
  getToRoom: () => string | null;
  destroy: () => void;
};

export type MapMarker = Pick<PathNode, "id" | "x" | "y" | "floor"> & {
  iconSrc?: string;
  iconSize?: number;
  label?: string;
};

type Options = {
  getNodeById: (id: string) => PathNode | undefined;
  roomPoints?: MapMarker[];
  structureData?: MapStructureData;
  initialFloorImageSrc?: string;
  onFloorHintClick?: (floor: number) => void;
};

type FloorHintTarget = {
  left: number;
  top: number;
  width: number;
  height: number;
  targetFloor: number;
};

export function createMapCanvas(canvas: HTMLCanvasElement, options: Options): MapCanvasApi {
  const LOGICAL_FLOOR_WIDTH = 800;
  const LOGICAL_FLOOR_HEIGHT = 600;
  const DEFAULT_FLOOR_IMG_SRC = "/floors/1.svg";
  const INITIAL_VIEWPORT_PADDING_RATIO = 0.1;
  const TOUCH_PAN_MULTIPLIER = 1.35;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const PATH_STROKE_PX = isCoarsePointer ? 18 : 8;
  const PIN_RADIUS_PX = isCoarsePointer ? 24 : 14;
  const PIN_STROKE_PX = isCoarsePointer ? 5 : 3;
  const PIN_LABEL_FONT_PX = isCoarsePointer ? 20 : 20;
  const PIN_LABEL_OFFSET_PX = isCoarsePointer ? 22 : 15;
  const POINT_LABEL_MIN_ZOOM = isCoarsePointer ? 0.75: 0.75;
  const POINT_LABEL_FONT_PX = isCoarsePointer ? 16 : 12;
  const POINT_LABEL_PADDING_X_PX = isCoarsePointer ? 12 : 10;
  const POINT_LABEL_PADDING_Y_PX = isCoarsePointer ? 8 : 6;
  const POINT_LABEL_GAP_PX = isCoarsePointer ? 12 : 8;
  const FLOOR_BADGE_LOGO_SRC = "/logo_trans.svg";
  const FLOOR_BADGE_DEFAULT_RATIO = 0.62;

  const rawContext = canvas.getContext("2d");
  if (!rawContext) throw new Error("Cannot get 2D context");
  const context: CanvasRenderingContext2D = rawContext;

  const {
    getNodeById,
    roomPoints: initialRoomPoints = [],
    structureData: initialStructureData,
    initialFloorImageSrc,
    onFloorHintClick,
  } = options;

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let mapWidth = LOGICAL_FLOOR_WIDTH;
  let mapHeight = LOGICAL_FLOOR_HEIGHT;
  let floorDrawWidth = LOGICAL_FLOOR_WIDTH;
  let floorDrawHeight = LOGICAL_FLOOR_HEIGHT;
  let maxFloorImageWidth = LOGICAL_FLOOR_WIDTH;
  let maxFloorImageHeight = LOGICAL_FLOOR_HEIGHT;
  let coordScaleX = 1;
  let coordScaleY = 1;
  let currentPath: PathNode[] = [];
  let roomPoints = initialRoomPoints;
  let structureData: MapStructureData = initialStructureData ?? { walls: [], corridors: [], junctions: [] };
  let fromRoomId: string | null = null;
  let toRoomId: string | null = null;
  let activeFloor = 1;
  let floorHintTargets: FloorHintTarget[] = [];
  let isDragging = false;
  let lastPointer = { x: 0, y: 0 };
  const activePointers = new Map<number, { x: number; y: number; pointerType: string }>();
  let pinchState: {
    startDistance: number;
    startScale: number;
    focusLocalX: number;
    focusLocalY: number;
  } | null = null;
  let hasInitializedViewport = false;
  let floorImageLoaded = false;
  let currentFloorImageSrc = initialFloorImageSrc ?? DEFAULT_FLOOR_IMG_SRC;
  let pendingViewportReset = false;
  let pendingFocus: { id: string; minZoom: number } | null = null;
  const rootStyles = getComputedStyle(document.documentElement);
  const accentColor = rootStyles.getPropertyValue("--accent").trim() || "#a6dfe6";
  const mapWallColor = rootStyles.getPropertyValue("--map-wall").trim() || "#4f6072";
  const mapCorridorColor = rootStyles.getPropertyValue("--map-corridor").trim() || "#2f4154";
  const mapJunctionColor = rootStyles.getPropertyValue("--map-junction").trim() || accentColor;
  const pointImageCache = new Map<
    string,
    {
      image: HTMLImageElement;
      loaded: boolean;
      failed: boolean;
    }
  >();

  const floorImage = new Image();
  const floorBadgeLogo = new Image();
  let floorBadgeLogoLoaded = false;
  let floorBadgeLogoFailed = false;

  function ensurePointImage(src: string) {
    const cached = pointImageCache.get(src);
    if (cached) return cached;

    const image = new Image();
    const next = { image, loaded: false, failed: false };
    image.onload = () => {
      next.loaded = true;
      draw();
    };
    image.onerror = () => {
      next.failed = true;
      draw();
    };
    image.src = src;
    pointImageCache.set(src, next);
    return next;
  }

  function resizeCanvasToContainer() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(canvas.clientWidth * devicePixelRatio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * devicePixelRatio));

    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
  }

  function toCanvasPoint(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function getTouchPointers() {
    return Array.from(activePointers.values()).filter((pointer) => pointer.pointerType === "touch");
  }

  function startPinchGesture() {
    const touches = getTouchPointers();
    if (touches.length < 2) return;

    const first = touches[0];
    const second = touches[1];
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    if (distance <= 0) return;

    const midX = (first.x + second.x) / 2;
    const midY = (first.y + second.y) / 2;
    const transform = getTransform();

    pinchState = {
      startDistance: distance,
      startScale: scale,
      focusLocalX: (midX - transform.tx) / transform.scale,
      focusLocalY: (midY - transform.ty) / transform.scale,
    };
  }

  function getTransform() {
    const cw = canvas.width;
    const ch = canvas.height;
    const baseScale = Math.min(cw / mapWidth, ch / mapHeight);
    const scaled = baseScale * scale;
    const tx = offsetX;
    const ty = offsetY;

    return { scale: scaled, tx, ty };
  }

  function applyTransform() {
    const transform = getTransform();
    context.translate(transform.tx, transform.ty);
    context.scale(transform.scale, transform.scale);
  }

  function clear() {
    context.fillStyle = "#0f1216";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function mapX(x: number) {
    return x * coordScaleX;
  }

  function mapY(y: number) {
    return y * coordScaleY;
  }

  function mapW(w: number) {
    return w * coordScaleX;
  }

  function mapH(h: number) {
    return h * coordScaleY;
  }

  function getFloorFromNode(node: PathNode): number | null {
    if (typeof node.floor === "number") return node.floor;

    const numericPart = node.id.match(/(\d{3,4})/)?.[0];
    if (!numericPart) return null;

    const numericValue = Number(numericPart);
    if (!Number.isFinite(numericValue) || numericValue < 100) return null;

    return Math.floor(numericValue / 100);
  }

  function toMapPoint(canvasPoint: { x: number; y: number }) {
    const transform = getTransform();
    return {
      x: (canvasPoint.x - transform.tx) / transform.scale,
      y: (canvasPoint.y - transform.ty) / transform.scale,
    };
  }

  function isNodeOnActiveFloor(node: PathNode | undefined): boolean {
    if (!node) return false;
    if (typeof node.floor !== "number") return true;
    return node.floor === activeFloor;
  }

  function drawFloorTransitionHints() {
    floorHintTargets = [];
    if (currentPath.length < 2) return;

    const seen = new Set<string>();
    const transformScale = Math.max(0.001, getTransform().scale);
    const fontSize = 32 / transformScale;
    const lineGap = 6 / transformScale;
    const paddingX = 24 / transformScale;
    const paddingY = 14 / transformScale;
    const offsetY = 74 / transformScale;
    const borderWidth = 4 / transformScale;
    const radius = 18 / transformScale;
    const destinationNode = toRoomId ? getNodeById(toRoomId) : undefined;
    const destinationFloor = destinationNode ? getFloorFromNode(destinationNode) : null;

    for (let i = 1; i < currentPath.length; i += 1) {
      const fromNode = currentPath[i - 1];
      const toNode = currentPath[i];
      const fromFloor = getFloorFromNode(fromNode);
      const toFloor = getFloorFromNode(toNode);

      if (fromFloor === null || toFloor === null || fromFloor === toFloor) continue;
      if (fromFloor !== activeFloor) continue;

      const hintKey = `${Math.round(fromNode.x)}:${Math.round(fromNode.y)}:${toFloor}`;
      if (seen.has(hintKey)) continue;
      seen.add(hintKey);

      const targetFloor = destinationFloor ?? toFloor;
      const lines = ["СХОДИ", `НА ${targetFloor} ПОВЕРХ`];
      const x = mapX(fromNode.x);
      const y = mapY(fromNode.y) - offsetY;

      context.font = `900 ${fontSize}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "top";
      const textWidth = Math.max(...lines.map((line) => context.measureText(line).width));
      const textHeight = lines.length * fontSize + (lines.length - 1) * lineGap;
      const width = textWidth + paddingX * 2;
      const height = textHeight + paddingY * 2;
      const left = x - width / 2;
      const top = y - height / 2;
      floorHintTargets.push({ left, top, width, height, targetFloor });

      context.fillStyle = "rgba(8, 11, 14, 0.96)";
      context.strokeStyle = accentColor;
      context.lineWidth = borderWidth;

      context.beginPath();
      context.moveTo(left + radius, top);
      context.lineTo(left + width - radius, top);
      context.quadraticCurveTo(left + width, top, left + width, top + radius);
      context.lineTo(left + width, top + height - radius);
      context.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
      context.lineTo(left + radius, top + height);
      context.quadraticCurveTo(left, top + height, left, top + height - radius);
      context.lineTo(left, top + radius);
      context.quadraticCurveTo(left, top, left + radius, top);
      context.closePath();
      context.fill();
      context.stroke();

      context.fillStyle = "#ffffff";
      context.strokeStyle = "rgba(8, 11, 14, 0.95)";
      context.lineWidth = 6 / transformScale;
      lines.forEach((line, index) => {
        const lineY = top + paddingY + index * (fontSize + lineGap);
        context.strokeText(line, x, lineY);
        context.fillText(line, x, lineY);
      });
    }
  }

  function getHintTargetFloorAt(canvasPoint: { x: number; y: number }): number | null {
    const local = toMapPoint(canvasPoint);
    const match = floorHintTargets.find(
      (target) =>
        local.x >= target.left &&
        local.x <= target.left + target.width &&
        local.y >= target.top &&
        local.y <= target.top + target.height
    );
    return match?.targetFloor ?? null;
  }

  function drawPath() {
    if (currentPath.length < 2) return;

    const transformScale = Math.max(0.001, getTransform().scale);
    context.strokeStyle = "#3fb98a";
    context.lineWidth = PATH_STROKE_PX / transformScale;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(63, 185, 138, 0.4)";
    context.shadowBlur = (PATH_STROKE_PX + 6) / transformScale;

    context.beginPath();
    let segmentStarted = false;
    let hasVisibleSegment = false;

    for (const node of currentPath) {
      if (!isNodeOnActiveFloor(node)) {
        segmentStarted = false;
        continue;
      }

      const x = mapX(node.x);
      const y = mapY(node.y);
      if (!segmentStarted) {
        context.moveTo(x, y);
        segmentStarted = true;
        continue;
      }

      context.lineTo(x, y);
      hasVisibleSegment = true;
    }

    if (hasVisibleSegment) context.stroke();
    context.shadowBlur = 0;
  }

  function drawRoomPoints() {
    if (roomPoints.length === 0) return;

    const transformScale = Math.max(0.001, getTransform().scale);
    const radius = 8 / transformScale;
    const strokeWidth = 2 / transformScale;
    const labelBorderWidth = 1.5 / transformScale;
    const showLabels = scale >= POINT_LABEL_MIN_ZOOM;
    const labelFontSize = POINT_LABEL_FONT_PX / transformScale;
    const labelPaddingX = POINT_LABEL_PADDING_X_PX / transformScale;
    const labelPaddingY = POINT_LABEL_PADDING_Y_PX / transformScale;
    const labelGap = POINT_LABEL_GAP_PX / transformScale;
    const labelsToDraw: Array<{ text: string; x: number; y: number }> = [];
    context.fillStyle = "rgba(166, 223, 230, 0.95)";
    context.strokeStyle = "rgba(8, 11, 14, 0.92)";
    context.lineWidth = strokeWidth;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    for (const point of roomPoints) {
      const pointFloor = getFloorFromNode(point);
      if (pointFloor === null || pointFloor !== activeFloor) continue;

      const x = mapX(point.x);
      const y = mapY(point.y);
      const iconSize = Math.max(16, point.iconSize ?? 68);
      const markerRadius = point.iconSrc ? iconSize / 2 : radius;
      const label = point.label?.trim();
      if (showLabels && label) {
        labelsToDraw.push({ text: label, x, y: y + markerRadius + labelGap });
      }

      if (point.iconSrc) {
        const cached = ensurePointImage(point.iconSrc);
        if (cached.loaded && !cached.failed) {
          const left = x - iconSize / 2;
          const top = y - iconSize / 2;
          context.drawImage(cached.image, left, top, iconSize, iconSize);
          continue;
        }
      }

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }

    if (!showLabels || labelsToDraw.length === 0) return;

    context.font = `700 ${labelFontSize}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const label of labelsToDraw) {
      const textWidth = context.measureText(label.text).width;
      const labelWidth = textWidth + labelPaddingX * 2;
      const labelHeight = labelFontSize + labelPaddingY * 2;
      const left = label.x - labelWidth / 2;
      const top = label.y;

      context.fillStyle = "rgba(8, 11, 14, 0.88)";
      context.strokeStyle = "rgba(166, 223, 230, 0.8)";
      context.lineWidth = labelBorderWidth;
      context.fillRect(left, top, labelWidth, labelHeight);
      context.strokeRect(left, top, labelWidth, labelHeight);

      context.fillStyle = "#ffffff";
      context.fillText(label.text, label.x, top + labelHeight / 2);
    }
  }

  function drawStructureOverlay() {
    const transformScale = Math.max(0.001, getTransform().scale);
    const wallStrokeWidth = 1.5 / transformScale;
    const junctionRadius = 6.5 / transformScale;
    const junctionStrokeWidth = 2 / transformScale;

    context.save();
    context.fillStyle = mapCorridorColor;
    context.globalAlpha = 0.58;
    for (const [x, y, width, height] of structureData.corridors) {
      context.fillRect(mapX(x), mapY(y), mapW(width), mapH(height));
    }
    context.restore();

    context.save();
    context.fillStyle = mapWallColor;
    context.strokeStyle = "rgba(8, 11, 14, 0.75)";
    context.lineWidth = wallStrokeWidth;
    context.globalAlpha = 0.72;
    for (const [x, y, width, height] of structureData.walls) {
      const left = mapX(x);
      const top = mapY(y);
      const mapWidth = mapW(width);
      const mapHeight = mapH(height);
      context.fillRect(left, top, mapWidth, mapHeight);
      context.strokeRect(left, top, mapWidth, mapHeight);
    }
    context.restore();

    context.save();
    context.fillStyle = mapJunctionColor;
    context.strokeStyle = "rgba(8, 11, 14, 0.9)";
    context.lineWidth = junctionStrokeWidth;
    context.globalAlpha = 0.95;
    for (const junction of structureData.junctions) {
      const x = mapX(junction.x);
      const y = mapY(junction.y);
      context.beginPath();
      context.arc(x, y, junctionRadius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
    context.restore();
  }

  function drawPins() {
    const transformScale = Math.max(0.001, getTransform().scale);
    const pinRadius = PIN_RADIUS_PX / transformScale;
    const pinStrokeWidth = PIN_STROKE_PX / transformScale;
    const labelFontSize = PIN_LABEL_FONT_PX / transformScale;
    const labelOffset = (PIN_RADIUS_PX + PIN_LABEL_OFFSET_PX) / transformScale;

    if (fromRoomId) {
      const from = getNodeById(fromRoomId);
      if (from && isNodeOnActiveFloor(from)) {
        const x = mapX(from.x);
        const y = mapY(from.y);
        context.fillStyle = "#d4a024";
        context.strokeStyle = "rgba(255,255,255,0.9)";
        context.lineWidth = pinStrokeWidth;
        context.beginPath();
        context.arc(x, y, pinRadius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = "#fff";
        context.font = `${labelFontSize}px sans-serif`;
        context.textAlign = "center";
        context.fillText("З", x, y + labelOffset);
      }
    }

    if (toRoomId) {
      const to = getNodeById(toRoomId);
      if (to && isNodeOnActiveFloor(to)) {
        const x = mapX(to.x);
        const y = mapY(to.y);
        context.fillStyle = "#c75a77";
        context.strokeStyle = "rgba(255,255,255,0.9)";
        context.lineWidth = pinStrokeWidth;
        context.beginPath();
        context.arc(x, y, pinRadius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = "#fff";
        context.font = `${labelFontSize}px sans-serif`;
        context.textAlign = "center";
        context.fillText("До", x, y + labelOffset);
      }
    }
  }

  function drawFloorBadge() {
    const logoWidth = mapWidth * 0.1;
    const logoRatio =
      floorBadgeLogoLoaded && floorBadgeLogo.naturalWidth > 0
        ? floorBadgeLogo.naturalWidth / floorBadgeLogo.naturalHeight
        : FLOOR_BADGE_DEFAULT_RATIO;
    const logoHeight = logoWidth / Math.max(0.001, logoRatio);
    const outsideOffsetX = mapWidth * 0.028;
    const outsideOffsetY = mapHeight * 0.1;
    const logoX = mapWidth + outsideOffsetX;
    const logoY = -outsideOffsetY;
    const numberGap = logoWidth * 0.04;
    const fontSize = logoWidth * 0.68;
    const floorLabel = String(activeFloor);
    const strokeWidth = logoWidth * 0.07;
    const shadowBlur = logoWidth * 0.26;

    context.save();
    context.fillStyle = "#ffffff";
    context.strokeStyle = "rgba(8, 11, 14, 0.92)";
    context.lineWidth = strokeWidth;
    context.font = `800 ${fontSize}px "DM Sans", "Segoe UI", sans-serif`;
    context.textAlign = "right";
    context.textBaseline = "middle";

    const textX = logoX - numberGap;
    const textY = logoY + logoHeight / 2;
    context.strokeText(floorLabel, textX, textY);
    context.fillText(floorLabel, textX, textY);

    if (floorBadgeLogoLoaded && !floorBadgeLogoFailed) {
      context.shadowColor = "rgba(8, 11, 14, 0.44)";
      context.shadowBlur = shadowBlur;
      context.drawImage(floorBadgeLogo, logoX, logoY, logoWidth, logoHeight);
      context.shadowBlur = 0;
    }
    context.restore();
  }

  function draw() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    clear();
    context.save();
    applyTransform();

    if (floorImageLoaded) {
      context.drawImage(floorImage, 0, 0, floorDrawWidth, floorDrawHeight);
    }

    drawStructureOverlay();
    drawRoomPoints();
    drawPath();
    drawFloorTransitionHints();
    drawPins();
    drawFloorBadge();
    context.restore();
  }

  function onPointerDown(e: PointerEvent) {
    const point = toCanvasPoint(e);
    const hintFloor = getHintTargetFloorAt(point);
    if (hintFloor !== null && hintFloor !== activeFloor) {
      if (onFloorHintClick) {
        onFloorHintClick(hintFloor);
      } else {
        activeFloor = hintFloor;
        draw();
      }
      return;
    }

    activePointers.set(e.pointerId, { ...point, pointerType: e.pointerType });
    canvas.setPointerCapture(e.pointerId);

    if (e.pointerType === "touch" && getTouchPointers().length >= 2) {
      isDragging = false;
      startPinchGesture();
      return;
    }

    isDragging = true;
    lastPointer = point;
  }

  function onPointerMove(e: PointerEvent) {
    const point = toCanvasPoint(e);
    const activePointer = activePointers.get(e.pointerId);
    if (activePointer) {
      activePointers.set(e.pointerId, { ...point, pointerType: activePointer.pointerType });
    }

    const touches = getTouchPointers();
    if (touches.length >= 2) {
      if (!pinchState) {
        startPinchGesture();
      }
      if (!pinchState) return;

      const first = touches[0];
      const second = touches[1];
      const midX = (first.x + second.x) / 2;
      const midY = (first.y + second.y) / 2;
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      if (distance <= 0) return;

      const pinchRatio = distance / pinchState.startDistance;
      const newScale = Math.max(0.3, Math.min(3, pinchState.startScale * pinchRatio));
      const baseScale = Math.min(canvas.width / mapWidth, canvas.height / mapHeight);
      const newScaled = baseScale * newScale;

      offsetX = midX - pinchState.focusLocalX * newScaled;
      offsetY = midY - pinchState.focusLocalY * newScaled;
      scale = newScale;
      draw();
      return;
    }

    pinchState = null;
    if (!isDragging) return;

    const panMultiplier = e.pointerType === "touch" ? TOUCH_PAN_MULTIPLIER : 1;
    offsetX += (point.x - lastPointer.x) * panMultiplier;
    offsetY += (point.y - lastPointer.y) * panMultiplier;
    lastPointer = point;
    draw();
  }

  function onPointerUp(e: PointerEvent) {
    activePointers.delete(e.pointerId);
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    const touches = getTouchPointers();
    if (touches.length >= 2) {
      startPinchGesture();
      return;
    }

    pinchState = null;
    if (touches.length === 1) {
      isDragging = true;
      lastPointer = { x: touches[0].x, y: touches[0].y };
      return;
    }

    isDragging = false;
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const transform = getTransform();
    const lx = (mx - transform.tx) / transform.scale;
    const ly = (my - transform.ty) / transform.scale;

    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, scale * factor));
    const baseScale = Math.min(canvas.width / mapWidth, canvas.height / mapHeight);
    const newScaled = baseScale * newScale;

    offsetX = mx - lx * newScaled;
    offsetY = my - ly * newScaled;
    scale = newScale;
    draw();
  }

  function onWindowResize() {
    resizeCanvasToContainer();
    draw();
  }

  function centerMapInViewport() {
    const safePaddingRatio = Math.max(0, Math.min(0.45, INITIAL_VIEWPORT_PADDING_RATIO));
    const paddingX = canvas.width * safePaddingRatio;
    const paddingY = canvas.height * safePaddingRatio;
    const availableWidth = Math.max(1, canvas.width - paddingX * 2);
    const availableHeight = Math.max(1, canvas.height - paddingY * 2);

    const baseScale = Math.min(canvas.width / mapWidth, canvas.height / mapHeight);
    const paddedBaseScale = Math.min(availableWidth / mapWidth, availableHeight / mapHeight);
    scale = Math.max(0.3, Math.min(3, paddedBaseScale / baseScale));

    const scaledWidth = mapWidth * baseScale * scale;
    const scaledHeight = mapHeight * baseScale * scale;
    offsetX = (canvas.width - scaledWidth) / 2;
    offsetY = (canvas.height - scaledHeight) / 2;
  }

  function resetView() {
    if (!floorImageLoaded) {
      pendingViewportReset = true;
      return;
    }

    centerMapInViewport();
    draw();
  }

  function focusOnNode(id: string, minZoom = 1.3) {
    const node = getNodeById(id);
    if (!node) return;

    const nextMinZoom = Math.max(0.3, Math.min(3, minZoom));
    if (!floorImageLoaded) {
      pendingFocus = { id, minZoom: nextMinZoom };
      return;
    }

    const targetX = mapX(node.x);
    const targetY = mapY(node.y);
    const baseScale = Math.min(canvas.width / mapWidth, canvas.height / mapHeight);
    const nextScale = Math.max(scale, nextMinZoom);
    const scaled = baseScale * nextScale;

    scale = nextScale;
    offsetX = canvas.width / 2 - targetX * scaled;
    offsetY = canvas.height / 2 - targetY * scaled;
    draw();
  }

  function loadFloorImage(src: string) {
    if (!src) return;
    if (src === currentFloorImageSrc && floorImageLoaded) return;
    currentFloorImageSrc = src;
    floorImageLoaded = false;
    floorImage.src = src;
    draw();
  }

  floorImage.onload = () => {
    floorDrawWidth = floorImage.naturalWidth || LOGICAL_FLOOR_WIDTH;
    floorDrawHeight = floorImage.naturalHeight || LOGICAL_FLOOR_HEIGHT;
    maxFloorImageWidth = Math.max(maxFloorImageWidth, floorDrawWidth);
    maxFloorImageHeight = Math.max(maxFloorImageHeight, floorDrawHeight);
    mapWidth = maxFloorImageWidth;
    mapHeight = maxFloorImageHeight;
    coordScaleX = floorDrawWidth / LOGICAL_FLOOR_WIDTH;
    coordScaleY = floorDrawHeight / LOGICAL_FLOOR_HEIGHT;
    if (!hasInitializedViewport) {
      centerMapInViewport();
      hasInitializedViewport = true;
    }
    floorImageLoaded = true;
    if (pendingViewportReset) {
      pendingViewportReset = false;
      centerMapInViewport();
    }
    if (pendingFocus) {
      const request = pendingFocus;
      pendingFocus = null;
      focusOnNode(request.id, request.minZoom);
      return;
    }
    draw();
  };

  floorImage.onerror = () => {
    floorImageLoaded = false;
    draw();
  };

  floorBadgeLogo.onload = () => {
    floorBadgeLogoLoaded = true;
    draw();
  };

  floorBadgeLogo.onerror = () => {
    floorBadgeLogoFailed = true;
    draw();
  };

  loadFloorImage(currentFloorImageSrc);
  floorBadgeLogo.src = FLOOR_BADGE_LOGO_SRC;

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", onWindowResize);

  resizeCanvasToContainer();
  draw();

  return {
    draw,
    resize() {
      resizeCanvasToContainer();
      draw();
    },
    setRoomPoints(points) {
      roomPoints = points;
      draw();
    },
    setStructureData(data: MapStructureData) {
      structureData = data;
      draw();
    },
    setPath(path: PathNode[]) {
      currentPath = path;
      draw();
    },
    setFromRoom(id: string | null) {
      fromRoomId = id;
      draw();
    },
    setToRoom(id: string | null) {
      toRoomId = id;
      draw();
    },
    setActiveFloor(floor: number) {
      activeFloor = floor;
      draw();
    },
    setFloorImage(src: string) {
      loadFloorImage(src);
    },
    resetView() {
      resetView();
    },
    focusOnNode(id: string, minZoom = 1.3) {
      focusOnNode(id, minZoom);
    },
    getFromRoom() {
      return fromRoomId;
    },
    getToRoom() {
      return toRoomId;
    },
    destroy() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onWindowResize);
    },
  };
}
