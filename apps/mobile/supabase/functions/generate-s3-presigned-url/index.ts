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
    // Parse request body
    const { key, contentType = 'video/mp4' } = await req.json()

    if (!key) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: key' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')!
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')!
    const region = Deno.env.get('AWS_REGION') || 'us-east-2'
    const bucketName = Deno.env.get('AWS_S3_BUCKET') || 'eleve-native-app'

    if (!accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: 'AWS credentials not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create pre-signed URL using AWS Signature Version 4 (Deno-compatible)
    const date = new Date()
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '')
    const datetimeString = date.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
    
    const credential = `${accessKeyId}/${dateString}/${region}/s3/aws4_request`
    const algorithm = 'AWS4-HMAC-SHA256'
    const expires = '3600' // 1 hour

    // Build query parameters
    const params = new URLSearchParams({
      'X-Amz-Algorithm': algorithm,
      'X-Amz-Credential': credential,
      'X-Amz-Date': datetimeString,
      'X-Amz-Expires': expires,
      'X-Amz-SignedHeaders': 'host',
    })

    const canonicalRequest = [
      'PUT',
      `/${key}`,
      params.toString(),
      `host:${bucketName}.s3.${region}.amazonaws.com`,
      '',
      'host',
      'UNSIGNED-PAYLOAD'
    ].join('\n')

    // Create string to sign using Deno's crypto
    const encoder = new TextEncoder()
    const stringToSign = [
      algorithm,
      datetimeString,
      `${dateString}/${region}/s3/aws4_request`,
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))))
        .map(b => b.toString(16).padStart(2, '0')).join('')
    ].join('\n')

    // Calculate signature using HMAC-SHA256 (Deno-compatible)
    const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = await crypto.subtle.importKey('raw', encoder.encode(`AWS4${key}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const kRegion = await crypto.subtle.importKey('raw', new Uint8Array(await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp))), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const kService = await crypto.subtle.importKey('raw', new Uint8Array(await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName))), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const kSigning = await crypto.subtle.importKey('raw', new Uint8Array(await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName))), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      return await crypto.subtle.importKey('raw', new Uint8Array(await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'))), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    }

    const signingKey = await getSignatureKey(secretAccessKey, dateString, region, 's3')
    const signature = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', signingKey, encoder.encode(stringToSign))))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    params.set('X-Amz-Signature', signature)
    
    const presignedUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}?${params.toString()}`
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`

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
    console.error('Error generating pre-signed URL:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate pre-signed URL',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 