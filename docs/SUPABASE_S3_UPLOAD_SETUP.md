# Supabase S3 Upload Setup Guide

## 🚀 **Deploy Edge Function for Secure S3 Uploads**

### **Step 1: Install Supabase CLI**
```bash
npm install -g supabase
```

### **Step 2: Login and Initialize**
```bash
# Login to Supabase
supabase login

# Initialize in your project (if not already done)
supabase init
```

### **Step 3: Deploy the Edge Function**
```bash
# Deploy the pre-signed URL function
supabase functions deploy generate-s3-presigned-url
```

### **Step 4: Set Environment Variables**
Set these secrets in your Supabase project:

```bash
# Set AWS credentials as Supabase secrets
supabase secrets set AWS_ACCESS_KEY_ID=your-aws-access-key-id
supabase secrets set AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
supabase secrets set AWS_REGION=us-east-2
supabase secrets set AWS_S3_BUCKET=eleve-native-app
```

Or via the Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions**
2. Add these environment variables:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_REGION`: `us-east-2`
   - `AWS_S3_BUCKET`: `eleve-native-app`

### **Step 5: Test the Function**
```bash
# Test locally (optional)
supabase functions serve generate-s3-presigned-url

# Test the deployed function
curl -X POST 'https://your-project-id.supabase.co/functions/v1/generate-s3-presigned-url' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"key": "test/video.mp4", "contentType": "video/mp4"}'
```

## 🔒 **Security Benefits**

✅ **No AWS credentials in client app**
✅ **Pre-signed URLs expire (1 hour)**
✅ **Server-side validation and control**
✅ **Proper AWS authentication**
✅ **No CORS or compatibility issues**

## 📱 **Client Usage**

The app now:
1. **Requests pre-signed URL** from Supabase Edge Function
2. **Uploads directly to S3** using the secure URL
3. **Saves metadata** to Supabase database
4. **No AWS credentials** exposed in the mobile app

## 🧪 **Testing**

After deployment, test video upload in your app:
1. Record a video
2. Watch for: `🔐 Getting pre-signed URL from Supabase Edge Function...`
3. Should see: `✅ Pre-signed URL obtained`
4. Then: `🚀 SECURE S3 UPLOAD: Uploading to pre-signed URL`
5. Finally: `✅ Video uploaded successfully to S3`

## 🛠️ **Troubleshooting**

### **"Failed to get pre-signed URL" Error**
- Check Supabase Edge Function is deployed
- Verify environment variables are set
- Check AWS credentials have S3 permissions

### **"Access Denied" on Upload**
- Verify S3 bucket exists
- Check bucket permissions and CORS
- Ensure AWS user has `s3:PutObject` permission

### **Function Not Found**
```bash
# Redeploy the function
supabase functions deploy generate-s3-presigned-url --project-ref your-project-id
```

## 📋 **Required AWS Permissions**

Your AWS IAM user needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::eleve-native-app/*"
    }
  ]
}
```

That's it! Your S3 uploads are now secure and properly implemented. 🎉 