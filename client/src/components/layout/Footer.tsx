import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-neutral-700 py-4 px-6 mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-neutral-400">© {currentYear} TFXC Trading. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-neutral-400 hover:text-white text-sm">Privacy Policy</a>
          <a href="#" className="text-neutral-400 hover:text-white text-sm">Terms of Service</a>
          <a href="#" className="text-neutral-400 hover:text-white text-sm">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
