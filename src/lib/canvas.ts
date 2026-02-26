import type { PathNode } from "./types";

export type MapMarker = Pick<PathNode, "id" | "x" | "y" | "floor"> & {
  src: string;
  iconSize?: number;
  title: string;
};

type Options = {
  getNodeById: (id: string) => PathNode | undefined;
  roomPoints: MapMarker[];
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

export class Canvas {
  private static readonly LOGICAL_FLOOR_WIDTH = 800;
  private static readonly LOGICAL_FLOOR_HEIGHT = 600;
  private static readonly DEFAULT_FLOOR_IMG_SRC = "/floors/1.svg";
  private static readonly INITIAL_VIEWPORT_PADDING_RATIO = 0.1;
  private static readonly TOUCH_PAN_MULTIPLIER = 1.35;
  private static readonly PIN_LABEL_FONT_PX = 20;
  private static readonly POINT_LABEL_MIN_ZOOM = 0.75;
  private static readonly FLOOR_BADGE_LOGO_SRC = "/logo_trans.svg";
  private static readonly FLOOR_BADGE_DEFAULT_RATIO = 0.62;

  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly getNodeById: (id: string) => PathNode | undefined;
  private readonly roomPoints: MapMarker[];
  private readonly onFloorHintClick?: (floor: number) => void;
  private readonly accentColor: string;

  private readonly pathStrokePx: number;
  private readonly pinRadiusPx: number;
  private readonly pinStrokePx: number;
  private readonly pinLabelOffsetPx: number;
  private readonly pointLabelFontPx: number;
  private readonly pointLabelPaddingXPx: number;
  private readonly pointLabelPaddingYPx: number;
  private readonly pointLabelGapPx: number;

  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private mapWidth = Canvas.LOGICAL_FLOOR_WIDTH;
  private mapHeight = Canvas.LOGICAL_FLOOR_HEIGHT;
  private floorDrawWidth = Canvas.LOGICAL_FLOOR_WIDTH;
  private floorDrawHeight = Canvas.LOGICAL_FLOOR_HEIGHT;
  private maxFloorImageWidth = Canvas.LOGICAL_FLOOR_WIDTH;
  private maxFloorImageHeight = Canvas.LOGICAL_FLOOR_HEIGHT;
  private coordScaleX = 1;
  private coordScaleY = 1;
  private currentPath: PathNode[] = [];
  private fromRoomId: string | null = null;
  private toRoomId: string | null = null;
  private activeFloor = 1;
  private floorHintTargets: FloorHintTarget[] = [];
  private isDragging = false;
  private lastPointer = { x: 0, y: 0 };
  private readonly activePointers = new Map<number, { x: number; y: number; pointerType: string }>();
  private pinchState: {
    startDistance: number;
    startScale: number;
    focusLocalX: number;
    focusLocalY: number;
  } | null = null;
  private hasInitializedViewport = false;
  private floorImageLoaded = false;
  private currentFloorImageSrc: string;
  private pendingFocus: { id: string; minZoom: number } | null = null;
  private pendingViewportReset = false;
  private readonly pointImageCache = new Map<
    string,
    {
      image: HTMLImageElement;
      loaded: boolean;
      failed: boolean;
    }
  >();

  private readonly floorImage = new Image();
  private readonly floorBadgeLogo = new Image();
  private floorBadgeLogoLoaded = false;
  private floorBadgeLogoFailed = false;

  constructor(canvas: HTMLCanvasElement, options: Options) {
    this.canvas = canvas;
    const rawContext = canvas.getContext("2d");
    if (!rawContext) throw new Error("Cannot get 2D context");
    this.context = rawContext;

    this.getNodeById = options.getNodeById;
    this.roomPoints = options.roomPoints;
    this.onFloorHintClick = options.onFloorHintClick;
    this.currentFloorImageSrc = options.initialFloorImageSrc ?? Canvas.DEFAULT_FLOOR_IMG_SRC;

    const rootStyles = getComputedStyle(document.documentElement);
    this.accentColor = rootStyles.getPropertyValue("--accent").trim() || "#a6dfe6";

    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    this.pathStrokePx = isCoarsePointer ? 18 : 8;
    this.pinRadiusPx = isCoarsePointer ? 24 : 14;
    this.pinStrokePx = isCoarsePointer ? 5 : 3;
    this.pinLabelOffsetPx = isCoarsePointer ? 22 : 15;
    this.pointLabelFontPx = isCoarsePointer ? 16 : 12;
    this.pointLabelPaddingXPx = isCoarsePointer ? 12 : 10;
    this.pointLabelPaddingYPx = isCoarsePointer ? 8 : 6;
    this.pointLabelGapPx = isCoarsePointer ? 12 : 8;

    this.floorImage.onload = this.onFloorImageLoad;
    this.floorImage.onerror = this.onFloorImageError;
    this.floorBadgeLogo.onload = this.onFloorBadgeLogoLoad;
    this.floorBadgeLogo.onerror = this.onFloorBadgeLogoError;

    this.loadFloorImage(this.currentFloorImageSrc);
    this.floorBadgeLogo.src = Canvas.FLOOR_BADGE_LOGO_SRC;

    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerUp);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("resize", this.onWindowResize);

    this.resizeCanvasToContainer();
    this.draw();
  }

  setPath(path: PathNode[]) {
    this.currentPath = path;
    this.draw();
  }

  setFromRoom(id: string | null) {
    this.fromRoomId = id;
    this.draw();
  }

  setToRoom(id: string | null) {
    this.toRoomId = id;
    this.draw();
  }

  setActiveFloor(floor: number) {
    this.activeFloor = floor;
    this.draw();
  }

  setFloorImage(src: string) {
    this.loadFloorImage(src);
  }

  resetViewportToDefault() {
    if (!this.floorImageLoaded) {
      this.pendingViewportReset = true;
      return;
    }

    this.pendingViewportReset = false;
    this.centerMapInViewport();
    this.draw();
  }

  focusOnNode(id: string, minZoom = 1.3) {
    const node = this.getNodeById(id);
    if (!node) return;

    const nextMinZoom = Math.max(0.3, Math.min(3, minZoom));
    if (!this.floorImageLoaded) {
      this.pendingFocus = { id, minZoom: nextMinZoom };
      return;
    }

    const targetX = this.mapX(node.x);
    const targetY = this.mapY(node.y);
    const baseScale = Math.min(this.canvas.width / this.mapWidth, this.canvas.height / this.mapHeight);
    const nextScale = Math.max(this.scale, nextMinZoom);
    const scaled = baseScale * nextScale;

    this.scale = nextScale;
    this.offsetX = this.canvas.width / 2 - targetX * scaled;
    this.offsetY = this.canvas.height / 2 - targetY * scaled;
    this.draw();
  }

  destroy() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("resize", this.onWindowResize);
  }

  private ensurePointImage(src: string) {
    const cached = this.pointImageCache.get(src);
    if (cached) return cached;

    const image = new Image();
    const next = { image, loaded: false, failed: false };
    image.onload = () => {
      next.loaded = true;
      this.draw();
    };
    image.onerror = () => {
      next.failed = true;
      this.draw();
    };
    image.src = src;
    this.pointImageCache.set(src, next);
    return next;
  }

  private resizeCanvasToContainer() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * devicePixelRatio));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * devicePixelRatio));

    if (this.canvas.width === width && this.canvas.height === height) return;

    this.canvas.width = width;
    this.canvas.height = height;
  }

  private toCanvasPoint(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  }

  private getTouchPointers() {
    return Array.from(this.activePointers.values()).filter((pointer) => pointer.pointerType === "touch");
  }

  private startPinchGesture() {
    const touches = this.getTouchPointers();
    if (touches.length < 2) return;

    const first = touches[0];
    const second = touches[1];
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    if (distance <= 0) return;

    const midX = (first.x + second.x) / 2;
    const midY = (first.y + second.y) / 2;
    const transform = this.getTransform();

    this.pinchState = {
      startDistance: distance,
      startScale: this.scale,
      focusLocalX: (midX - transform.tx) / transform.scale,
      focusLocalY: (midY - transform.ty) / transform.scale,
    };
  }

  private getTransform() {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const baseScale = Math.min(cw / this.mapWidth, ch / this.mapHeight);
    const scaled = baseScale * this.scale;
    const tx = this.offsetX;
    const ty = this.offsetY;

    return { scale: scaled, tx, ty };
  }

  private applyTransform() {
    const transform = this.getTransform();
    this.context.translate(transform.tx, transform.ty);
    this.context.scale(transform.scale, transform.scale);
  }

  private clear() {
    this.context.fillStyle = "#0f1216";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private mapX(x: number) {
    return x * this.coordScaleX;
  }

  private mapY(y: number) {
    return y * this.coordScaleY;
  }

  private getFloorFromNode(node: Pick<PathNode, "floor">): number {
    return node.floor;
  }

  private toMapPoint(canvasPoint: { x: number; y: number }) {
    const transform = this.getTransform();
    return {
      x: (canvasPoint.x - transform.tx) / transform.scale,
      y: (canvasPoint.y - transform.ty) / transform.scale,
    };
  }

  private isNodeOnActiveFloor(node: PathNode | undefined): boolean {
    if (!node) return false;
    if (typeof node.floor !== "number") return true;
    return node.floor === this.activeFloor;
  }

  private drawFloorTransitionHints() {
    this.floorHintTargets = [];
    if (this.currentPath.length < 2) return;

    const seen = new Set<string>();
    const transformScale = Math.max(0.001, this.getTransform().scale);
    const fontSize = 32 / transformScale;
    const lineGap = 6 / transformScale;
    const paddingX = 24 / transformScale;
    const paddingY = 14 / transformScale;
    const offsetY = 74 / transformScale;
    const borderWidth = 4 / transformScale;
    const radius = 18 / transformScale;
    const destinationNode = this.toRoomId ? this.getNodeById(this.toRoomId) : undefined;
    const destinationFloor = destinationNode ? this.getFloorFromNode(destinationNode) : null;

    for (let i = 1; i < this.currentPath.length; i += 1) {
      const fromNode = this.currentPath[i - 1];
      const toNode = this.currentPath[i];
      const fromFloor = this.getFloorFromNode(fromNode);
      const toFloor = this.getFloorFromNode(toNode);

      if (fromFloor === toFloor) continue;
      if (fromFloor !== this.activeFloor) continue;

      const hintKey = `${Math.round(fromNode.x)}:${Math.round(fromNode.y)}:${toFloor}`;
      if (seen.has(hintKey)) continue;
      seen.add(hintKey);

      const targetFloor = destinationFloor ?? toFloor;
      const lines = ["СХОДИ", `НА ${targetFloor} ПОВЕРХ`];
      const x = this.mapX(fromNode.x);
      const y = this.mapY(fromNode.y) - offsetY;

      this.context.font = `900 ${fontSize}px sans-serif`;
      this.context.textAlign = "center";
      this.context.textBaseline = "top";
      const textWidth = Math.max(...lines.map((line) => this.context.measureText(line).width));
      const textHeight = lines.length * fontSize + (lines.length - 1) * lineGap;
      const width = textWidth + paddingX * 2;
      const height = textHeight + paddingY * 2;
      const left = x - width / 2;
      const top = y - height / 2;
      this.floorHintTargets.push({ left, top, width, height, targetFloor });

      this.context.fillStyle = "rgba(8, 11, 14, 0.96)";
      this.context.strokeStyle = this.accentColor;
      this.context.lineWidth = borderWidth;

      this.context.beginPath();
      this.context.moveTo(left + radius, top);
      this.context.lineTo(left + width - radius, top);
      this.context.quadraticCurveTo(left + width, top, left + width, top + radius);
      this.context.lineTo(left + width, top + height - radius);
      this.context.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
      this.context.lineTo(left + radius, top + height);
      this.context.quadraticCurveTo(left, top + height, left, top + height - radius);
      this.context.lineTo(left, top + radius);
      this.context.quadraticCurveTo(left, top, left + radius, top);
      this.context.closePath();
      this.context.fill();
      this.context.stroke();

      this.context.fillStyle = "#ffffff";
      this.context.strokeStyle = "rgba(8, 11, 14, 0.95)";
      this.context.lineWidth = 6 / transformScale;
      lines.forEach((line, index) => {
        const lineY = top + paddingY + index * (fontSize + lineGap);
        this.context.strokeText(line, x, lineY);
        this.context.fillText(line, x, lineY);
      });
    }
  }

  private getHintTargetFloorAt(canvasPoint: { x: number; y: number }): number | null {
    const local = this.toMapPoint(canvasPoint);
    const match = this.floorHintTargets.find(
      (target) =>
        local.x >= target.left &&
        local.x <= target.left + target.width &&
        local.y >= target.top &&
        local.y <= target.top + target.height
    );
    return match?.targetFloor ?? null;
  }

  private drawPath() {
    if (this.currentPath.length < 2) return;

    const transformScale = Math.max(0.001, this.getTransform().scale);
    this.context.strokeStyle = "#3fb98a";
    this.context.lineWidth = this.pathStrokePx / transformScale;
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.shadowColor = "rgba(63, 185, 138, 0.4)";
    this.context.shadowBlur = (this.pathStrokePx + 6) / transformScale;

    this.context.beginPath();
    let segmentStarted = false;
    let hasVisibleSegment = false;

    for (const node of this.currentPath) {
      if (!this.isNodeOnActiveFloor(node)) {
        segmentStarted = false;
        continue;
      }

      const x = this.mapX(node.x);
      const y = this.mapY(node.y);
      if (!segmentStarted) {
        this.context.moveTo(x, y);
        segmentStarted = true;
        continue;
      }

      this.context.lineTo(x, y);
      hasVisibleSegment = true;
    }

    if (hasVisibleSegment) this.context.stroke();
    this.context.shadowBlur = 0;
  }

  private drawRoomPoints() {
    if (this.roomPoints.length === 0) return;

    const transformScale = Math.max(0.001, this.getTransform().scale);
    const radius = 8 / transformScale;
    const strokeWidth = 2 / transformScale;
    const labelBorderWidth = 1.5 / transformScale;
    const showLabels = this.scale >= Canvas.POINT_LABEL_MIN_ZOOM;
    const labelFontSize = this.pointLabelFontPx / transformScale;
    const labelPaddingX = this.pointLabelPaddingXPx / transformScale;
    const labelPaddingY = this.pointLabelPaddingYPx / transformScale;
    const labelGap = this.pointLabelGapPx / transformScale;
    const labelsToDraw: Array<{ text: string; x: number; y: number }> = [];
    this.context.fillStyle = "rgba(166, 223, 230, 0.95)";
    this.context.strokeStyle = "rgba(8, 11, 14, 0.92)";
    this.context.lineWidth = strokeWidth;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = "high";

    for (const point of this.roomPoints) {
      const pointFloor = this.getFloorFromNode(point);
      if (pointFloor !== this.activeFloor) continue;

      const x = this.mapX(point.x);
      const y = this.mapY(point.y);
      const iconSize = Math.max(16, point.iconSize ?? 68);
      const markerRadius = point.src ? iconSize / 2 : radius;
      const label = point.title?.trim();
      if (showLabels && label) {
        labelsToDraw.push({ text: label, x, y: y + markerRadius + labelGap });
      }

      if (point.src) {
        const cached = this.ensurePointImage(point.src);
        if (cached.loaded && !cached.failed) {
          const left = x - iconSize / 2;
          const top = y - iconSize / 2;
          this.context.drawImage(cached.image, left, top, iconSize, iconSize);
          continue;
        }
      }

      this.context.beginPath();
      this.context.arc(x, y, radius, 0, Math.PI * 2);
      this.context.fill();
      this.context.stroke();
    }

    if (!showLabels || labelsToDraw.length === 0) return;

    this.context.font = `700 ${labelFontSize}px sans-serif`;
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    for (const label of labelsToDraw) {
      const textWidth = this.context.measureText(label.text).width;
      const labelWidth = textWidth + labelPaddingX * 2;
      const labelHeight = labelFontSize + labelPaddingY * 2;
      const left = label.x - labelWidth / 2;
      const top = label.y;

      this.context.fillStyle = "rgba(8, 11, 14, 0.88)";
      this.context.strokeStyle = "rgba(166, 223, 230, 0.8)";
      this.context.lineWidth = labelBorderWidth;
      this.context.fillRect(left, top, labelWidth, labelHeight);
      this.context.strokeRect(left, top, labelWidth, labelHeight);

      this.context.fillStyle = "#ffffff";
      this.context.fillText(label.text, label.x, top + labelHeight / 2);
    }
  }

  private drawPins() {
    const transformScale = Math.max(0.001, this.getTransform().scale);
    const pinRadius = this.pinRadiusPx / transformScale;
    const pinStrokeWidth = this.pinStrokePx / transformScale;
    const labelFontSize = Canvas.PIN_LABEL_FONT_PX / transformScale;
    const labelOffset = (this.pinRadiusPx + this.pinLabelOffsetPx) / transformScale;

    if (this.fromRoomId) {
      const from = this.getNodeById(this.fromRoomId);
      if (from && this.isNodeOnActiveFloor(from)) {
        const x = this.mapX(from.x);
        const y = this.mapY(from.y);
        this.context.fillStyle = "#d4a024";
        this.context.strokeStyle = "rgba(255,255,255,0.9)";
        this.context.lineWidth = pinStrokeWidth;
        this.context.beginPath();
        this.context.arc(x, y, pinRadius, 0, Math.PI * 2);
        this.context.fill();
        this.context.stroke();
        this.context.fillStyle = "#fff";
        this.context.font = `${labelFontSize}px sans-serif`;
        this.context.textAlign = "center";
        this.context.fillText("З", x, y + labelOffset);
      }
    }

    if (this.toRoomId) {
      const to = this.getNodeById(this.toRoomId);
      if (to && this.isNodeOnActiveFloor(to)) {
        const x = this.mapX(to.x);
        const y = this.mapY(to.y);
        this.context.fillStyle = "#c75a77";
        this.context.strokeStyle = "rgba(255,255,255,0.9)";
        this.context.lineWidth = pinStrokeWidth;
        this.context.beginPath();
        this.context.arc(x, y, pinRadius, 0, Math.PI * 2);
        this.context.fill();
        this.context.stroke();
        this.context.fillStyle = "#fff";
        this.context.font = `${labelFontSize}px sans-serif`;
        this.context.textAlign = "center";
        this.context.fillText("До", x, y + labelOffset);
      }
    }
  }

  private drawFloorBadge() {
    const logoWidth = this.mapWidth * 0.1;
    const logoRatio =
      this.floorBadgeLogoLoaded && this.floorBadgeLogo.naturalWidth > 0
        ? this.floorBadgeLogo.naturalWidth / this.floorBadgeLogo.naturalHeight
        : Canvas.FLOOR_BADGE_DEFAULT_RATIO;
    const logoHeight = logoWidth / Math.max(0.001, logoRatio);
    const outsideOffsetX = this.mapWidth * 0.028;
    const outsideOffsetY = this.mapHeight * 0.1;
    const logoX = this.mapWidth + outsideOffsetX;
    const logoY = -outsideOffsetY;
    const numberGap = logoWidth * 0.04;
    const fontSize = logoWidth * 0.68;
    const floorLabel = String(this.activeFloor);
    const strokeWidth = logoWidth * 0.07;
    const shadowBlur = logoWidth * 0.26;

    this.context.save();
    this.context.fillStyle = "#ffffff";
    this.context.strokeStyle = "rgba(8, 11, 14, 0.92)";
    this.context.lineWidth = strokeWidth;
    this.context.font = `800 ${fontSize}px "DM Sans", "Segoe UI", sans-serif`;
    this.context.textAlign = "right";
    this.context.textBaseline = "middle";

    const textX = logoX - numberGap;
    const textY = logoY + logoHeight / 2;
    this.context.strokeText(floorLabel, textX, textY);
    this.context.fillText(floorLabel, textX, textY);

    if (this.floorBadgeLogoLoaded && !this.floorBadgeLogoFailed) {
      this.context.shadowColor = "rgba(8, 11, 14, 0.44)";
      this.context.shadowBlur = shadowBlur;
      this.context.drawImage(this.floorBadgeLogo, logoX, logoY, logoWidth, logoHeight);
      this.context.shadowBlur = 0;
    }
    this.context.restore();
  }

  private draw() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.clear();
    this.context.save();
    this.applyTransform();

    if (this.floorImageLoaded) {
      this.context.drawImage(this.floorImage, 0, 0, this.floorDrawWidth, this.floorDrawHeight);
    }

    this.drawRoomPoints();
    this.drawPath();
    this.drawFloorTransitionHints();
    this.drawPins();
    this.drawFloorBadge();
    this.context.restore();
  }

  private readonly onPointerDown = (e: PointerEvent) => {
    const point = this.toCanvasPoint(e);
    const hintFloor = this.getHintTargetFloorAt(point);
    if (hintFloor !== null && hintFloor !== this.activeFloor) {
      if (this.onFloorHintClick) {
        this.onFloorHintClick(hintFloor);
      } else {
        this.activeFloor = hintFloor;
        this.draw();
      }
      return;
    }

    this.activePointers.set(e.pointerId, { ...point, pointerType: e.pointerType });
    this.canvas.setPointerCapture(e.pointerId);

    if (e.pointerType === "touch" && this.getTouchPointers().length >= 2) {
      this.isDragging = false;
      this.startPinchGesture();
      return;
    }

    this.isDragging = true;
    this.lastPointer = point;
  };

  private readonly onPointerMove = (e: PointerEvent) => {
    const point = this.toCanvasPoint(e);
    const activePointer = this.activePointers.get(e.pointerId);
    if (activePointer) {
      this.activePointers.set(e.pointerId, { ...point, pointerType: activePointer.pointerType });
    }

    const touches = this.getTouchPointers();
    if (touches.length >= 2) {
      if (!this.pinchState) {
        this.startPinchGesture();
      }
      if (!this.pinchState) return;

      const first = touches[0];
      const second = touches[1];
      const midX = (first.x + second.x) / 2;
      const midY = (first.y + second.y) / 2;
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      if (distance <= 0) return;

      const pinchRatio = distance / this.pinchState.startDistance;
      const newScale = Math.max(0.3, Math.min(3, this.pinchState.startScale * pinchRatio));
      const baseScale = Math.min(this.canvas.width / this.mapWidth, this.canvas.height / this.mapHeight);
      const newScaled = baseScale * newScale;

      this.offsetX = midX - this.pinchState.focusLocalX * newScaled;
      this.offsetY = midY - this.pinchState.focusLocalY * newScaled;
      this.scale = newScale;
      this.draw();
      return;
    }

    this.pinchState = null;
    if (!this.isDragging) return;

    const panMultiplier = e.pointerType === "touch" ? Canvas.TOUCH_PAN_MULTIPLIER : 1;
    this.offsetX += (point.x - this.lastPointer.x) * panMultiplier;
    this.offsetY += (point.y - this.lastPointer.y) * panMultiplier;
    this.lastPointer = point;
    this.draw();
  };

  private readonly onPointerUp = (e: PointerEvent) => {
    this.activePointers.delete(e.pointerId);
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }

    const touches = this.getTouchPointers();
    if (touches.length >= 2) {
      this.startPinchGesture();
      return;
    }

    this.pinchState = null;
    if (touches.length === 1) {
      this.isDragging = true;
      this.lastPointer = { x: touches[0].x, y: touches[0].y };
      return;
    }

    this.isDragging = false;
  };

  private readonly onWheel = (e: WheelEvent) => {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    const transform = this.getTransform();
    const lx = (mx - transform.tx) / transform.scale;
    const ly = (my - transform.ty) / transform.scale;

    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, this.scale * factor));
    const baseScale = Math.min(this.canvas.width / this.mapWidth, this.canvas.height / this.mapHeight);
    const newScaled = baseScale * newScale;

    this.offsetX = mx - lx * newScaled;
    this.offsetY = my - ly * newScaled;
    this.scale = newScale;
    this.draw();
  };

  private readonly onWindowResize = () => {
    this.resizeCanvasToContainer();
    this.draw();
  };

  private centerMapInViewport() {
    const safePaddingRatio = Math.max(0, Math.min(0.45, Canvas.INITIAL_VIEWPORT_PADDING_RATIO));
    const paddingX = this.canvas.width * safePaddingRatio;
    const paddingY = this.canvas.height * safePaddingRatio;
    const availableWidth = Math.max(1, this.canvas.width - paddingX * 2);
    const availableHeight = Math.max(1, this.canvas.height - paddingY * 2);

    const baseScale = Math.min(this.canvas.width / this.mapWidth, this.canvas.height / this.mapHeight);
    const paddedBaseScale = Math.min(availableWidth / this.mapWidth, availableHeight / this.mapHeight);
    this.scale = Math.max(0.3, Math.min(3, paddedBaseScale / baseScale));

    const scaledWidth = this.mapWidth * baseScale * this.scale;
    const scaledHeight = this.mapHeight * baseScale * this.scale;
    this.offsetX = (this.canvas.width - scaledWidth) / 2;
    this.offsetY = (this.canvas.height - scaledHeight) / 2;
  }

  private loadFloorImage(src: string) {
    if (!src) return;
    if (src === this.currentFloorImageSrc && this.floorImageLoaded) return;
    this.currentFloorImageSrc = src;
    this.floorImageLoaded = false;
    this.floorImage.src = src;
    this.draw();
  }

  private readonly onFloorImageLoad = () => {
    this.floorDrawWidth = this.floorImage.naturalWidth || Canvas.LOGICAL_FLOOR_WIDTH;
    this.floorDrawHeight = this.floorImage.naturalHeight || Canvas.LOGICAL_FLOOR_HEIGHT;
    this.maxFloorImageWidth = Math.max(this.maxFloorImageWidth, this.floorDrawWidth);
    this.maxFloorImageHeight = Math.max(this.maxFloorImageHeight, this.floorDrawHeight);
    this.mapWidth = this.maxFloorImageWidth;
    this.mapHeight = this.maxFloorImageHeight;
    this.coordScaleX = this.floorDrawWidth / Canvas.LOGICAL_FLOOR_WIDTH;
    this.coordScaleY = this.floorDrawHeight / Canvas.LOGICAL_FLOOR_HEIGHT;
    if (!this.hasInitializedViewport) {
      this.centerMapInViewport();
      this.hasInitializedViewport = true;
    }
    this.floorImageLoaded = true;
    if (this.pendingFocus) {
      const request = this.pendingFocus;
      this.pendingFocus = null;
      this.pendingViewportReset = false;
      this.focusOnNode(request.id, request.minZoom);
      return;
    }

    if (this.pendingViewportReset) {
      this.pendingViewportReset = false;
      this.centerMapInViewport();
    }
    this.draw();
  };

  private readonly onFloorImageError = () => {
    this.floorImageLoaded = false;
    this.draw();
  };

  private readonly onFloorBadgeLogoLoad = () => {
    this.floorBadgeLogoLoaded = true;
    this.draw();
  };

  private readonly onFloorBadgeLogoError = () => {
    this.floorBadgeLogoFailed = true;
    this.draw();
  };
}
