import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";

interface HeaderProps {
  scrollPosition: number;
}

const Header: React.FC<HeaderProps> = ({ scrollPosition }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsScrolled(scrollPosition > 10);
  }, [scrollPosition]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      setIsMenuOpen(false); // Fecha o menu mobile se estiver aberto
      const offset = 80; // Ajuste para o header fixo
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md py-1" : "bg-transparent py-2"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center">
              <img
                src="/logocroped.png"
                alt="Nutricionista em consulta"
                className="relative rounded-lg w-32 sm:w-40 transform hover:scale-105 transition-transform duration-700"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            <button
              onClick={() => scrollToSection('servicos')}
              className={`font-medium transition-colors hover:text-green-600 text-gray-700`}
            >
              Serviços
            </button>
            <button
              onClick={() => scrollToSection('planos')}
              className={`font-medium transition-colors hover:text-green-600 text-gray-700`}
            >
              Planos
            </button>
            <button
              onClick={() => scrollToSection('sobre')}
              className={`font-medium transition-colors hover:text-green-600 text-gray-700`}
            >
              Sobre
            </button>
            <Link to="/login">
              <Button
                variant={isScrolled ? "secondary" : "primary"}
                className="px-4 py-2"
              >
                Área do Paciente
              </Button>
            </Link>
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg rounded-b-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <button
              onClick={() => scrollToSection('servicos')}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md"
            >
              Serviços
            </button>
            <button
              onClick={() => scrollToSection('planos')}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md"
            >
              Planos
            </button>
            <button
              onClick={() => scrollToSection('sobre')}
              className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md"
            >
              Sobre
            </button>
            <Link
              to="/login"
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Área do Paciente
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
