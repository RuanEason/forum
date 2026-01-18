// components/Footer.tsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-gray-200 bg-white text-center">
      <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
        {/* 备案号部分 - 必须指向工信部官网 */}
        <div className="flex items-center gap-2 hover:text-gray-800 transition-colors">
          {/* 这里是个小绿盾或者单纯文字都可以，一般文字即可 */}
          <a 
            href="https://beian.miit.gov.cn/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            粤ICP备2026001465号
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;