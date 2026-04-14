import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import sharp from 'sharp';

const BUCKET = 'productos';

export async function POST(request: NextRequest) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Error leyendo archivos' }, { status: 400 });
  }

  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
  }

  const uploadedUrls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

    const arrayBuffer = await file.arrayBuffer();
    let fileBuffer: any = Buffer.from(arrayBuffer);

    try {
      fileBuffer = await sharp(fileBuffer)
        .webp({ quality: 80 })
        .toBuffer();
    } catch (conversionError) {
      console.error(`[Upload] Error convirtiendo a WebP, subiendo original:`, conversionError);
    }

    console.log(`[Upload] Subiendo ${file.name} (convertido a webp) como ${fileName}...`);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error(`[Upload] Error subiendo ${file.name}:`, JSON.stringify(error));
      errors.push(`${file.name}: ${error.message}`);
      continue;
    }

    console.log(`[Upload] ✅ Subido: ${data?.path}`);

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    if (urlData?.publicUrl) {
      uploadedUrls.push(urlData.publicUrl);
      console.log(`[Upload] URL: ${urlData.publicUrl}`);
    }
  }

  if (uploadedUrls.length === 0) {
    const errorMsg = errors.length > 0 
      ? errors.join('; ') 
      : 'Error desconocido. ¿Existe el bucket "productos" en Supabase Storage?';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }

  return NextResponse.json({ urls: uploadedUrls, errors });
}
