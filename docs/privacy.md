# Privacy Policy

**Effective Date:** Current

This website (Munich Weekly) is operated as a non-commercial, student-run platform. We are committed to respecting your privacy and ensuring transparent data practices. Below is a summary of how we handle data.

## 📚 Related Documentation

For technical implementation details and security architecture:
- 🔐 [Authentication & Security](./auth.md) - Complete security implementation including anonymous voting
- 🔒 [Security Summary](./security-summary.md) - Executive security overview and compliance status
- 📦 [API Reference](./api.md) - Data collection endpoints and authentication requirements
- 💾 [Storage System](./storage.md) - File storage security and data handling
- 🏠 [Project Overview](../README.md) - Platform features and technology stack

---

## 1. Use of Cookies

We use a single technical cookie to help enforce the rule of "one vote per person" in our weekly photo voting system. This cookie is:

* Named `visitorId`
* A randomly generated identifier (UUID)
* Stored in your browser
* Not linked to your personal identity

We do **not** use cookies for analytics, advertising, or tracking.

This cookie is necessary for core functionality (to prevent repeated voting from the same browser) and does not collect any personally identifiable information.

---

## 2. What Data We Collect

When you vote, we may temporarily store:

* Your `visitorId` (from the cookie)
* The submission you voted for
* Timestamp of the vote
* (Optionally) Your IP address and browser metadata, only for abuse prevention

We do not collect your name, email, or any other personal identifiers unless you explicitly log in (e.g. via email or Google, if available).

---

## 3. Data Sharing

We do not share any data with third parties. All voting records are stored securely on our server, hosted in Germany (Hetzner Cloud).

---

## 4. Your Rights (GDPR)

If you are an EU resident, you have the right to:

* Request access to data related to your visitorId
* Request deletion of your voting record
* Ask for clarification on how your data is processed

Please note that since we do not track personal identity by default, we may not be able to associate you with a record unless you have logged in.

To make a request, contact: contact@munichweekly.art

---

## 5. Data Deletion and GDPR Compliance

We are fully committed to compliance with the European General Data Protection Regulation (GDPR) and implement the "right to be forgotten" as follows:

### For Non-Registered Users
* Voting data associated with your `visitorId` can be deleted upon request
* No other personal information is stored

### For Registered Users
When you request account deletion, we implement a comprehensive removal process:

1. **Complete Photo Submission Removal**
   * All your photo submissions are permanently deleted from our database
   * All image files are permanently deleted from our cloud storage (Cloudflare R2)
   * All votes associated with your submissions are removed

2. **Voting History Removal**
   * All votes you've cast for other submissions are permanently deleted

3. **Authentication Data Removal**
   * All third-party authentication connections (e.g., Google login) are severed
   * Your login credentials are permanently deleted

4. **Account Deletion**
   * Your user profile and account are completely removed from our system

This multi-step process ensures that no trace of your data remains in our systems after deletion, in compliance with GDPR Article 17.

### Special Process for Selected Photos

For photos that have been **selected for publication** and are featured in our public gallery, we require additional consideration to balance your privacy rights with publication integrity:

* **Editorial Review Process**: Deletion requests for selected photos require editorial review to assess the impact on publication integrity and ensure compliance with GDPR requirements.
* **Contact Process**: When attempting to delete a selected photo through your account dashboard, you will be guided to contact our editorial team at contact@munichweekly.art with your deletion request.
* **Response Time**: We commit to reviewing and responding to selected photo deletion requests within 3-5 business days.
* **Valid Grounds**: Deletion requests are particularly considered when the photo contains personally identifiable information, privacy concerns have arisen, or GDPR Article 17 grounds are clearly established.

### How to Request Deletion

* **For Regular Submissions**: Use the "Manage My Submissions" feature in your account dashboard
* **For Selected Photos**: Click the deletion button in your submissions, which will guide you to send an email request to contact@munichweekly.art
* **For Account Deletion**: Access "Account Settings" and select "Delete Account"
* **For Manual Requests**: Contact us directly at contact@munichweekly.art

All deletion operations are carried out as soon as technically feasible, typically within 72 hours for regular submissions and within 3-5 business days for selected photos requiring editorial review.

---

## 6. Cloud Storage Information

Your photos are stored using Cloudflare R2 cloud storage with the following safeguards:

* All data is stored in EU-based data centers
* Photos are accessible only through authenticated requests
* Encryption is applied to data in transit and at rest
* No third-party analytics or processing is applied to uploaded images
* Automatic deletion of orphaned files through regular audits

We use a specialized Image CDN system to serve optimized versions of your photos, but this system does not collect or store any additional user data.

---

## 7. Contact

If you have any questions about this privacy policy, you can contact us:

**Munich Weekly Team**
Email: contact@munichweekly.art
Location: Munich, Germany

---

## 🔗 Additional Resources

- 🔐 [Technical Security Details](./auth.md) - How we implement privacy-preserving authentication
- 🚀 [Deployment Security](./deployment.md) - Server-side data protection measures
- 📱 [Frontend Implementation](./frontend-overview.md) - Client-side privacy protection
- 🏠 [Back to Project Overview](../README.md)

---

Thank you for participating in Munich Weekly!
