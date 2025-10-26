import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Team members data
  const teamMembers = [
    {
      name: 'Sunil suni',
      role: 'Founder & CEO',
      image: 'https://i.pinimg.com/736x/1e/8b/80/1e8b803a298cbf3f5428ce097e59e09d.jpg',
      bio: 'With over 15 years in the fashion industry, Sarah brings her passion for quality footwear to Vercetti.'
    },
    {
      name: 'Achu pp',
      role: 'Head of Design',
      image: 'https://www.sportsmole.co.uk/thumbor/E5m3c2wGEY01yFDOEDk-B6Qr4WE=/640x480/smart/filters:format(webp)/https%3A%2F%2Fsportsmole-media-prod.s3.gra.io.cloud.ovh.net%2F24%2F01%2Fcristiano-ronaldo.jpg',
      bio: 'Achu pp leads our design team with an eye for both aesthetics and functionality.'
    },
    {
      name: 'Anto',
      role: 'Customer Experience',
      image: 'https://media.licdn.com/dms/image/v2/D4D12AQFpcxTz8OVAGQ/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1714646829952?e=2147483647&v=beta&t=maXsItyMNwuHMcJfRZvqNrQ8v9lJ9HdKPsDZPwlPZeY',
      bio: 'Anto ensures that every customer interaction with Vercetti exceeds expectations.'
    }
  ];

  // Values data
  const values = [
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
      title: 'Quality',
      description: 'We never compromise on materials or craftsmanship.'
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: 'Community',
      description: 'Building relationships with our customers and partners.'
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
      title: 'Innovation',
      description: 'Constantly evolving our designs and technology.'
    },
    {
      icon: <Award className="h-8 w-8 text-blue-600" />,
      title: 'Sustainability',
      description: 'Committed to ethical practices and environmental responsibility.'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <img 
            src="https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80" 
            alt="Shoes background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Story</h1>
            <p className="text-xl md:text-2xl font-light mb-8 leading-relaxed">
              Crafting premium footwear with passion and purpose since 2024.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.6 }}
              className="md:w-1/2"
            >
              <img 
                src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1000&q=80" 
                alt="Shoe craftsmanship" 
                className="rounded-lg shadow-xl w-full h-auto"
              />
            </motion.div>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:w-1/2"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Mission</h2>
              <p className="mb-6 text-gray-700 leading-relaxed text-lg">
                Vercetti is a modern e-commerce platform focused on bringing the
                trendiest fashion items to your doorstep. Founded in 2024, our mission
                is to make high-quality, stylish footwear accessible to everyone.
              </p>
              <p className="mb-6 text-gray-700 leading-relaxed text-lg">
                We partner directly with designers and manufacturers to curate unique
                collections, ensuring that every product you find here meets our
                stringent standards for quality and sustainability.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                Our team is dedicated to providing exceptional customer service and a
                seamless shopping experience from browse to delivery.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do at Vercetti.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div 
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate individuals behind Vercetti.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1 text-gray-900">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-6">Join the Vercetti Family</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Thank you for being part of our journey. We're excited to help you find your perfect pair.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/products" 
                className="px-8 py-4 bg-white text-blue-900 rounded-md font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Shop Collection
                <ArrowRight className="ml-2" size={18} />
              </Link>
              <Link 
                to="/contact" 
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
