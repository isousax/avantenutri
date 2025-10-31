import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import LogoCroped from "../ui/LogoCroped";
import { useI18n } from "../../i18n/utils";
import LocaleSwitcher from "../comum/LocaleSwitcher";
import { Book, Menu, X, Heart, Users, User } from "lucide-react";

interface HeaderProps {
  scrollPosition: number;
}

const Header: React.FC<HeaderProps> = ({ scrollPosition }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    setIsScrolled(scrollPosition > 20);
  }, [scrollPosition]);

  // Fecha o menu quando a rota muda
  useEffect(() => {
    setIsMenuOpen(false);
  }, [navigate]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      setIsMenuOpen(false);
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

  // Fecha o menu ao clicar em um link
  const handleMenuClick = () => {
    setIsMenuOpen(false);
  };

  // Previne o scroll do body quando o menu está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <>
      {!isMenuOpen && (
        <header
          className={`fixed w-full z-50 transition-all duration-500 ${
            isScrolled 
              ? "bg-white/95 backdrop-blur-xl shadow-lg py-1" 
              : "bg-transparent py-3"
          }`}
          style={{
            color: isScrolled ? undefined : '#222',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <Link 
                to="/" 
                className="flex items-center group"
                onClick={handleMenuClick}
              >
                <LogoCroped />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                <button
                  onClick={() => scrollToSection("servicos")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    isScrolled 
                      ? "text-gray-700 hover:text-green-600 hover:bg-green-50" 
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  {t("nav.services")}
                </button>
                
                <button
                  onClick={() => scrollToSection("sobre")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    isScrolled 
                      ? "text-gray-700 hover:text-green-600 hover:bg-green-50" 
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {t("nav.about")}
                </button>
                
                <button
                  onClick={() => navigate("/blog")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    isScrolled 
                      ? "text-gray-700 hover:text-green-600 hover:bg-green-50" 
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                >
                  <Book className="w-4 h-4" />
                  Blog
                </button>

                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  <LocaleSwitcher 
                    compact 
                  />                
                  <Link to="/login">
                    <Button
                      className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                        isScrolled 
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25" 
                          : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      {t("nav.patientArea")}
                    </Button>
                  </Link>
                </div>
              </nav>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
                  isScrolled
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
                onClick={toggleMenu}
              >
                <span className="sr-only">Abrir menu</span>
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Navigation Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ${
          isMenuOpen
            ? "bg-black/50 backdrop-blur-sm opacity-100"
            : "bg-black/0 backdrop-blur-0 opacity-0 pointer-events-none"
        }`}
        onClick={toggleMenu}
      >
        {/* Side Menu */}
        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-100 transform transition-transform duration-500 ease-out flex flex-col ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link
              to="/"
              className="flex items-center group"
              onClick={handleMenuClick}
            >
              <LogoCroped />
            </Link>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu Items (scrollable) */}
          <div className="p-6 space-y-2 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <button
              onClick={() => scrollToSection("servicos")}
              className="w-full text-left px-4 py-4 text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 group"
            >
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Heart className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{t("nav.services")}</div>
                <div className="text-xs text-gray-500 mt-0.5">Nossos serviços especializados</div>
              </div>
            </button>

            <button
              onClick={() => scrollToSection("sobre")}
              className="w-full text-left px-4 py-4 text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{t("nav.about")}</div>
                <div className="text-xs text-gray-500 mt-0.5">Conheça nossa equipe</div>
              </div>
            </button>

            <button
              onClick={() => navigate("/blog")}
              className="w-full text-left px-4 py-4 text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 group"
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Book className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Blog</div>
                <div className="text-xs text-gray-500 mt-0.5">Artigos e dicas de nutrição</div>
              </div>
            </button>

            <div className="pt-4">
              <Link
                to="/login"
                className="w-full text-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
                onClick={handleMenuClick}
              >
                <User className="w-4 h-4" />
                {t("nav.patientArea")}
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="px-2">
                <LocaleSwitcher className="w-full" />
              </div>
            </div>
          </div>

          {/* Footer com informações de contato (fixo no rodapé) */}
          <div className="shrink-0 p-6 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
            <div className="text-center space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Precisa de ajuda?</p>
              </div>
              <button
                onClick={() => {
                  handleMenuClick();
                  window.location.href = "https://wa.me/+5581986653214";
                }}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.248-6.189-3.515-8.453"/>
                </svg>
                Falar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;