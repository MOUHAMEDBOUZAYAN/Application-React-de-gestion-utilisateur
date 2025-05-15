// layouts/DashboardLayout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [userRole, setUserRole] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Vérifier le rôle de l'utilisateur et le stocker dans un état local
  useEffect(() => {
    if (user && user.role) {
      setUserRole(user.role);
      console.log('Rôle de l\'utilisateur dans DashboardLayout:', user.role);
    }
  }, [user]);

  // Gérer la déconnexion
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fonction correcte pour vérifier si l'utilisateur est administrateur
  const isAdmin = () => {
    return userRole === 'admin';
  };

  // Rediriger vers le dashboard approprié en fonction du rôle
  const navigateToDashboard = () => {
    if (isAdmin()) {
      navigate('/admin/dashboard');
    } else {
      navigate('/user/dashboard');
    }
  };

  // Si l'utilisateur n'est pas authentifié, le rediriger vers la page de connexion
  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Désactiver le défilement lorsque le sidebar mobile est ouvert
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* Sidebar Desktop */}
      <motion.div
        className="hidden md:block w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <SidebarContent 
          user={user} 
          isAdmin={isAdmin} 
          navigateToDashboard={navigateToDashboard} 
          handleLogout={handleLogout} 
          navigate={navigate}
        />
      </motion.div>

      {/* Overlay pour sidebar mobile */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            className="md:hidden fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white dark:bg-gray-800 shadow-xl z-50"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20 }}
          >
            <SidebarContent 
              user={user} 
              isAdmin={isAdmin} 
              navigateToDashboard={navigateToDashboard} 
              handleLogout={handleLogout}
              navigate={navigate}
              onLinkClick={() => setIsMobileSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Entête */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="py-4 px-4 flex items-center justify-between">
            {/* Bouton menu mobile */}
            <button
              className="md:hidden text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {isAdmin() ? 'Tableau de bord Administrateur' : 'Tableau de bord Utilisateur'}
            </h1>

            {/* Profil utilisateur */}
            <div className="flex items-center">
              <div className="relative">
                <button className="flex items-center focus:outline-none group">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-300 font-semibold text-lg group-hover:ring-2 group-hover:ring-primary-500 transition-all">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="ml-2 text-gray-700 dark:text-gray-300 hidden sm:block">
                    {user?.name || 'Utilisateur'} 
                    {userRole && <span className="ml-1 text-xs text-gray-500">({userRole})</span>}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Composant séparé pour le contenu de la sidebar
const SidebarContent = ({ user, isAdmin, navigateToDashboard, handleLogout, navigate, onLinkClick = () => {} }) => {
  return (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => {
            navigateToDashboard();
            onLinkClick();
          }}
        >
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              {isAdmin() ? 'AdminPanel' : 'UserPanel'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Système d'authentification
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          MENU PRINCIPAL
        </p>

        <ul className="space-y-1">
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                navigateToDashboard();
                onLinkClick();
              }}
            >
              <svg className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Tableau de bord</span>
            </a>
          </li>

          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                navigate('/profile');
                onLinkClick();
              }}
            >
              <svg className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profil</span>
            </a>
          </li>

          {isAdmin() && (
            <>
              <li>
                <a
                  href="#"
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/admin/users');
                    onLinkClick();
                  }}
                >
                  <svg className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Gestion des utilisateurs</span>
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/admin/settings');
                    onLinkClick();
                  }}
                >
                  <svg className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Paramètres système</span>
                </a>
              </li>
            </>
          )}
        </ul>

        <p className="px-4 mt-8 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          COMPTE
        </p>

        <ul className="space-y-1">
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
                onLinkClick();
              }}
            >
              <svg className="h-5 w-5 mr-3 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Déconnexion</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Informations utilisateur (en bas de la sidebar) */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-300 font-semibold text-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="ml-3 truncate">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.name || 'Utilisateur'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || 'utilisateur@exemple.com'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;