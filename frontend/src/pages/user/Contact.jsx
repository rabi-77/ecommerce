import React from 'react';

const Contact = () => {
  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Get in Touch</h1>

      <div className="space-y-6 text-gray-800 leading-relaxed">
        <p>
          We love hearing from our customers. Reach out via any of the channels
          below and our support team will respond within one business day.
        </p>

        <div>
          <h2 className="text-xl font-semibold mb-2">Customer Support</h2>
          <p>Email: <a href="mailto:support@vercetti.com" className="text-blue-600 underline">support@vercetti.com</a></p>
          <p>Phone: <a href="tel:+1800123456" className="text-blue-600 underline">+91&nbsp;800&nbsp;123&nbsp;4565</a></p>
          <p>Hours: Monday&nbsp;–&nbsp;Friday, 9&nbsp;AM&nbsp;–&nbsp;6&nbsp;PM&nbsp;(PST)</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Head Office</h2>
          <p>Vercetti Inc.</p>
          <p>Frag Street</p>
          <p>CALICUT, Kerala&nbsp;670001</p>
          <p>India</p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
