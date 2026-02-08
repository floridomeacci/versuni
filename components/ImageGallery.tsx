import Image from 'next/image';

const images = [
  '/images/optimized/image1.webp',
  '/images/optimized/image2.webp',
  '/images/optimized/image3.webp',
  '/images/optimized/image4.webp',
];

export default function ImageGallery() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
      {images.map((src, index) => (
        <div key={index} className="relative aspect-video overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <Image
            src={src}
            alt={`Gallery image ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
}
