const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const JPEG_QUALITY = 0.85;

export const downscaleImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
        
        resolve(dataUrl);
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const hashImage = (base64Data) => {
  let hash = 0;
  for (let i = 0; i < base64Data.length; i++) {
    const char = base64Data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `img_${Math.abs(hash).toString(36)}`;
};

export const processImageForStorage = async (file, existingImages = {}) => {
  const downscaled = await downscaleImage(file);
  const hash = hashImage(downscaled);
  
  if (existingImages[hash]) {
    return { imageRef: hash, isNew: false };
  }
  
  return { 
    imageRef: hash, 
    imageData: downscaled,
    isNew: true 
  };
};

export const extractImageLibrary = (tanks) => {
  const library = {};
  
  tanks.forEach(tank => {
    if (tank.image && tank.image.startsWith('data:')) {
      const hash = hashImage(tank.image);
      if (!library[hash]) {
        library[hash] = tank.image;
      }
    }
    if (tank.bgImage && tank.bgImage.startsWith('data:')) {
      const hash = hashImage(tank.bgImage);
      if (!library[hash]) {
        library[hash] = tank.bgImage;
      }
    }
  });
  
  return library;
};

export const convertTanksToRefs = (tanks, imageLibrary) => {
  return tanks.map(tank => {
    const newTank = { ...tank };
    
    if (tank.image && tank.image.startsWith('data:')) {
      const hash = hashImage(tank.image);
      if (imageLibrary[hash]) {
        newTank.image = `ref:${hash}`;
      }
    }
    
    if (tank.bgImage && tank.bgImage.startsWith('data:')) {
      const hash = hashImage(tank.bgImage);
      if (imageLibrary[hash]) {
        newTank.bgImage = `ref:${hash}`;
      }
    }
    
    return newTank;
  });
};

export const resolveTankImages = (tanks, imageLibrary) => {
  return tanks.map(tank => {
    const newTank = { ...tank };
    
    if (tank.image && tank.image.startsWith('ref:')) {
      const hash = tank.image.substring(4);
      newTank.image = imageLibrary[hash] || null;
    }
    
    if (tank.bgImage && tank.bgImage.startsWith('ref:')) {
      const hash = tank.bgImage.substring(4);
      newTank.bgImage = imageLibrary[hash] || null;
    }
    
    return newTank;
  });
};

export const getImageByRef = (imageRef, imageLibrary) => {
  if (!imageRef) return null;
  if (!imageRef.startsWith('ref:')) return imageRef;
  const hash = imageRef.substring(4);
  return imageLibrary[hash] || null;
};