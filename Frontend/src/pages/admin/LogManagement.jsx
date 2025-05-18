// src/pages/admin/LogManagement.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { logService } from '../../services/api';
import toast from 'react-hot-toast';

const LogManagement = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    startDate: '',
    endDate: ''
  });

  // Récupérer les logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Créer les filtres à partir de l'état
      const queryFilters = {};
      
      if (filters.action) {
        queryFilters.action = filters.action;
      }
      
      if (filters.user) {
        queryFilters.user = filters.user;
      }
      
      if (filters.startDate) {
        queryFilters.startDate = filters.startDate;
      }
      
      if (filters.endDate) {
        queryFilters.endDate = filters.endDate;
      }
      
      const response = await logService.getLogs(page, 20, queryFilters);
      
      setLogs(response.data);
      setTotalPages(Math.ceil(response.count / 20));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
      setError('Une erreur est survenue lors du chargement des logs.');
      setLoading(false);
    }
  };

  // Charger les logs au montage et lorsque les filtres ou la page changent
  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  // Gérer le changement de page
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Gérer les changements de filtre
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1); // Revenir à la première page lors d'un changement de filtre
  };

  // Gérer la soumission du formulaire de filtre
  const handleSubmitFilters = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({
      action: '',
      user: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Obtenir la classe de couleur en fonction du type d'action
  const getActionColor = (action) => {
    const actionColors = {
      login: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      logout: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      register: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      reset_password: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      login_failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      account_locked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      verify_email: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      verify_phone: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      update_profile: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      admin_action: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    };
    
    return actionColors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Journaux d'activité
        </h2>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtres</h3>
          
          <form onSubmit={handleSubmitFilters} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre par action */}
              <div>
                <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type d'action
                </label>
                <select
                  id="action"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Toutes les actions</option>
                  <option value="login">Connexion</option>
                  <option value="logout">Déconnexion</option>
                  <option value="register">Inscription</option>
                  <option value="login_failed">Échec de connexion</option>
                  <option value="reset_password">Réinitialisation de mot de passe</option>
                  <option value="update_profile">Mise à jour du profil</option>
                  <option value="verify_email">Vérification d'email</option>
                  <option value="verify_phone">Vérification de téléphone</option>
                  <option value="admin_action">Action administrateur</option>
                </select>
              </div>

              {/* Filtre par utilisateur */}
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID utilisateur
                </label>
                <input
                  type="text"
                  id="user"
                  name="user"
                  value={filters.user}
                  onChange={handleFilterChange}
                  placeholder="ID utilisateur"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Filtre par date de début */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Filtre par date de fin */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                Filtrer
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={() => fetchLogs()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {log.user ? (
                          <div>
                            {log.user.name || 'Utilisateur supprimé'}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {log.user.email || log.user}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">Non authentifié</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {log.description || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {log.ip || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucun log trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {logs.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-medium">{page}</span> sur <span className="font-medium">{totalPages}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default LogManagement;