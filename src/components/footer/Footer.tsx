import { FaFacebookF } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa";
import Fevicon from "../../assets/images/png/fevicon.png";

function Footer() {
  return (
    <footer className="w-full rounded-tl-3xl rounded-tr-3xl">
      <div className="w-full bg-[#ffffff] text-white py-6 flex flex-col items-center justify-center text-center rounded-tl-3xl rounded-tr-3xl gap-3">
        <div className="w-full px-4 flex flex-col md:flex-row items-center justify-center">
          <div className="flex space-x-4 items-center mb-4 md:mb-0">
            <a
              href="https://www.mguru.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-[40px] w-[40px] text-white hover:text-red-600 transition-colors rounded-full p-2 mb-3"
            >
              <img src={Fevicon} alt="website" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61560348459686"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-600 transition-colors rounded-full p-2 bg-[#3b5998] hover:bg-[#3b5998]/90"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://www.linkedin.com/in/m-guru-innovation-hub-9236b9311/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-700 transition-colors rounded-full p-2 bg-[#0077b5] hover:bg-[#0077b5]/90"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://x.com/m_guru_edu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-400 transition-colors rounded-full p-2 bg-[#1da1f2] hover:bg-[#1da1f2]/90"
            >
              <FaTwitter />
            </a>
            <a
              href="https://www.instagram.com/m_guruedu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-pink-500 transition-colors rounded-full p-2 bg-[#e1306c] hover:bg-[#e1306c]/90"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

        <p className="text-[#000000] text-lg font-400">
          By using this website, you consent to the use of cookies to enhance
          your browsing experience and provide better services.
        </p>

        <p className="text-gray-500 font-medium  text-lg">
          Copyright © 2025 Velava Foundation. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
