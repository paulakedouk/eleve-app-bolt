import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    console.log('Function started successfully');
    
    // Parse request body
    const body = await req.json()
    console.log('Request body:', JSON.stringify(body));
    
    const { orgId, contentType = 'image/png' } = body;

    if (!orgId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: orgId' }),
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

    // Try npm: import for better Deno compatibility
    console.log('Importing AWS SDK modules via npm:...');
    const { S3Client, PutObjectCommand } = await import('npm:@aws-sdk/client-s3@3.451.0')
    const { getSignedUrl } = await import('npm:@aws-sdk/s3-request-presigner@3.451.0')
    console.log('AWS SDK modules imported successfully');

    // Initialize S3 client with correct region (bucket is in us-east-2)
    console.log('Initializing S3 client...');
    const s3Client = new S3Client({
      region: 'us-east-2',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    const bucketName = 'eleve-native-app'
    const key = `logos/${orgId}.png`

    console.log(`Creating S3 command for bucket: ${bucketName}, key: ${key}`);

    // Create the command for S3 upload (no ACL since bucket doesn't support ACLs)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    })

    console.log('Generating pre-signed URL...');
    // Generate pre-signed URL (expires in 1 hour = 3600 seconds)
    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    })
    
    console.log('Pre-signed URL generated successfully');

    // Return the pre-signed URL
    return new Response(
      JSON.stringify({ 
        url: presignedUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: 'Function failed',
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