import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import LogoCroped from "../ui/LogoCroped";
import { useI18n } from "../../i18n";
import LocaleSwitcher from "../comum/LocaleSwitcher";

interface BlogHeaderProps {
  scrollPosition: number;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ scrollPosition }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useI18n();
  const location = useLocation();

  useEffect(() => {
    setIsScrolled(scrollPosition > 10);
  }, [scrollPosition]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMenuOpen(false);
    }
  };

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white shadow-lg py-1" 
            : "bg-transparent py-2"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center transition-transform hover:scale-105 duration-300"
            >
              <LogoCroped />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/blog" 
                className={`font-medium transition-all duration-300 hover:text-green-600 ${
                  isActiveLink("/blog") 
                    ? "text-green-600 font-semibold" 
                    : isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Artigos
              </Link>
              
              <Link 
                to="/blog/categorias" 
                className={`font-medium transition-all duration-300 hover:text-green-600 ${
                  isActiveLink("/blog/categorias") 
                    ? "text-green-600 font-semibold" 
                    : isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Categorias
              </Link>
              
              <Link 
                to="/blog/sobre" 
                className={`font-medium transition-all duration-300 hover:text-green-600 ${
                  isActiveLink("/blog/sobre") 
                    ? "text-green-600 font-semibold" 
                    : isScrolled ? "text-gray-700" : "text-white"
                }`}
              >
                Sobre o Blog
              </Link>

              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button
                    variant={isScrolled ? "secondary" : "primary"}
                    className="px-6 py-2 font-medium"
                  >
                    {t('nav.patientArea')}
                  </Button>
                </Link>
                
                <div className={`transition-colors duration-300 ${
                  isScrolled ? "text-gray-700" : "text-white"
                }`}>
                  <LocaleSwitcher compact />
                </div>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className={`md:hidden p-2 rounded-md focus:outline-none transition-colors duration-300 ${
                isScrolled ? "text-gray-700" : "text-white"
              }`}
              onClick={toggleMenu}
            >
              <span className="sr-only">Abrir menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Side Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={handleOverlayClick}
        >
          {/* Side Menu */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <Link 
                to="/" 
                className="flex items-center" 
                onClick={() => setIsMenuOpen(false)}
              >
                <LogoCroped />
              </Link>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-6 space-y-4">
              <Link
                to="/blog"
                className={`flex items-center px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                  isActiveLink("/blog")
                    ? "bg-green-50 text-green-700 border-l-4 border-green-600"
                    : "text-gray-700 hover:text-green-700 hover:bg-green-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12m0-12a2 2 0 012-2h2a2 2 0 012 2m-6 9v2m0-4v2" />
                </svg>
                Artigos
              </Link>

              <Link
                to="/blog/categorias"
                className={`flex items-center px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                  isActiveLink("/blog/categorias")
                    ? "bg-green-50 text-green-700 border-l-4 border-green-600"
                    : "text-gray-700 hover:text-green-700 hover:bg-green-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categorias
              </Link>

              <Link
                to="/blog/sobre"
                className={`flex items-center px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200 ${
                  isActiveLink("/blog/sobre")
                    ? "bg-green-50 text-green-700 border-l-4 border-green-600"
                    : "text-gray-700 hover:text-green-700 hover:bg-green-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sobre o Blog
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogHeader;