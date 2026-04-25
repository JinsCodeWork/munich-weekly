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

We use a single technical cookie named `visitorId` for anonymous weekly voting: it ties votes to a browser and is **not** a logged-in user session. The cookie is:

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

We do not collect your name, email, or any other personal identifiers unless you explicitly log in (e.g. via email or Google, if available), create an account, or choose to provide optional contact details with an anonymous submission.

When you submit a photo, we may store:

* The uploaded photo file and optimized display versions
* Your photo description and submission timestamp
* Your user account ID, if you submit while logged in
* An internal `users` row (anonymous-submission type) and related submission `userId`, if you submit without logging in, so the database can keep a normal `submission → user` link
* Your optional `contactEmail`, only if you provide it; stored on the submission for **admin** contact only, never shown on public pages or the public gallery

Anonymous submission accounts are marked accordingly: they **cannot** be used to sign in, reset a password, or list past submissions. The anonymous submitter cannot view or manage that photo in the app after it is sent.

---

## 3. Data Sharing

We do not sell personal data and we do not use third-party advertising or analytics. Voting records are stored securely on our server, hosted in Germany (Hetzner Cloud).

For technical operation, uploaded images may be stored and served through Cloudflare R2 and our image delivery system. Anonymous submissions also use Cloudflare Turnstile to verify that the submission is made by a human; CAPTCHA tokens are used only for verification and are not used for advertising or tracking.

---

## 4. Photo Publication and Copyright

You retain the copyright to photos you submit. By submitting a photo to Munich Weekly, you grant us a non-exclusive, royalty-free permission to review, display, publish, and promote the submitted photo as part of Munich Weekly's non-commercial community project.

This permission includes:

* Displaying the photo on the Munich Weekly website and public gallery
* Featuring selected photos in Munich Weekly editorial or community posts
* Sharing selected photos on Munich Weekly's official social media channels with attribution where available

Munich Weekly will not sell your submitted photos, sublicense them to third parties for their commercial use, or use them in paid advertising unless we obtain **separate** permission for that use. (Normal community display on this site and on Munich Weekly’s official non-commercial social posts is covered in the grant above, not in “paid ads” or third-party commercial licensing.)

If you submit anonymously, public attribution may be shown as "Anonymous". If you provide a contact email, it will not be published as attribution unless you explicitly ask us to do so.

---

## 5. Your Rights (GDPR)

If you are an EU resident, you have the right to:

* Request access to data related to your visitorId
* Request deletion of your voting record
* Request deletion of submitted photos and optional contact details where applicable
* Ask for clarification on how your data is processed

Please note that since we do not track personal identity by default, we may not be able to associate you with a record unless you have logged in or provided a contact email with an anonymous submission.

To make a request, contact: contact@munichweekly.art

---

## 6. Data Deletion and GDPR Compliance

We are fully committed to compliance with the European General Data Protection Regulation (GDPR) and implement the "right to be forgotten" as follows:

### For Non-Registered Users and Anonymous Submissions
* Voting data associated with your `visitorId` can be deleted upon request
* Anonymous submission contact emails can be deleted upon request where we can identify the submission
* Anonymous submitters cannot view a submission history because no login account is created

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
* **For Anonymous Submissions**: Contact us directly and include enough information to identify the submission, such as the optional contact email, submission date, issue, or description
* **For Selected Photos**: Click the deletion button in your submissions, which will guide you to send an email request to contact@munichweekly.art
* **For Account Deletion**: Access "Account Settings" and select "Delete Account"
* **For Manual Requests**: Contact us directly at contact@munichweekly.art

All deletion operations are carried out as soon as technically feasible, typically within 72 hours for regular submissions and within 3-5 business days for selected photos requiring editorial review.

---

## 7. Cloud Storage Information

Your photos are stored using Cloudflare R2 cloud storage with the following safeguards:

* All data is stored in EU-based data centers
* Photos are accessible only through authenticated requests
* Encryption is applied to data in transit and at rest
* No third-party analytics or processing is applied to uploaded images
* Automatic deletion of orphaned files through regular audits

We use a specialized Image CDN system to serve optimized versions of your photos, but this system does not collect or store any additional user data.

---

## 8. Contact

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
