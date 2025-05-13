import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from './hooks/useAuth';

// Routes protégées pour les utilisateurs authentifiés
export const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();
  
  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Rediriger vers la page de connexion si non connecté
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

// Routes protégées pour les administrateurs
export const AdminRoute = () => {
  const { currentUser, loading } = useAuth();
  
  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Rediriger si non connecté ou non admin
  return currentUser && currentUser.role === 'admin' ? (
    <Outlet />
  ) : (
    <Navigate to="/" />
  );
};

// Routes accessibles uniquement si NON authentifié
export const PublicOnlyRoute = () => {
  const { currentUser, loading } = useAuth();
  
  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Rediriger vers la page d'accueil si déjà connecté
  return !currentUser ? <Outlet /> : <Navigate to="/" />;
};