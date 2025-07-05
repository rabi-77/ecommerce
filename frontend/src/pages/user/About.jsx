import React from 'react';

const About = () => {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">About Vercetti</h1>
      <p className="mb-4 text-gray-700 leading-relaxed">
        Vercetti is a modern e-commerce platform focused on bringing the
        trendiest fashion items to your doorstep. Founded in 2024, our mission
        is to make high-quality, stylish apparel accessible to everyone.
      </p>
      <p className="mb-4 text-gray-700 leading-relaxed">
        We partner directly with designers and manufacturers to curate unique
        collections, ensuring that every product you find here meets our
        stringent standards for quality and sustainability.
      </p>
      <p className="text-gray-700 leading-relaxed">
        Thank you for being part of our journey. If you have any questions,
        please don’t hesitate to <a href="/contact" className="text-blue-600 underline">contact us</a>.
      </p>
    </section>
  );
};

export default About;
