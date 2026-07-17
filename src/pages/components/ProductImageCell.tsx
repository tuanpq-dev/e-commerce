import React from "react";
import { Image } from "antd";
import { getProductImages } from "../../utils/variantEngine";
import "./css/ProductImageCell.css";

interface ProductImageCellProps {
  image: any;
}

export const ProductImageCell: React.FC<ProductImageCellProps> = ({ image }) => {
  const images = getProductImages(image);

  if (!images.length) return null;

  return (
    <Image.PreviewGroup>
      <div className="product-image-stack">
        {images.length > 2 && <div className="product-image-layer-3" />}
        {images.length > 1 && <div className="product-image-layer-2" />}

        <div className="product-image-layer-1">
          <Image
            src={images[0]}
            width={44}
            height={44}
            className="product-image-main"
            alt="product"
          />
          {images.length > 1 && (
            <div className="product-image-badge">
              +{images.length}
            </div>
          )}
        </div>

        <div className="product-image-hidden">
          {images.slice(1).map((src, idx) => (
            <Image key={idx} src={src} />
          ))}
        </div>
      </div>
    </Image.PreviewGroup>
  );
};
