import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import LogoCroped from "../ui/LogoCroped";
import { useI18n } from "../../i18n";
import LocaleSwitcher from "../comum/LocaleSwitcher";

interface HeaderProps {
  scrollPosition: number;
}

const Header: React.FC<HeaderProps> = ({ scrollPosition }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    setIsScrolled(scrollPosition > 10);
  }, [scrollPosition]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      setIsMenuOpen(false); // Fecha o menu lateral
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fecha o menu ao clicar fora (no overlay)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md py-1" : "bg-transparent py-2"
        }`}
      >
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <LogoCroped />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
              <button onClick={() => scrollToSection("servicos")} className={`font-medium transition-colors hover:text-green-600 text-gray-700`}>
                {t('nav.services')}
              </button>
              <button onClick={() => scrollToSection("planos")} className={`font-medium transition-colors hover:text-green-600 text-gray-700`}>
                {t('nav.plans')}
              </button>
              <button onClick={() => scrollToSection("sobre")} className={`font-medium transition-colors hover:text-green-600 text-gray-700`}>
                {t('nav.about')}
              </button>
              <Link to="/login">
                <Button
                  variant={isScrolled ? "secondary" : "primary"}
                  className="px-4 py-2"
                >
                  {t('nav.patientArea')}
                </Button>
              </Link>
              <LocaleSwitcher compact className="ml-2" />
            </nav>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className={`md:hidden p-2 rounded-md focus:outline-none text-gray-700`}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open menu</span>
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
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                <LogoCroped />
              </Link>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => scrollToSection("servicos")}
                className="w-full text-left px-4 py-3 text-lg font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('nav.services')}
              </button>

              <button
                onClick={() => scrollToSection("planos")}
                className="w-full text-left px-4 py-3 text-lg font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                {t('nav.plans')}
              </button>

              <button
                onClick={() => scrollToSection("sobre")}
                className="w-full text-left px-4 py-3 text-lg font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('nav.about')}
              </button>

              <Link
                to="/login"
                className="px-4 py-3 text-lg font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors duration-200 flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('nav.patientArea')}
              </Link>
              <div className="pt-2 px-4">
                <LocaleSwitcher className="w-full" />
              </div>
            </div>

            {/* Additional Info (opcional) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
              <div className="text-center text-sm text-gray-600 space-y-1">
                <p>{t('nav.help')}</p>
                <button onClick={() => window.location.href = "https://wa.me/+5581986653214"} className="border-0 p-0 text-green-600 hover:scale-105 transition-transform duration-200">
                  (81) 98665-3214
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;