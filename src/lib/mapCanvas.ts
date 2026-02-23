import type { PathNode } from "./pathfinding";

export type MapCanvasApi = {
  draw: () => void;
  resize: () => void;
  setPath: (path: PathNode[]) => void;
  setFromRoom: (id: string | null) => void;
  setToRoom: (id: string | null) => void;
  setFloorImage: (src: string) => void;
  getFromRoom: () => string | null;
  getToRoom: () => string | null;
  destroy: () => void;
};

type Options = {
  getNodeById: (id: string) => PathNode | undefined;
  initialFloorImageSrc?: string;
};

export function createMapCanvas(canvas: HTMLCanvasElement, options: Options): MapCanvasApi {
  const LOGICAL_FLOOR_WIDTH = 800;
  const LOGICAL_FLOOR_HEIGHT = 600;
  const DEFAULT_FLOOR_IMG_SRC = "/floors/1.svg";
  const INITIAL_VIEWPORT_PADDING_RATIO = 0.1;
  const TOUCH_PAN_MULTIPLIER = 1.35;

  const rawContext = canvas.getContext("2d");
  if (!rawContext) throw new Error("Cannot get 2D context");
  const context: CanvasRenderingContext2D = rawContext;

  const { getNodeById, initialFloorImageSrc } = options;

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let mapWidth = LOGICAL_FLOOR_WIDTH;
  let mapHeight = LOGICAL_FLOOR_HEIGHT;
  let coordScaleX = 1;
  let coordScaleY = 1;
  let currentPath: PathNode[] = [];
  let fromRoomId: string | null = null;
  let toRoomId: string | null = null;
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

  const floorImage = new Image();
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

  function drawPath() {
    if (currentPath.length < 2) return;

    context.strokeStyle = "#3fb98a";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.shadowColor = "rgba(63, 185, 138, 0.4)";
    context.shadowBlur = 10;

    context.beginPath();
    context.moveTo(mapX(currentPath[0].x), mapY(currentPath[0].y));
    for (let i = 1; i < currentPath.length; i += 1) {
      context.lineTo(mapX(currentPath[i].x), mapY(currentPath[i].y));
    }
    context.stroke();
    context.shadowBlur = 0;
  }

  function drawPins() {
    if (fromRoomId) {
      const from = getNodeById(fromRoomId);
      if (from) {
        const radius = 10;
        const x = mapX(from.x);
        const y = mapY(from.y);
        context.fillStyle = "#d4a024";
        context.strokeStyle = "rgba(255,255,255,0.9)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = "#fff";
        context.font = "10px sans-serif";
        context.textAlign = "center";
        context.fillText("З", x, y + radius + 12);
      }
    }

    if (toRoomId) {
      const to = getNodeById(toRoomId);
      if (to) {
        const radius = 10;
        const x = mapX(to.x);
        const y = mapY(to.y);
        context.fillStyle = "#c75a77";
        context.strokeStyle = "rgba(255,255,255,0.9)";
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = "#fff";
        context.font = "10px sans-serif";
        context.textAlign = "center";
        context.fillText("До", x, y + radius + 12);
      }
    }
  }

  function draw() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    clear();
    context.save();
    applyTransform();

    if (floorImageLoaded) {
      context.drawImage(floorImage, 0, 0, mapWidth, mapHeight);
    }

    drawPath();
    drawPins();
    context.restore();
  }

  function onPointerDown(e: PointerEvent) {
    const point = toCanvasPoint(e);
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

  function loadFloorImage(src: string) {
    if (!src) return;
    if (src === currentFloorImageSrc && floorImageLoaded) return;
    currentFloorImageSrc = src;
    floorImageLoaded = false;
    floorImage.src = src;
    draw();
  }

  floorImage.onload = () => {
    mapWidth = floorImage.naturalWidth || LOGICAL_FLOOR_WIDTH;
    mapHeight = floorImage.naturalHeight || LOGICAL_FLOOR_HEIGHT;
    coordScaleX = mapWidth / LOGICAL_FLOOR_WIDTH;
    coordScaleY = mapHeight / LOGICAL_FLOOR_HEIGHT;
    if (!hasInitializedViewport) {
      centerMapInViewport();
      hasInitializedViewport = true;
    }
    floorImageLoaded = true;
    draw();
  };

  floorImage.onerror = () => {
    floorImageLoaded = false;
    draw();
  };

  loadFloorImage(currentFloorImageSrc);

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
    setFloorImage(src: string) {
      loadFloorImage(src);
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
