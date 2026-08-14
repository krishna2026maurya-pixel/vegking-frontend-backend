import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Priority 1: Use the single CLOUDINARY_URL if available
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    // Priority 2: Use individual keys
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudinaryUrl && (!cloudName || !apiKey || !apiSecret)) {
      const missing = [];
      if (!cloudinaryUrl && !cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!cloudinaryUrl && !apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!cloudinaryUrl && !apiSecret) missing.push('CLOUDINARY_API_SECRET');

      return NextResponse.json({
        success: false,
        error: `Cloudinary configuration missing. Missing: ${missing.join(', ')}. Please add CLOUDINARY_URL or all individual keys to Vercel Environment Variables and REDEPLOY.`
      }, { status: 500 });
    }

    // Config will automatically use CLOUDINARY_URL if present in process.env
    // Otherwise we set it manually
    if (!cloudinaryUrl) {
      cloudinary.config({
        cloud_name: cloudName?.trim(),
        api_key: apiKey?.trim(),
        api_secret: apiSecret?.trim(),
      });
    }

    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'vegking_products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      }) as any;

      uploadedFiles.push({
        url: uploadResult.secure_url,
        filename: uploadResult.public_id,
        originalName: file.name
      });
    }

    return NextResponse.json({
      success: true,
      data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles,
      urls: uploadedFiles.map(f => f.url)
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
