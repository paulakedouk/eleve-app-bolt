# Business Account Confirmation Email Template 📧

## Overview
This guide explains how to set up the professional business account confirmation email template for Eleve.

## Files
- `business-account-confirmation-email.html` - The main email template
- This guide - Setup instructions

## Template Features ✨
- **Responsive Design** - Works on desktop and mobile
- **Professional Branding** - Matches Eleve's visual identity
- **Clear Call-to-Action** - Prominent verification button
- **Business Information** - Shows account details
- **Next Steps Guide** - Helps new users get started
- **Security Notice** - Includes important security information

## Setup Instructions

### Option 1: Supabase Auth (Recommended)
1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Email Templates**
3. **Select "Confirm signup" template**
4. **Copy the HTML from `business-account-confirmation-email.html`**
5. **Replace the default template**

### Option 2: External Email Service (SendGrid, Mailgun, etc.)
1. **Upload the HTML template** to your email service
2. **Set up the template variables** (see below)
3. **Configure the email sending** in your app

## Template Variables 🔧
Replace these placeholders with actual values:

```html
{{business_name}}    - The business name from signup
{{owner_name}}       - The owner's name
{{email}}           - The business email address
{{confirmation_url}} - The verification link URL
```

## Integration Examples

### Supabase Auth Template
```html
<!-- Use Supabase's built-in variables -->
<p><strong>Business Name:</strong> {{ .Data.business_name }}</p>
<p><strong>Owner:</strong> {{ .Data.owner_name }}</p>
<p><strong>Email:</strong> {{ .Data.email }}</p>
<a href="{{ .ConfirmationURL }}">Verify Your Account</a>
```

### SendGrid Template
```javascript
// In your app when sending the email
const msg = {
  to: userEmail,
  from: 'noreply@eleve.app',
  templateId: 'your-template-id',
  dynamicTemplateData: {
    business_name: formData.businessName,
    owner_name: formData.ownerName,
    email: formData.email,
    confirmation_url: verificationUrl
  }
};
```

### Custom Email Service
```javascript
// Replace variables in the template
let emailHtml = templateHtml
  .replace('{{business_name}}', formData.businessName)
  .replace('{{owner_name}}', formData.ownerName)
  .replace('{{email}}', formData.email)
  .replace('{{confirmation_url}}', verificationUrl);
```

## Customization Options 🎨

### Brand Colors
Update the CSS gradient to match your brand:
```css
.header, .cta-button {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Logo
Replace the emoji logo with your actual logo:
```html
<div class="logo">
  <img src="your-logo-url.png" alt="Eleve" style="height: 40px;">
</div>
```

### Contact Information
Update the support email:
```html
<a href="mailto:your-support@yourdomain.com">your-support@yourdomain.com</a>
```

## Testing the Template 🧪

### Email Preview Tools
- **Litmus** - Test across different email clients
- **Email on Acid** - Comprehensive email testing
- **Supabase Preview** - Built-in template preview

### Send Test Email
1. **Create a test business account**
2. **Check that the email arrives**
3. **Verify all links work**
4. **Test the mobile responsive design**

## Production Checklist ✅

- [ ] Template uploaded to email service
- [ ] Variables are properly mapped
- [ ] Verification URL is correct
- [ ] Email arrives in inbox (not spam)
- [ ] All links are working
- [ ] Mobile responsive design tested
- [ ] Brand colors and logo updated
- [ ] Support email is correct
- [ ] Legal footer information is accurate

## Troubleshooting 🔧

### Common Issues
- **Variables not replacing** - Check variable syntax for your email service
- **Email goes to spam** - Verify SPF/DKIM records
- **Images not loading** - Use absolute URLs
- **Mobile layout broken** - Test CSS media queries

### Email Service Specific Notes
- **Supabase**: Uses Go template syntax `{{ .Variable }}`
- **SendGrid**: Uses handlebars syntax `{{variable}}`
- **Mailgun**: Uses handlebars syntax `{{variable}}`

## Future Enhancements 🚀
- Add A/B testing for different subject lines
- Include onboarding video link
- Add coach community invitation
- Implement email analytics tracking
- Create follow-up email sequence

## Support
For questions about implementing this template, contact the development team or check the Eleve documentation. 