import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { PAGE_HEIGHT, PAGE_WIDTH, type ScrapbookDoc, type ScrapbookItem } from "../../data/scrapbook";

export type ScrapbookCanvasHandle = {
  // Renders the page without selection handles
  toBlob: (pixelRatio: number) => Promise<Blob | null>
}

type canvasProps = {
  doc: ScrapbookDoc
  selectedId: string | null
  readOnly?: boolean
  onSelect: (id: string | null) => void
  onChange: (id: string, changes: Partial<ScrapbookItem>) => void
  onEditText?: (id: string) => void
}

// Loads a remote image with CORS enabled so the canvas can still be exported afterwards
function useImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);
  return image;
}

function PhotoNode({ item }: { item: Extract<ScrapbookItem, { type: "photo" }> }) {
  const image = useImage(item.src);
  const pad = 12;
  const captionHeight = item.caption ? 36 : 12;
  // Crop the image to fill the frame, like object-fit: cover
  let crop: { x: number; y: number; width: number; height: number } | undefined;
  if (image) {
    const frameRatio = item.width / item.height;
    const imageRatio = image.width / image.height;
    if (imageRatio > frameRatio) {
      const w = image.height * frameRatio;
      crop = { x: (image.width - w) / 2, y: 0, width: w, height: image.height };
    } else {
      const h = image.width / frameRatio;
      crop = { x: 0, y: (image.height - h) / 2, width: image.width, height: h };
    }
  }
  return (
    <>
      <Rect width={item.width + pad * 2} height={item.height + pad + captionHeight} fill="#FFFFFF" shadowColor="#000" shadowOpacity={0.18} shadowBlur={12} shadowOffsetY={4} />
      {image ? (
        <KonvaImage image={image} x={pad} y={pad} width={item.width} height={item.height} crop={crop} />
      ) : (
        <Rect x={pad} y={pad} width={item.width} height={item.height} fill="#E7E5E4" />
      )}
      {item.caption && (
        <Text text={item.caption} x={pad} y={pad + item.height + 8} width={item.width} align="center" fontSize={20} fontFamily="Inter, sans-serif" fill="#44403C" ellipsis wrap="none" />
      )}
    </>
  );
}

const ScrapbookCanvas = forwardRef<ScrapbookCanvasHandle, canvasProps>(function ScrapbookCanvas(
  { doc, selectedId, readOnly = false, onSelect, onChange, onEditText }, ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Record<string, Konva.Group | null>>({});
  const [width, setWidth] = useState(PAGE_WIDTH);

  // Scale the fixed-size page to fit its container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = width / PAGE_WIDTH;

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    transformer.nodes(node && !readOnly ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, doc.items, readOnly]);

  useImperativeHandle(ref, () => ({
    async toBlob(pixelRatio: number) {
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      if (!stage) return null;
      const attached = transformer?.nodes() ?? [];
      transformer?.nodes([]);
      // Export at the page's real size regardless of how big it is on screen
      const blob = await new Promise<Blob | null>((resolve) => {
        stage.toBlob({ pixelRatio: pixelRatio / scale, mimeType: "image/png", callback: (b) => resolve(b as Blob | null) });
      });
      transformer?.nodes(attached);
      return blob;
    },
  }), [scale]);

  function handleTransformEnd(item: ScrapbookItem) {
    const node = nodeRefs.current[item.id];
    if (!node) return;
    const nextScale = Math.max(0.2, Math.min(6, node.scaleX()));
    node.scale({ x: nextScale, y: nextScale });
    onChange(item.id, { x: node.x(), y: node.y(), rotation: node.rotation(), scale: nextScale });
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border-2 border-stone-300 shadow-sm">
      <Stage
        ref={stageRef}
        width={width}
        height={PAGE_HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => { if (e.target === e.target.getStage() || e.target.name() === "page") onSelect(null); }}
        onTouchStart={(e) => { if (e.target === e.target.getStage() || e.target.name() === "page") onSelect(null); }}
      >
        <Layer>
          <Rect name="page" width={PAGE_WIDTH} height={PAGE_HEIGHT} fill={doc.background} />
          {doc.items.map((item) => (
            <Group
              key={item.id}
              ref={(node) => { nodeRefs.current[item.id] = node; }}
              x={item.x}
              y={item.y}
              rotation={item.rotation}
              scaleX={item.scale}
              scaleY={item.scale}
              draggable={!readOnly}
              onMouseDown={() => !readOnly && onSelect(item.id)}
              onTap={() => !readOnly && onSelect(item.id)}
              onDblClick={() => item.type === "text" && onEditText?.(item.id)}
              onDblTap={() => item.type === "text" && onEditText?.(item.id)}
              onDragStart={() => !readOnly && onSelect(item.id)}
              onDragEnd={(e) => onChange(item.id, { x: e.target.x(), y: e.target.y() })}
              onTransformEnd={() => handleTransformEnd(item)}
            >
              {item.type === "sticker" && <Text text={item.emoji} fontSize={80} />}
              {item.type === "text" && (
                <Text text={item.text} fontSize={item.fontSize} fill={item.color} fontStyle="bold" fontFamily="Inter, sans-serif" />
              )}
              {item.type === "photo" && <PhotoNode item={item} />}
            </Group>
          ))}
          <Transformer
            ref={transformerRef}
            keepRatio
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            rotationSnaps={[0, 90, 180, 270]}
            borderStroke="#B23A16"
            anchorStroke="#B23A16"
            anchorFill="#FFFFFF"
            anchorSize={12}
            boundBoxFunc={(oldBox, newBox) => (newBox.width < 24 || newBox.height < 24 ? oldBox : newBox)}
          />
        </Layer>
      </Stage>
    </div>
  );
});

export default ScrapbookCanvas;
