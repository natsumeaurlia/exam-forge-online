
import React from 'react';

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <p className="mb-8">Please fill out the form below to get in touch with us.</p>
      
      <form className="max-w-md">
        <div className="mb-4">
          <label htmlFor="name" className="block mb-2 text-sm font-medium">Name</label>
          <input 
            type="text" 
            id="name" 
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Your name" 
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-sm font-medium">Email</label>
          <input 
            type="email" 
            id="email" 
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="your.email@example.com" 
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="message" className="block mb-2 text-sm font-medium">Message</label>
          <textarea 
            id="message" 
            rows={5} 
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="How can we help you?" 
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          className="bg-examforge-blue hover:bg-examforge-blue-dark text-white font-medium py-2 px-4 rounded"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
