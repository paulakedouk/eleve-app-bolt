import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.0.0'
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Video upload function started successfully');
    
    // Parse request body
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body));
    
    const { 
      organizationId, 
      coachId, 
      studentId, 
      videoId,
      contentType = 'video/mp4' 
    } = body;

    // Validate required parameters
    if (!organizationId || !coachId || !studentId || !videoId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: organizationId, coachId, studentId, videoId' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test environment variables
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    
    console.log('AWS credentials check:', {
      hasAccessKeyId: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
      accessKeyId: accessKeyId ? accessKeyId.substring(0, 8) + '...' : 'missing'
    });

    if (!accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ 
          error: 'AWS credentials not configured',
          debug: {
            hasAccessKeyId: !!accessKeyId,
            hasSecretKey: !!secretAccessKey
          }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize S3 client with environment variables (using same pattern as working function)
    const s3Client = new S3Client({
      region: Deno.env.get('AWS_REGION') || 'us-east-2',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
      },
    })

    const bucketName = Deno.env.get('AWS_S3_BUCKET') || 'eleve-native-app'
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `videos/${organizationId}/${coachId}/${studentId}/${timestamp}_${videoId}.mp4`

    console.log(`Creating S3 command for bucket: ${bucketName}, key: ${key}`);

    // Create the command for S3 upload (same pattern as working function)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    })

    console.log('Generating pre-signed URL...');
    // Generate pre-signed URL (expires in 1 hour)
    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    })
    
    console.log('Pre-signed URL generated successfully');

    // Return the pre-signed URL and public URL (same format as working function)
    const publicUrl = `https://${bucketName}.s3.${Deno.env.get('AWS_REGION') || 'us-east-2'}.amazonaws.com/${key}`

    return new Response(
      JSON.stringify({ 
        presignedUrl,
        publicUrl,
        key,
        expiresIn: 3600
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Video upload function error:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Video upload function failed',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 