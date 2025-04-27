import React from 'react';

function ContactPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="mb-6">We would love to hear from you! Please reach out to us using the information below:</p>
      <ul className="list-disc pl-5">
        <li>Email: <a className="text-blue-500" href="mailto:support@keyshade.xyz">support@keyshade.xyz</a></li>
        <li>Phone: +1-800-123-4567</li>
        <li>Address: 123 Keyshade Lane, Tech City, TC 12345</li>
      </ul>
    </div>
  );
}

export default ContactPage;