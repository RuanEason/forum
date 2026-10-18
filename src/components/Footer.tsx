// components/Footer.tsx
import React from 'react';

const Footer = () => {
  const footerClassName = "w-full py-6 mt-auto border-t border-gray-200 bg-white text-center";
  const contentClassName = "flex flex-col items-center justify-center gap-2 text-sm text-gray-500";

  return (
    <footer className={footerClassName}>
      <div className={contentClassName}>
        {/*
          备案号部分 —— 暂时注释掉。
          当前域名尚未备案，等新备案下来后，把下面的注释打开并替换成新的备案号即可。
          注意：备案号必须指向工信部官网 https://beian.miit.gov.cn/

          <div className="flex items-center gap-2 hover:text-gray-800 transition-colors">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
            >
              粤ICP备2026001465号
            </a>
          </div>
        */}
      </div>
    </footer>
  );
};

export default Footer;
