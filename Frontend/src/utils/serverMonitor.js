// src/utils/serverMonitor.js
import { checkServerStatus } from './authUtils';
import toast from 'react-hot-toast';

/**
 * Classe pour surveiller la disponibilité du serveur
 */
class ServerMonitor {
  constructor() {
    this.isServerAvailable = true;
    this.listeners = [];
    this.checkInterval = null;
    this.reconnectTimeout = null;
    this.checkIntervalDuration = 30000; // 30 secondes par défaut
    this.reconnectTimeoutDuration = 5000; // 5 secondes par défaut
    this.shouldNotify = true;
  }

  /**
   * Ajouter un écouteur d'événement
   * @param {Function} listener - Fonction à appeler quand l'état du serveur change
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Supprimer un écouteur d'événement
   * @param {Function} listener - Fonction à supprimer
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifier tous les écouteurs d'un changement d'état
   * @param {boolean} status - Nouvel état du serveur
   */
  notifyListeners(status) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Erreur dans un écouteur de ServerMonitor:', error);
      }
    });
  }

  /**
   * Vérifier la disponibilité du serveur
   * @param {boolean} silent - Ne pas afficher de notification
   * @returns {Promise<boolean>} État du serveur
   */
  async checkServer(silent = false) {
    try {
      const status = await checkServerStatus();
      
      // Si l'état a changé
      if (status !== this.isServerAvailable) {
        this.isServerAvailable = status;
        
        // Notification toast si nécessaire
        if (this.shouldNotify && !silent) {
          if (status) {
            toast.success('Connexion au serveur rétablie!');
          } else {
            toast.error('Connexion au serveur perdue. Tentative de reconnexion automatique...');
          }
        }
        
        // Notifier les écouteurs
        this.notifyListeners(status);
        
        // Si le serveur est à nouveau disponible, arrêter la tentative de reconnexion
        if (status && this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        
        // Si le serveur n'est plus disponible, planifier une reconnexion
        if (!status && !this.reconnectTimeout) {
          this.scheduleReconnect();
        }
      }
      
      return status;
    } catch (error) {
      console.error('Erreur lors de la vérification du serveur:', error);
      return false;
    }
  }

  /**
   * Planifier une tentative de reconnexion
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(async () => {
      const status = await this.checkServer(false); // Vérifier avec notification
      
      if (!status) {
        // Si toujours pas de connexion, réessayer
        this.scheduleReconnect();
      }
    }, this.reconnectTimeoutDuration);
  }

  /**
   * Démarrer la surveillance
   * @param {number} interval - Intervalle de vérification en ms
   * @param {boolean} shouldNotify - Afficher des notifications
   */
  startMonitoring(interval = 30000, shouldNotify = true) {
    this.checkIntervalDuration = interval;
    this.shouldNotify = shouldNotify;
    
    // Vérifier immédiatement
    this.checkServer(true);
    
    // Configurer la vérification périodique
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => {
      this.checkServer(true); // Vérification silencieuse
    }, this.checkIntervalDuration);
  }

  /**
   * Arrêter la surveillance
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// Créer une instance singleton
const serverMonitor = new ServerMonitor();

export default serverMonitor;