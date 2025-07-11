'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';

/**
 * Privacy Policy Page Component
 * Displays the privacy policy for Munich Weekly based on docs/privacy.md
 */
export default function PrivacyPolicyPage() {
  return (
    <Container variant="narrow" className="py-12" spacing="standard">
      <div className="space-y-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Effective Date: May 2025
          </p>
        </div>
        
        <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
          <p>
            This website (Munich Weekly) is operated as a non-commercial, student-run platform. 
            We are committed to respecting your privacy and ensuring transparent data practices. 
            Below is a summary of how we handle data.
          </p>

          <hr className="my-6" />
          
          <h2 className="text-2xl font-heading font-bold mt-10 mb-4 text-gray-900 dark:text-gray-50">
            1. Use of Cookies
          </h2>
          <p>
            We use a single technical cookie to help enforce the rule of &quot;one vote per person&quot; in our weekly photo voting system. 
            This cookie is:
          </p>
          <ul>
            <li>Named <code>visitorId</code></li>
            <li>A randomly generated identifier (UUID)</li>
            <li>Stored in your browser</li>
            <li>Not linked to your personal identity</li>
          </ul>
          <p>
            We do <strong>not</strong> use cookies for analytics, advertising, or tracking.
          </p>
          <p>
            This cookie is necessary for core functionality (to prevent repeated voting from the same browser) 
            and does not collect any personally identifiable information.
          </p>
          
          <hr className="my-6" />
          
          <h2 className="text-2xl font-heading font-bold mt-10 mb-4 text-gray-900 dark:text-gray-50">
            2. What Data We Collect
          </h2>
          <p>When you vote, we may temporarily store:</p>
          <ul>
            <li>Your <code>visitorId</code> (from the cookie)</li>
            <li>The submission you voted for</li>
            <li>Timestamp of the vote</li>
            <li>(Optionally) Your IP address and browser metadata, only for abuse prevention</li>
          </ul>
          <p>
            We do not collect your name, email, or any other personal identifiers unless you explicitly 
            log in (e.g. via email or Google, if available).
          </p>
          
          <hr className="my-6" />
          
          <h2 className="text-2xl font-heading font-bold mt-10 mb-4 text-gray-900 dark:text-gray-50">
            3. Data Sharing
          </h2>
          <p>
            We do not share any data with third parties. All voting records are stored securely on our server, 
            hosted in Germany (Hetzner Cloud).
          </p>
          
          <hr className="my-6" />
          
          <h2 className="text-2xl font-heading font-bold mt-10 mb-4 text-gray-900 dark:text-gray-50">
            4. Your Rights (GDPR)
          </h2>
          <p>If you are an EU resident, you have the right to:</p>
          <ul>
            <li>Request access to data related to your visitorId</li>
            <li>Request deletion of your voting record</li>
            <li>Ask for clarification on how your data is processed</li>
          </ul>
          <p>
            Please note that since we do not track personal identity by default, we may not be able 
            to associate you with a record unless you have logged in.
          </p>
          <p>
            To make a request, contact: <a href="mailto:contact@munichweekly.art">contact@munichweekly.art</a>
          </p>
          
          <hr className="my-6" />
          
          <h2 className="text-2xl font-heading font-bold mt-10 mb-4 text-gray-900 dark:text-gray-50">
            5. Data Deletion and GDPR Compliance
          </h2>
          <p>
            We are fully committed to compliance with the European General Data Protection Regulation (GDPR) 
            and implement the &quot;right to be forgotten&quot; as follows:
          </p>
          
          <h3 className="text-xl font-heading font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">
            For Non-Registered Users
          </h3>
          <ul>
            <li>Voting data associated with your <code>visitorId</code> can be deleted upon request</li>
            <li>No other personal information is stored</li>
          </ul>
          
          <h3 className="text-xl font-heading font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">
            For Registered Users
          </h3>
          <p>When you request account deletion, we implement a comprehensive removal process:</p>
          
          <ol>
            <li>
              <strong>Complete Photo Submission Removal</strong>
              <ul>
                <li>All your photo submissions are permanently deleted from our database</li>
                <li>All image files are permanently deleted from our cloud storage (Cloudflare R2)</li>
                <li>All votes associated with your submissions are removed</li>
              </ul>
            </li>
            <li>
              <strong>Voting History Removal</strong>
              <ul>
                <li>All votes you&apos;ve cast for other submissions are permanently deleted</li>
              </ul>
            </li>
            <li>
              <strong>Authentication Data Removal</strong>
              <ul>
                <li>All third-party authentication connections (e.g., Google login) are severed</li>
                <li>Your login credentials are permanently deleted</li>
              </ul>
            </li>
            <li>
              <strong>Account Deletion</strong>
              <ul>
                <li>Your user profile and account are completely removed from our system</li>
              </ul>
            </li>
          </ol>
          
          <p>
            This multi-step process ensures that no trace of your data remains in our systems after deletion, 
            in compliance with GDPR Article 17.
          </p>

          <h3 className="text-xl font-heading font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">
            Special Process for Selected Photos
          </h3>
          <p>
            For photos that have been <strong>selected for publication</strong> and are featured in our public gallery, 
            we require additional consideration to balance your privacy rights with publication integrity:
          </p>
          
          <ul>
            <li>
              <strong>Editorial Review Process</strong>: Deletion requests for selected photos require editorial review 
              to assess the impact on publication integrity and ensure compliance with GDPR requirements.
            </li>
            <li>
              <strong>Contact Process</strong>: When attempting to delete a selected photo through your account dashboard, 
              you will be guided to contact our editorial team at <a href="mailto:contact@munichweekly.art">contact@munichweekly.art</a> 
              with your deletion request.
            </li>
            <li>
              <strong>Response Time</strong>: We commit to reviewing and responding to selected photo deletion requests 
              within 3-5 business days.
            </li>
            <li>
              <strong>Valid Grounds</strong>: Deletion requests are particularly considered when:
              <ul>
                <li>The photo contains your personally identifiable information (e.g., recognizable faces)</li>
                <li>Privacy concerns or risks have arisen</li>
                <li>Legal requirements mandate deletion</li>
                <li>GDPR Article 17 grounds are clearly established</li>
              </ul>
            </li>
            <li>
              <strong>Deletion Options</strong>: Depending on the situation, we may:
              <ul>
                <li>Remove the photo completely from all systems</li>
                <li>Remove it from public display while preserving historical records</li>
                <li>Replace it with a placeholder noting &ldquo;Photo removed upon user request&rdquo;</li>
                <li>Request to delay deletion until the end of the current publication period</li>
              </ul>
            </li>
          </ul>
          
          <p>
            This process ensures we fulfill our legal obligations under GDPR Article 17 (&ldquo;Right to Erasure&rdquo;) 
            while maintaining the integrity of our published content and respecting the interests of our community.
          </p>
          
          <h3 className="text-xl font-heading font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">
            How to Request Deletion
          </h3>
          <ul>
            <li><strong>For Regular Submissions</strong>: Use the &ldquo;Manage My Submissions&rdquo; feature in your account dashboard</li>
            <li><strong>For Selected Photos</strong>: Click the deletion button in your submissions, which will guide you to send an email request to <a href="mailto:contact@munichweekly.art">contact@munichweekly.art</a></li>
            <li><strong>For Account Deletion</strong>: Access &ldquo;Account Settings&rdquo; and select &ldquo;Delete Account&rdquo;</li>
            <li><strong>For Manual Requests</strong>: Contact us directly at <a href="mailto:contact@munichweekly.art">contact@munichweekly.art</a></li>
          </ul>
          <p>All deletion operations are carried out as soon as technically feasible, typically within 72 hours for regular submissions and within 3-5 business days for selected photos requiring editorial review.</p>
          
          <hr className="my-6" />
          
          <h2 className="text-2xl font-heading font-bold mt-10 mb-4 text-gray-900 dark:text-gray-50">
            6. Cloud Storage Information
          </h2>
          <p>Your photos are stored using Cloudflare R2 cloud storage with the following safeguards:</p>
          <ul>
            <li>All data is stored in EU-based data centers</li>
            <li>Photos are accessible only through authenticated requests</li>
            <li>Encryption is applied to data in transit and at rest</li>
            <li>No third-party analytics or processing is applied to uploaded images</li>
            <li>Automatic deletion of orphaned files through regular audits</li>
          </ul>
          <p>
            We use a specialized Image CDN system to serve optimized versions of your photos, but this system 
            does not collect or store any additional user data.
          </p>
          
          <hr className="my-6" />
          
          <h2 className="text-2xl font-heading font-bold mt-10 mb-4 text-gray-900 dark:text-gray-50">
            7. Contact
          </h2>
          <p>If you have any questions about this privacy policy, you can contact us:</p>
          <p>
            <strong>Munich Weekly Team</strong><br />
            Email: <a href="mailto:contact@munichweekly.art">contact@munichweekly.art</a><br />
            Location: Munich, Germany
          </p>
          
          <hr className="my-6" />
          
          <p className="text-center">Thank you for participating in Munich Weekly!</p>
        </div>
      </div>
    </Container>
  );
} 