import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, Star, X, Image as ImageIcon } from "lucide-react";
import "../styles/ImageManager.css";

const MAX_IMAGES = 5;

function SortableImage({ image, onRemove, onSetCover }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`im-image-card ${image.isCover ? 'is-cover' : ''} ${isDragging ? 'is-dragging' : ''}`} 
      {...attributes} 
      {...listeners}
    >
      <img src={image.preview} alt="Book preview" className="im-image" />
      
      {image.isCover && (
        <div className="im-cover-badge">Cover</div>
      )}

      <div className="im-actions">
        <button
          type="button"
          className="im-btn im-btn-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(image); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Remove Image"
        >
          <X size={14} strokeWidth={3} />
        </button>

        <button
          type="button"
          className={`im-btn im-btn-cover ${image.isCover ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onSetCover(image.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Set as Cover"
        >
          <Star size={14} strokeWidth={image.isCover ? 3 : 2} />
        </button>
      </div>
    </div>
  );
}

export default function ImageManager({ existing = [], onChange }) {
  const [images, setImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false); // New state for dropzone

  // Initialize images safely
  useEffect(() => {
    if (existing && existing.length > 0 && images.length === 0) {
      setImages(
        existing.map(img => ({
          id: img.public_id || crypto.randomUUID(),
          preview: img.url || img.preview,
          file: img.file || null,
          public_id: img.public_id,
          isCover: img.isCover || false
        }))
      );
    }
  }, [existing]);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);

    if (images.length + fileArray.length > MAX_IMAGES) {
      alert(`You can only upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    const newImgs = fileArray.map((file, index) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      file,
      // If it's the very first image being uploaded, set it as cover automatically
      isCover: images.length === 0 && index === 0 
    }));

    const updated = [...images, ...newImgs];
    setImages(updated);
    onChange(updated);
  };

  // --- HTML5 Drag and Drop Handlers for File Upload ---
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevents the browser from opening the file
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Grab the files from the drag event and pass them to our existing function
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };
  // ----------------------------------------------------

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(i => i.id === active.id);
      const newIndex = images.findIndex(i => i.id === over.id);

      const updated = arrayMove(images, oldIndex, newIndex);
      setImages(updated);
      onChange(updated);
    }
  };

  const handleRemove = (imgToRemove) => {
    const updated = images.filter(i => i.id !== imgToRemove.id);
    
    // If we removed the cover, assign cover status to the first remaining image
    if (imgToRemove.isCover && updated.length > 0) {
      updated[0].isCover = true;
    }
    
    setImages(updated);
    onChange(updated);
  };

  const handleSetCover = (id) => {
    const updated = images.map(img => ({
      ...img,
      isCover: img.id === id
    }));
    setImages(updated);
    onChange(updated);
  };

  return (
    <div className="im-container">
      {images.length < MAX_IMAGES && (
        <div 
          className={`im-upload-box ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="im-upload-input"
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = null; // Reset input so same file can be uploaded again if needed
            }}
          />
          <label htmlFor="im-upload-input" className="im-upload-label">
            <div className="im-upload-icon-wrapper">
              <Upload size={24} className="im-upload-icon" />
            </div>
            <span className="im-upload-title">Click or drag images here</span>
            <span className="im-upload-subtitle">
              PNG, JPG, JPEG, WEBP or AVIF (max {MAX_IMAGES})
            </span>
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div className="im-gallery-wrapper">
          <div className="im-gallery-header">
            <ImageIcon size={16} />
            <span>Gallery ({images.length}/{MAX_IMAGES})</span>
            <span className="im-gallery-hint">Drag to reorder</span>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="im-image-grid">
                {images.map(img => (
                  <SortableImage
                    key={img.id}
                    image={img}
                    onRemove={handleRemove}
                    onSetCover={handleSetCover}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}