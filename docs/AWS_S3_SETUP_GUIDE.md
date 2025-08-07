# AWS S3 Setup Guide for Eleve

## 🎯 **Quick Setup (5 minutes)**

### **Step 1: Configure Your .env File**
Add these AWS S3 environment variables to your `.env` file:

```env
# AWS S3 Configuration
EXPO_PUBLIC_AWS_ACCESS_KEY_ID=your-aws-access-key-id
EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
EXPO_PUBLIC_AWS_REGION=us-east-2
EXPO_PUBLIC_AWS_S3_BUCKET=eleve-videos

# Optional: Custom S3 endpoint (for testing with LocalStack)
# EXPO_PUBLIC_AWS_S3_ENDPOINT=http://localhost:4566
```

### **Step 2: Create S3 Bucket**
1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click **"Create bucket"**
3. **Bucket name**: `eleve-videos` (or your preferred name)
4. **Region**: `us-east-2` (or your preferred region)
5. **Public access**: Uncheck "Block all public access" (videos need to be publicly accessible)
6. **Bucket policy**: Add this policy to make videos public:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eleve-videos/*"
    }
  ]
}
```

### **Step 3: Set Up CORS Configuration**
Add this CORS configuration to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## 📁 **S3 Folder Structure**

Your videos will be organized like this:
```
eleve-videos/
├── videos/
│   └── [coach-id]/
│       └── [date]/
│           └── [session-id]/
│               └── [video-id].mp4
└── thumbnails/
    └── [coach-id]/
        └── [date]/
            └── [session-id]/
                └── [video-id].jpg
```

**Example:**
```
eleve-videos/
├── videos/
│   └── coach-test-123/
│       └── 2024-01-15/
│           └── session-456/
│               └── video_1704567890_abc123.mp4
└── thumbnails/
    └── coach-test-123/
        └── 2024-01-15/
            └── session-456/
                └── video_1704567890_abc123.jpg
```

---

## 🚀 **Features Included**

### **✅ What's Working:**
- 📤 **Real S3 Upload**: Videos upload to your AWS S3 bucket
- 📊 **Progress Tracking**: Real-time upload progress with percentage
- 🔄 **Batch Upload**: Multiple videos upload efficiently
- 🗄️ **Database Integration**: Video metadata saved to Supabase
- 🏷️ **Student Tagging**: Videos linked to students in database
- 📱 **Background Upload**: Uploads continue even when app is backgrounded
- ❌ **Error Handling**: Failed uploads are retried and logged
- 🗑️ **Cleanup**: Failed uploads are cleaned up from S3

### **🎬 Upload Flow:**
1. **Record Video** → Local storage
2. **Review & Tag** → Add students, tricks, comments
3. **Upload to S3** → Progress tracking with real-time updates
4. **Save Metadata** → Store video details in Supabase database
5. **Link Students** → Associate video with selected students
6. **Cleanup** → Remove local video file (optional)

---

## 🧪 **Testing Your Setup**

### **Test 1: Check Configuration**
Run this in your app to validate AWS setup:
```javascript
import { s3Service } from './services/awsS3Service';

// Test configuration
const isValid = await s3Service.validateConfiguration();
console.log('AWS S3 Configuration Valid:', isValid);
```

### **Test 2: Upload a Video**
1. **Login as Coach** with bypass credentials
2. **Start Session** → Select students and environment
3. **Record Video** → Use camera to record a test video
4. **Review & Save** → Add student tags and comments
5. **Check Console** → Look for upload progress logs
6. **Verify S3** → Check your S3 bucket for uploaded video

### **Test 3: Batch Upload**
1. **Record Multiple Videos** in a session
2. **End Session** → Choose "Upload in Background"
3. **Monitor Progress** → Check console for batch upload logs
4. **Verify Database** → Check Supabase for video metadata

---

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **❌ "Access Denied" Error**
- Check AWS credentials in `.env` file
- Ensure IAM user has S3 permissions
- Verify bucket policy allows public access

#### **❌ "Bucket Not Found" Error**
- Check bucket name in `.env` file
- Ensure bucket exists in correct region
- Verify bucket name matches exactly

#### **❌ "CORS Error" (Web only)**
- Add CORS configuration to S3 bucket
- Ensure `AllowedOrigins` includes your domain

#### **❌ "Upload Progress Stuck"**
- Check internet connection
- Verify file size isn't too large
- Check AWS service status

### **Debug Commands:**
```bash
# Check environment variables
echo $EXPO_PUBLIC_AWS_ACCESS_KEY_ID
echo $EXPO_PUBLIC_AWS_S3_BUCKET

# Test AWS CLI (if installed)
aws s3 ls s3://eleve-videos --region us-east-2
```

---

## 🔒 **Security Best Practices**

### **✅ Recommended:**
- Use IAM user with minimal S3 permissions
- Rotate access keys regularly
- Enable S3 bucket versioning
- Set up CloudWatch monitoring
- Use S3 lifecycle policies for old videos

### **❌ Avoid:**
- Don't use root AWS account
- Don't store credentials in source code
- Don't make entire bucket public
- Don't use wildcard permissions

---

## 📈 **Production Optimizations**

### **Performance:**
- Use S3 Transfer Acceleration
- Implement video compression
- Add thumbnail generation
- Use CDN (CloudFront) for video delivery

### **Cost Optimization:**
- Set up S3 lifecycle policies
- Use S3 Intelligent-Tiering
- Compress videos before upload
- Monitor storage costs

### **Monitoring:**
- Set up CloudWatch alarms
- Monitor upload success rates
- Track storage usage
- Log upload errors

---

## 🎉 **Ready to Test!**

Your AWS S3 integration is now complete! 

### **Next Steps:**
1. **Update your `.env`** with AWS credentials
2. **Test the upload** with a coach recording
3. **Verify S3 bucket** contains uploaded videos
4. **Check Supabase** for video metadata

### **Support:**
- Check console logs for detailed upload progress
- Monitor S3 bucket for uploaded files
- Verify database records in Supabase
- Test both individual and batch uploads 