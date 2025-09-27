
  import React, { useState, useEffect } from 'react';
import './App.css';

// Configuration de l'API backend
const API_BASE_URL = null; //Désactivé backend
 
function App() {
  // TOUS LES ÉTATS
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractContent, setContractContent] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState('');
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    clientId: null,
    paymentNumber: null,
    amount: 0
  });
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [needsBackup, setNeedsBackup] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [interventions, setInterventions] = useState([]);
  const [notificationsHistory, setNotificationsHistory] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [selectedStreets, setSelectedStreets] = useState([]);
  const [bulkNotificationType, setBulkNotificationType] = useState('enroute');
  const [bulkCustomMessage, setBulkCustomMessage] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isLocationShared, setIsLocationShared] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [streetSearchTerm, setStreetSearchTerm] = useState('');
  const [clientNameSearch, setClientNameSearch] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [showClientList, setShowClientList] = useState(false);
  const [selectedSector, setSelectedSector] = useState('');
  const [interventionClientSearch, setInterventionClientSearch] = useState('');
  const [showInterventionClientSuggestions, setShowInterventionClientSuggestions] = useState(false);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [autoTrackingInterval, setAutoTrackingInterval] = useState(null);
const [showInstallPrompt, setShowInstallPrompt] = useState(false);
const [installPromptEvent, setInstallPromptEvent] = useState(null);
const [isInstalled, setIsInstalled] = useState(false);

  // États pour la recherche avancée
  const [clientSearchFilters, setClientSearchFilters] = useState({
    searchTerm: '',
    type: '',
    paymentStatus: '',
    streetName: ''
  });

  const [contractSearchFilters, setContractSearchFilters] = useState({
    searchTerm: '',
    type: '',
    status: '',
    year: ''
  });

  // FORMULAIRES
  const [clientForm, setClientForm] = useState({
    name: '', phone: '', email: '', type: '', address: '',
    paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
    firstPaymentMethod: '', secondPaymentMethod: ''
  });

  const [editClientForm, setEditClientForm] = useState({
    name: '', phone: '', email: '', type: '', address: '',
    paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
    firstPaymentMethod: '', secondPaymentMethod: ''
  });

  const [contractForm, setContractForm] = useState({
    clientId: '', type: '', startDate: '', endDate: '',
    amount: '', status: 'actif', notes: ''
  });

  const [editContractForm, setEditContractForm] = useState({
    clientId: '', type: '', startDate: '', endDate: '',
    amount: '', status: 'actif', notes: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '', amount: '', date: '', type: '', description: ''
  });

  const [stakesForm, setStakesForm] = useState({
    clientId: '', date: '', quantity: ''
  });

  const [objectiveForm, setObjectiveForm] = useState({
    year: new Date().getFullYear(),
    revenueTarget: '', expenseLimit: ''
  });

  const [interventionForm, setInterventionForm] = useState({
    clientId: '', datePrevu: '', heureDebut: '08:00', heureFin: '09:00',
    equipe: 'Équipe 1', typeService: 'deneigement', notes: ''
  });

  useEffect(() => {
    const handleOnline = () => { 
      setIsOnline(true); 
      syncData(); 
      checkBackendConnection();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Vérification périodique du backend
    const backendInterval = setInterval(checkBackendConnection, 60000); // Toutes les minutes
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(backendInterval);
    };
  }, []);

useEffect(() => {
  // Gérer l'événement beforeinstallprompt pour les PWA
  const handleBeforeInstallPrompt = (e) => {
    console.log('beforeinstallprompt event fired');
    e.preventDefault();
    setInstallPromptEvent(e);
    setShowInstallPrompt(true);
  };

  // Écouter l'événement
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}, []);
  // INITIALISATION MODIFIÉE (SANS ELECTRON)
  useEffect(() => {
    const loadData = async () => {
      console.log('=== DÉMARRAGE APP WEB ===');
      
      const clientsData = loadFromStorage('clients');
      const contractsData = loadFromStorage('contracts');
      const invoicesData = loadFromStorage('invoices');
      const stakesData = loadFromStorage('stakes');
      const objectivesData = loadFromStorage('objectives');
      const paymentsData = loadFromStorage('payments');
      const interventionsData = loadFromStorage('interventions');
      const notificationsData = loadFromStorage('notificationsHistory');
      
      setClients(clientsData);
      setContracts(contractsData);
      setInvoices(invoicesData);
      setStakes(stakesData);
      setObjectives(objectivesData);
      setPayments(paymentsData);
      setInterventions(interventionsData);
      setNotificationsHistory(notificationsData);
      
      const lastSyncStored = localStorage.getItem('lastSync');
      setLastSync(lastSyncStored || 'Jamais');
      
      await checkBackendConnection();
      
      setTimeout(() => { 
        archiveOldContracts();
      }, 1000);
    };
    
    loadData();
  }, []);
  // 3. Fonction pour installer l'app
const handleInstallClick = async () => {
  if (installPromptEvent) {
    installPromptEvent.prompt();
    const choiceResult = await installPromptEvent.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setInstallPromptEvent(null);
    setShowInstallPrompt(false);
  }
};


  // FONCTIONS DE STOCKAGE LOCALES
  const loadFromStorage = (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erreur loadFromStorage:', error);
      return defaultValue;
    }
  };
 const saveToStorage = async (key, data, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log('=== SAUVEGARDE WEB ===');
        console.log('Clé:', key, 'Data length:', Array.isArray(data) ? data.length : 'non-array');
        
        // Sauvegarde locale
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem('lastModified', new Date().toISOString());
        
        // Tentative de synchronisation avec le backend
        try {
          await syncWithBackend(key, data);
          setNeedsBackup(false);
        } catch (backendError) {
          console.log('Backend sync échoué, données sauvées localement');
          setNeedsBackup(true);
        }
        
        return;
      } catch (error) {
        console.error('Erreur de sauvegarde:', error);
        if (i === maxRetries - 1) {
          alert('Erreur critique de sauvegarde.');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
  };

  // VÉRIFICATION CONNEXION BACKEND AVEC DEBUG
  const checkBackendConnection = async () => {
    try {
      console.log('=== TEST CONNEXION BACKEND ===');
      console.log('URL testée:', `${API_BASE_URL}/api/test`);
      
      const response = await fetch(`${API_BASE_URL}/api/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('Statut réponse:', response.status);
      console.log('Response OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données reçues:', data);
        setBackendConnected(data.success || true);
        return data.success || true;
      } else {
        console.error('Backend non disponible:', response.status);
        setBackendConnected(false);
        return false;
      }
    } catch (error) {
      console.error('Erreur connexion backend:', error.message);
      setBackendConnected(false);
      return false;
    }
  };
  //Fonction extractStreetName manquante (déjà dans votre code mais peut-être mal placée)
const extractStreetName = (address) => {
  if (!address || typeof address !== 'string') return 'Adresses non définies';
  
  try {
    // Nettoyer l'adresse
    const cleanAddress = address.trim();
    
    // Séparer par virgule pour isoler la partie rue
    const parts = cleanAddress.split(',');
    if (parts.length === 0) return 'Adresses non définies';
    
    // Prendre la première partie (généralement numéro + rue)
    let streetPart = parts[0].trim();
    
    // Enlever le numéro de rue au début (supporter différents formats)
    streetPart = streetPart.replace(/^(\d+\s*[-\/\s]?\s*[a-zA-Z]?\s*)/i, '').trim();
    
    // Si il ne reste rien après suppression du numéro, garder l'original
    if (!streetPart) {
      streetPart = parts[0].trim();
    }
    
    // Normaliser les types de rues communes
    streetPart = streetPart
      .replace(/^(rue\s+)/gi, 'Rue ')
      .replace(/^(r\.\s+)/gi, 'Rue ')
      .replace(/^(av\.?\s+)/gi, 'Avenue ')
      .replace(/^(avenue\s+)/gi, 'Avenue ')
      .replace(/^(boul\.?\s+)/gi, 'Boulevard ')
      .replace(/^(boulevard\s+)/gi, 'Boulevard ')
      .replace(/^(blvd\.?\s+)/gi, 'Boulevard ')
      .replace(/^(chemin\s+)/gi, 'Chemin ')
      .replace(/^(ch\.?\s+)/gi, 'Chemin ')
      .replace(/^(route\s+)/gi, 'Route ')
      .replace(/^(rte\.?\s+)/gi, 'Route ')
      .replace(/^(place\s+)/gi, 'Place ')
      .replace(/^(pl\.?\s+)/gi, 'Place ')
      .replace(/^(rang\s+)/gi, 'Rang ')
      .replace(/^(montée\s+)/gi, 'Montée ')
      .replace(/^(impasse\s+)/gi, 'Impasse ')
      .replace(/^(allée\s+)/gi, 'Allée ')
      .replace(/^(croissant\s+)/gi, 'Croissant ')
      .replace(/^(cres\.?\s+)/gi, 'Croissant ')
      .replace(/^(terrasse\s+)/gi, 'Terrasse ');
    
    // Nettoyer les espaces multiples
    streetPart = streetPart.replace(/\s+/g, ' ').trim();
    
    // Capitaliser correctement
    streetPart = streetPart.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return streetPart || 'Adresses non définies';
    
  } catch (error) {
    console.error('Erreur extraction rue pour:', address, error);
    return 'Adresses non définies';
  }
};

// Fonction de groupement améliorée
const groupClientsByStreet = (clients) => {
  if (!Array.isArray(clients) || clients.length === 0) {
    return {};
  }

  const streetGroups = {};
  
  console.log('=== GROUPEMENT PAR RUES ===');
  console.log('Nombre de clients à traiter:', clients.length);
  
  clients.forEach((client, index) => {
    if (!client) {
      console.warn(`Client ${index} est null ou undefined`);
      return;
    }

    const streetName = extractStreetName(client.address);
    console.log(`Client: ${client.name} | Adresse: "${client.address}" | Rue extraite: "${streetName}"`);
    
    if (!streetGroups[streetName]) {
      streetGroups[streetName] = [];
    }
    streetGroups[streetName].push(client);
  });

  // Trier les groupes par nom de rue
  const sortedGroups = {};
  Object.keys(streetGroups)
    .filter(streetName => streetName !== 'Adresses non définies') // Mettre les non définis à la fin
    .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
    .forEach(streetName => {
      // Trier les clients dans chaque rue par numéro civique
      sortedGroups[streetName] = streetGroups[streetName].sort((a, b) => {
        const numA = parseInt(a.address?.match(/^\d+/)?.[0] || '9999');
        const numB = parseInt(b.address?.match(/^\d+/)?.[0] || '9999');
        return numA - numB;
      });
    });

  // Ajouter les adresses non définies à la fin s'il y en a
  if (streetGroups['Adresses non définies']) {
    sortedGroups['Adresses non définies'] = streetGroups['Adresses non définies'];
  }

  console.log('Groupes créés:', Object.keys(sortedGroups));
  console.log('Nombre de groupes:', Object.keys(sortedGroups).length);
  
  return sortedGroups;
};

  // Fonction pour organiser les rues par secteurs géographiques
  const groupStreetsBySector = (streetGroups) => {
    const sectors = {};
    
    Object.keys(streetGroups).forEach(street => {
      let sector = 'Autres rues';
      const streetLower = street.toLowerCase();
      
      // Classification par secteurs (ajustez selon votre territoire)
      if (streetLower.includes('principale') || streetLower.includes('commercial') || 
          streetLower.includes('centre') || streetLower.includes('église')) {
        sector = 'Centre-ville';
      } else if (streetLower.includes('rang') || streetLower.includes('montée') || 
                 streetLower.includes('chemin') || streetLower.includes('route')) {
        sector = 'Secteur Rural';
      } else if (streetLower.includes('boulevard') || streetLower.includes('avenue') || 
                 streetLower.includes('boul')) {
        sector = 'Artères Principales';
      } else if (streetLower.includes('rue des') || streetLower.includes('rue de la') || 
                 streetLower.includes('place') || streetLower.includes('croissant')) {
        sector = 'Zones Résidentielles';
      } else if (streetLower.includes('industriel') || streetLower.includes('parc') ||
                 streetLower.includes('zone')) {
        sector = 'Zone Industrielle';
      }
      
      if (!sectors[sector]) {
        sectors[sector] = {};
      }
      sectors[sector][street] = streetGroups[street];
    });
    
    return sectors;
  };

// Fonction de débogage améliorée
const debugStreetExtraction = () => {
  console.log('=== DEBUG EXTRACTION RUES ===');
  
  // Tester avec vos vraies adresses clients
  clients.forEach(client => {
    if (client && client.address) {
      const extracted = extractStreetName(client.address);
      console.log(`"${client.address}" → "${extracted}"`);
    } else {
      console.warn('Client sans adresse:', client);
    }
  });
  
  // Afficher le résultat final
  const groups = groupClientsByStreet(clients);
  Object.keys(groups).forEach(street => {
    console.log(`📍 ${street}: ${groups[street].length} clients`);
    groups[street].forEach(client => {
      console.log(`  - ${client.name} (${client.address})`);
    });
  });

  return groups;
};

  // Fonction pour filtrer les clients par nom
  const getFilteredClientsByName = (searchTerm) => {
    if (!searchTerm.trim()) return [];
    
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // FONCTION POUR ENVOYER DES NOTIFICATIONS (WEB SEULEMENT)
  const sendNotificationViaBackend = async (clientId, type, customMessage = '') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      alert('Client introuvable');
      return;
    }

    // Validation téléphone canadien
    const validateCanadianPhone = (phone) => {
      if (!phone) return false;
      const cleaned = phone.replace(/\D/g,'');
      return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
    };

    const notificationData = {
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone && validateCanadianPhone(client.phone) ? client.phone : null,
      clientEmail: client.email || null,
      type: type,
      customMessage: customMessage
    };

    if (!notificationData.clientPhone && !notificationData.clientEmail) {
      alert(`Impossible d'envoyer une notification à ${client.name} : aucun téléphone ou email valide.`);
      return;
    }

    console.log('=== ENVOI NOTIFICATION DEBUG ===');
    console.log('Client:', client.name);
    console.log('Téléphone original:', client.phone);
    console.log('Téléphone validé:', notificationData.clientPhone);
    console.log('Email:', notificationData.clientEmail);
    console.log('Type notification:', type);
    console.log('Message personnalisé:', customMessage);
    console.log('URL backend:', `${API_BASE_URL}/api/notifications/send`);
    console.log('Données envoyées:', JSON.stringify(notificationData, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      console.log('Réponse serveur status:', response.status);
      console.log('Réponse serveur statusText:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== ERREUR SERVEUR COMPLÈTE ===');
        console.error('Status:', response.status);
        console.error('StatusText:', response.statusText);
        console.error('Corps de l\'erreur:', errorText);
        
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      console.log('Réponse JSON:', result);
      
      if (result.success) {
        const logEntry = {
          id: Date.now(),
          clientId: client.id,
          clientName: client.name,
          type: type,
          sms: result.results?.sms?.success || false,
          email: result.results?.email?.success || false,
          simulated: result.results?.sms?.simulated || result.results?.email?.simulated || false,
          sentAt: new Date().toISOString(),
          details: {
            smsMessageId: result.results?.sms?.messageId,
            emailMessageId: result.results?.email?.messageId,
            smsError: result.results?.sms?.error,
            emailError: result.results?.email?.error
          }
        };
        
        setNotificationLogs(prev => [logEntry, ...prev.slice(0, 99)]);
   
        let statusMessage = `Notification envoyée à ${client.name}\n\n`;
        
        if (result.results?.sms) {
          const smsStatus = result.results.sms.success 
            ? (result.results.sms.simulated ? '📱 SMS simulé avec succès' : '📱 SMS envoyé avec succès')
            : `📱 Échec SMS: ${result.results.sms.error}`;
          statusMessage += smsStatus + '\n';
        }
        
        if (result.results?.email) {
          const emailStatus = result.results.email.success 
            ? (result.results.email.simulated ? '📧 Email simulé avec succès' : '📧 Email envoyé avec succès')
            : `📧 Échec Email: ${result.results.email.error}`;
          statusMessage += emailStatus + '\n';
        }
        
        if (result.notification?.simulated) {
          statusMessage += '\n⚠️ Mode test activé - Notifications simulées';
        }
        
        alert(statusMessage);
        
      } else {
        throw new Error(result.error || 'Erreur inconnue du serveur');
      }
    } catch (error) {
      console.error('=== ERREUR CATCH COMPLÈTE ===');
      console.error('Type d\'erreur:', error.constructor.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      
      let errorMessage = 'Erreur lors de l\'envoi de la notification';
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        errorMessage = `❌ Impossible de se connecter au serveur backend\n\nVérifiez que :\n1. Le serveur Node.js est démarré\n2. Il écoute sur le port 3002\n3. L'URL ${API_BASE_URL} est correcte`;
        setBackendConnected(false);
      } else if (error.message.includes('400')) {
        errorMessage = `❌ Erreur dans les données envoyées (HTTP 400)\n\nLe serveur n'arrive pas à traiter la requête.\nConsultez la console pour plus de détails.`;
      } else if (error.message.includes('404')) {
        errorMessage = `❌ Endpoint non trouvé (HTTP 404)\n\nL'endpoint /api/notifications/send n'existe pas sur le serveur.`;
      } else if (error.message.includes('500')) {
        errorMessage = `❌ Erreur interne du serveur (HTTP 500)\n\nProblème côté serveur backend.`;
      } else {
        errorMessage = `❌ Erreur: ${error.message}`;
      }

      alert(errorMessage);

      const errorLogEntry = {
        id: Date.now(),
        clientId: client.id,
        clientName: client.name,
        type: type,
        sms: false,
        email: false,
        simulated: true,
        error: error.message,
        sentAt: new Date().toISOString()
      };
      
      setNotificationLogs(prev => [errorLogEntry, ...prev.slice(0, 99)]);
    }
  };

 // Fonction améliorée pour getCurrentPosition
const getCurrentPosition = async () => {
  setGpsError(null);
  
  // Vérifier le support de la géolocalisation
  if (!navigator.geolocation) {
    const error = 'Géolocalisation non supportée par ce navigateur';
    setGpsError(error);
    throw new Error(error);
  }

  // Vérifier si on est en HTTPS (requis pour la géolocalisation)
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    const error = 'La géolocalisation nécessite HTTPS. Veuillez accéder au site via https://';
    setGpsError(error);
    throw new Error(error);
  }

  try {
    console.log('Demande de permission géolocalisation...');
    
    // Vérifier les permissions explicitement
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({name: 'geolocation'});
        console.log('Statut permission géolocalisation:', permission.state);
        
        if (permission.state === 'denied') {
          throw new Error('Permission de géolocalisation refusée. Veuillez réactiver la géolocalisation dans les paramètres de votre navigateur.');
        }
      } catch (permError) {
        console.warn('Impossible de vérifier les permissions:', permError);
      }
    }

    const position = await new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: false, // Réduire pour éviter les timeouts
        timeout: 15000, // Réduire le timeout
        maximumAge: 300000 // Accepter une position vieille de 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('GPS obtenu - précision:', pos.coords.accuracy, 'm');
          resolve(pos);
        },
        (error) => {
          console.log('Erreur GPS:', error.code, error.message);
          let errorMessage = 'Erreur de géolocalisation';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur ou recharger la page.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible. Vérifiez votre connexion et que le GPS est activé sur votre appareil.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Délai d\'attente dépassé. Votre GPS met trop de temps à répondre. Réessayez ou utilisez une position manuelle.';
              break;
            default:
              errorMessage = `Erreur GPS (${error.code}): ${error.message}`;
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });

    const pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: Math.round(position.coords.accuracy || 1000),
      time: new Date().toLocaleTimeString('fr-CA'),
      timestamp: position.timestamp || Date.now(),
      method: 'web-gps'
    };
    
    setGpsPosition(pos);

    // Géocodage inverse (optionnel)
    try {
      const address = await reverseGeocode(pos.lat, pos.lng);
      const posWithAddress = { ...pos, address };
      setGpsPosition(posWithAddress);
      
      let precisionMsg = '';
      if (pos.accuracy <= 10) precisionMsg = '(Très précis)';
      else if (pos.accuracy <= 100) precisionMsg = '(Précis)';
      else if (pos.accuracy <= 1000) precisionMsg = '(Approximatif)';
      else precisionMsg = '(Peu précis)';

      console.log(`Position obtenue: ${address}, précision: ${pos.accuracy}m ${precisionMsg}`);
      
      return posWithAddress;
    } catch (geocodeError) {
      console.warn('Géocodage échoué:', geocodeError);
      return pos;
    }

  } catch (error) {
    console.error('Erreur complète géolocalisation:', error);
    setGpsError(error.message);
    throw error;
  }
};

  // Fonction de géocodage inverse robuste
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`,
      {
        headers: { 'User-Agent': 'JM-Pominville-Snow-Service/1.0' }
      }
    );
    
    if (!response.ok) {
      throw new Error('Service de géocodage non disponible');
    }
    
    const data = await response.json();
    
    if (!data?.address) {
      return `Coordonnées: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    const addr = data.address;
    const parts = [
      addr.house_number,
      addr.road || addr.street,
      addr.city || addr.town || addr.village,
      addr.state || addr.province,
      addr.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : `Position: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
  } catch (error) {
    console.error('Erreur géocodage inverse:', error);
    return `Coordonnées: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};  

  // PARTAGE DE LOCALISATION WEB
const shareLocationWithClients = async () => {
  let positionToShare = null;
  gpsPosition; // Déclarer avec let
  
  if (!positionToShare) {
    alert('Obtenez d\'abord votre position GPS');
    return;
  }
  
  try {
    // Si pas de position GPS, essayer d'en obtenir une
    if (!positionToShare) {
      console.log('Aucune position GPS, tentative d\'obtention...');
      try {
        positionToShare = await getCurrentPosition();
      } catch (gpsError) {
        console.warn('Impossible d\'obtenir le GPS:', gpsError);
        
        // Utiliser une position par défaut (Mirabel, Québec)
        positionToShare = {
          lat: 45.6500,
          lng: -74.0833,
          accuracy: 50000,
          time: new Date().toLocaleTimeString('fr-CA'),
          timestamp: Date.now(),
          method: 'fallback',
          address: 'Mirabel, Québec (position par défaut)'
        };
        
        setGpsPosition(positionToShare);
      }
    }

    // Vérifier la connexion backend
    if (!backendConnected) {
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        alert('❌ Erreur: Backend non disponible\n\nImpossible de créer la page de suivi.\nVérifiez que le serveur Node.js est démarré.');
        return;
      }
    }

    // Créer les données de suivi
    const trackingData = {
      position: positionToShare,
      teamName: 'Équipe JM Pominville',
      lastUpdate: new Date().toISOString(),
      active: true,
      fallbackMode: positionToShare.method === 'fallback'
    };

    console.log('=== CRÉATION PAGE DE SUIVI ===');
    console.log('Données envoyées:', JSON.stringify(trackingData, null, 2));
    console.log('URL backend:', `${API_BASE_URL}/api/location/share`);

    // Créer une session de suivi via le backend
    const response = await fetch(`${API_BASE_URL}/api/location/share`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(trackingData)
    });

    console.log('Réponse serveur status:', response.status);
    console.log('Réponse serveur statusText:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== ERREUR SERVEUR COMPLÈTE ===');
      console.error('Status:', response.status);
      console.error('StatusText:', response.statusText);
      console.error('Corps de l\'erreur:', errorText);
      
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    console.log('Réponse JSON:', result);

    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue du serveur');
    }

    const trackingUrl = result.trackingUrl;
    setShareToken(result.token);
    setIsLocationShared(true);

    // Message à envoyer aux clients
    const message = `🚛 Équipe JM Pominville - Suivi en Temps Réel

Bonjour! Notre équipe de déneigement a commencé sa tournée.

📍 Suivez notre progression en temps réel:
${trackingUrl}

Cette page vous montrera:
- Notre position actuelle
- Les rues en cours de traitement
- L'heure estimée d'arrivée dans votre secteur

${positionToShare.method === 'fallback' ? 
'⚠️ Position approximative utilisée en raison de problèmes GPS.' : 
'Position GPS précise activée.'}

Merci de votre patience!
- Équipe JM Pominville`;

    // Filtrer seulement les clients avec contrats actifs
    const clientsWithActiveContracts = clients.filter(client => {
      const contract = contracts.find(c =>
        c.clientId === client.id &&
        c.status === 'actif' &&
        !c.archived
      );
      return contract;
    });

    if (clientsWithActiveContracts.length === 0) {
      alert(`✅ Page de suivi créée avec succès!\n\nLien: ${trackingUrl}\n\n⚠️ Aucun client avec contrat actif trouvé pour l'envoi automatique.`);
      return;
    }

    const confirmSend = window.confirm(
      `✅ Page de suivi créée avec succès!\n\nLien: ${trackingUrl}\n\nEnvoyer le lien à ${clientsWithActiveContracts.length} clients avec contrat actif?`
    );

    if (confirmSend && backendConnected) {
      let successCount = 0;
      let failureCount = 0;

      // Envoyer avec délai pour éviter la surcharge
      for (const client of clientsWithActiveContracts) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Délai 2 secondes
          await sendNotificationViaBackend(client.id, 'custom', message);
          successCount++;
        } catch (error) {
          console.error(`Erreur envoi à ${client.name}:`, error);
          failureCount++;
        }
      }

      alert(`📱 Notifications envoyées!\n\nSuccès: ${successCount}\nÉchecs: ${failureCount}\n\n🔗 Lien de suivi: ${trackingUrl}`);
    }

  } catch (error) {
    console.error('Erreur complète shareLocationWithClients:', error);
    setGpsError(error.message);
    alert('Erreur lors du partage de localisation: ' + error.message);
  }
};

      // Démarrer le suivi automatique
const startLocationTracking = async () => {
  if (!gpsPosition) {
    alert('Aucune position GPS disponible. Obtenez d\'abord votre position.');
    return;
  }

  if (isTrackingActive) {
    alert('Le suivi est déjà actif');
    return;
  }

  try {
    setIsTrackingActive(true);
    
    // Mise à jour toutes les 2 minutes
    const interval = setInterval(async () => {
      try {
        const newPosition = await getCurrentPosition();
        
        if (shareToken && backendConnected) {
          // Mettre à jour la position partagée
          await fetch(`${API_BASE_URL}/api/location/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: shareToken,
              position: newPosition,
              lastUpdate: new Date().toISOString()
            })
          });
        }
        
        console.log('Position mise à jour:', newPosition.address);
      } catch (error) {
        console.error('Erreur mise à jour position:', error);
      }
    }, 120000); // 2 minutes

    setTrackingInterval(interval);
    alert('Suivi automatique démarré (mise à jour toutes les 2 minutes)');

  } catch (error) {
    console.error('Erreur démarrage suivi:', error);
    alert('Erreur lors du démarrage du suivi automatique');
    setIsTrackingActive(false);
  }
};


  // Fonction pour arrêter le partage
  const stopLocationTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    setIsTrackingActive(false);
    setIsLocationShared(false);
    alert('Suivi automatique arrêté');
  };

  // AUTRES FONCTIONS UTILITAIRES (inchangées)
  const syncData = () => {
    const now = new Date().toLocaleString('fr-CA');
    setLastSync(now);
    localStorage.setItem('lastSync', now);
  };

  const archiveOldContracts = () => {
    const currentYear = new Date().getFullYear();
    const cutoffDate = new Date(currentYear, 3, 1);

    const updatedContracts = contracts.map(contract => {
      const contractEndDate = contract.endDate ? new Date(contract.endDate) :
        new Date(contract.startDate).setFullYear(new Date(contract.startDate).getFullYear() + 1);

      if (new Date(contractEndDate) < cutoffDate && !contract.archived) {
        return {
          ...contract,
          archived: true,
          yearArchived: new Date(contractEndDate).getFullYear()
        };
      }
      return contract;
    });

    if (updatedContracts.some((contract, index) => contract.archived !== contracts[index]?.archived)) {
      setContracts(updatedContracts);
      saveToStorage('contracts', updatedContracts);

      const archivedCount = updatedContracts.filter(c => c.archived).length - contracts.filter(c => c.archived).length;
      if (archivedCount > 0) {
        alert(`${archivedCount} contrat(s) ont été archivé(s) automatiquement.`);
      }
    }
  };

  // Fonction pour filtrer les rues selon la recherche
  const getFilteredStreets = (searchTerm) => {
    if (!searchTerm.trim()) return [];
    
    const streetGroups = groupClientsByStreet(clients);
    const allStreets = Object.keys(streetGroups);
    
    return allStreets.filter(street => 
      street.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredContracts = () => {
    return contracts.filter(contract => showArchived ? contract.archived : !contract.archived);
  };

  const isPaymentReceived = (clientId, paymentNumber) => {
    return payments.some(payment =>
      payment.clientId === clientId &&
      payment.paymentNumber === paymentNumber &&
      payment.received
    );
  };

  const getPaymentAlerts = () => {
    const today = new Date();
    const alerts = [];
    clients.forEach(client => {
      const contract = contracts.find(c => c.clientId === client.id);
      if (!contract) return;
      const firstPaymentReceived = isPaymentReceived(client.id, 1);
      const secondPaymentReceived = isPaymentReceived(client.id, 2);

      if (client.firstPaymentDate && !firstPaymentReceived) {
        const firstPaymentDate = new Date(client.firstPaymentDate);
        if (firstPaymentDate < today) {
          const daysLate = Math.floor((today - firstPaymentDate) / (1000 * 60 * 60 * 24));
          alerts.push({
            type: 'overdue', client: client.name,
            message: `1er versement en retard de ${daysLate} jour(s)`,
            amount: (contract.amount / (client.paymentStructure === '1' ? 1 : 2)).toFixed(2),
            priority: 'high'
          });
        }
      }

      if (client.paymentStructure === '2' && client.secondPaymentDate && !secondPaymentReceived) {
        const secondPaymentDate = new Date(client.secondPaymentDate);
        if (secondPaymentDate < today) {
          const daysLate = Math.floor((today - secondPaymentDate) / (1000 * 60 * 60 * 24));
          alerts.push({
            type: 'overdue', client: client.name,
            message: `2e versement en retard de ${daysLate} jour(s)`,
            amount: (contract.amount / 2).toFixed(2), priority: 'high'
          });
        }
      }
    });
    return alerts;
  };


  // Fonction pour filtrer les clients pour les interventions
  const getFilteredInterventionClients = () => {
    if (!interventionClientSearch.trim()) return clients;
    return clients.filter(client =>
      client.name.toLowerCase().includes(interventionClientSearch.toLowerCase()) ||
      client.address.toLowerCase().includes(interventionClientSearch.toLowerCase()) ||
      client.phone.includes(interventionClientSearch)
    );
  };

  const handleInterventionClientSelect = (client) => {
    setInterventionForm({ ...interventionForm, clientId: client.id });
    setInterventionClientSearch(client.name);
    setShowInterventionClientSuggestions(false);
  };

  // EXPORT/IMPORT WEB SEULEMENT
  const exportData = () => {
    const allData = {
      clients, contracts, invoices, stakes, objectives, payments,
      interventions, notificationsHistory,
      exportDate: new Date().toISOString(), version: '2.2-web',
      lastModified: localStorage.getItem('lastModified')
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JM_Pominville_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    localStorage.setItem('lastBackup', new Date().toISOString());
    setNeedsBackup(false);
    alert('Sauvegarde créée avec succès!');
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (window.confirm('Remplacer les données actuelles?')) {
          const clientsData = (importedData.clients || []).map(client => ({
            ...client,
            paymentStructure: client.paymentStructure || '2',
            firstPaymentMethod: client.firstPaymentMethod || '',
            secondPaymentMethod: client.secondPaymentMethod || ''
          }));

          const paymentsData = (importedData.payments || []).map(payment => ({
            ...payment,
            paymentMethod: payment.paymentMethod || 'comptant'
          }));

          setClients(clientsData);
          setContracts(importedData.contracts || []);
          setInvoices(importedData.invoices || []);
          setStakes(importedData.stakes || []);
          setObjectives(importedData.objectives || []);
          setPayments(paymentsData);
          setInterventions(importedData.interventions || []);
          setNotificationsHistory(importedData.notificationsHistory || []);

          saveToStorage('clients', clientsData);
          saveToStorage('contracts', importedData.contracts || []);
          saveToStorage('invoices', importedData.invoices || []);
          saveToStorage('stakes', importedData.stakes || []);
          saveToStorage('objectives', importedData.objectives || []);
          saveToStorage('payments', paymentsData);
          saveToStorage('interventions', importedData.interventions || []);
          saveToStorage('notificationsHistory', importedData.notificationsHistory || []);
          alert('Données importées avec succès!');
        }
      } catch (error) {
        alert('Erreur lors de l\'import: fichier invalide');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // FONCTIONS CLIENTS
  const addClient = () => {
    if (!clientForm.name || !clientForm.phone || !clientForm.address) {
      alert('Veuillez remplir au moins le nom, le téléphone et l\'adresse.');
      return;
    }

    if (clientForm.paymentStructure === '1' && !clientForm.firstPaymentDate) {
      alert('Veuillez spécifier la date de paiement.');
      return;
    }

    if (clientForm.paymentStructure === '2' && (!clientForm.firstPaymentDate || !clientForm.secondPaymentDate)) {
      alert('Veuillez spécifier les dates des deux versements.');
      return;
    }

    const client = {
      id: Date.now(),
      ...clientForm,
      secondPaymentDate: clientForm.paymentStructure === '1' ? '' : clientForm.secondPaymentDate,
      secondPaymentMethod: clientForm.paymentStructure === '1' ? '' : clientForm.secondPaymentMethod
    };

    const newClients = [...clients, client];
    setClients(newClients);
    saveToStorage('clients', newClients);
    setClientForm({
      name: '', phone: '', email: '', type: '', address: '',
      paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
      firstPaymentMethod: '', secondPaymentMethod: ''
    });
  };

  const deleteClient = (id) => {
    if (window.confirm('Supprimer ce client ?')) {
      const newClients = clients.filter(client => client.id !== id);
      setClients(newClients);
      saveToStorage('clients', newClients);
    }
  };

  const startEditClient = (client) => {
    setEditingClient(client.id);
    setEditClientForm({
      ...client,
      paymentStructure: client.paymentStructure || '2',
      firstPaymentMethod: client.firstPaymentMethod || '',
      secondPaymentMethod: client.secondPaymentMethod || ''
    });
  };

  const saveEditClient = () => {
    const updatedClients = clients.map(client =>
      client.id === editingClient ? { ...client, ...editClientForm } : client
    );
    setClients(updatedClients);
    saveToStorage('clients', updatedClients);
    setEditingClient(null);
    setEditClientForm({
      name: '', phone: '', email: '', type: '', address: '',
      paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
      firstPaymentMethod: '', secondPaymentMethod: ''
    });
  };

  const cancelEdit = () => {
    setEditingClient(null);
    setEditClientForm({
      name: '', phone: '', email: '', type: '', address: '',
      paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
      firstPaymentMethod: '', secondPaymentMethod: ''
    });
  };

  // FONCTIONS CONTRATS
  const addContract = () => {
    if (!contractForm.clientId || !contractForm.type || !contractForm.startDate || !contractForm.amount) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    const contract = {
      id: Date.now(),
      clientId: parseInt(contractForm.clientId),
      type: contractForm.type,
      startDate: contractForm.startDate,
      endDate: contractForm.endDate,
      amount: parseFloat(contractForm.amount),
      status: contractForm.status,
      notes: contractForm.notes
    };
    const newContracts = [...contracts, contract];
    setContracts(newContracts);
    saveToStorage('contracts', newContracts);
    setContractForm({ clientId: '', type: '', startDate: '', endDate: '', amount: '', status: 'actif', notes: '' });
    setClientSearch('');
  };

  const deleteContract = (id) => {
    if (window.confirm('Supprimer ce contrat ?')) {
      const newContracts = contracts.filter(contract => contract.id !== id);
      setContracts(newContracts);
      saveToStorage('contracts', newContracts);
    }
  }

const saveEditContract = () => {
  const updatedContracts = contracts.map(contract =>
    contract.id === editingContract ? { ...contract, ...editContractForm } : contract
  );
  setContracts(updatedContracts);
  saveToStorage('contracts', updatedContracts);
  setEditingContract(null);
  setEditContractForm({
    clientId: '', type: '', startDate: '', endDate: '',
    amount: '', status: 'actif', notes: ''
  });
const cancelEditContract = () => {
  setEditingContract(null);
  setEditContractForm({
    clientId: '', type: '', startDate: '', endDate: '',
    amount: '', status: 'actif', notes: ''
  });
};

// Fonction pour installer l'app (PWA)
const installApp = async () => {
  if (installPromptEvent) {
    try {
      installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Installation acceptée');
        setIsInstalled(true);
      } else {
        console.log('Installation refusée');
      }
      
      setInstallPromptEvent(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Erreur installation:', error);
    }
  }
};
  // Fonction de recherche avancée pour contrats
  const getAdvancedFilteredContracts = () => {
    const baseContracts = contracts.filter(contract => showArchived ? contract.archived : !contract.archived);

    return baseContracts.filter(contract => {
      const client = clients.find(c => c.id === contract.clientId);
      const clientName = client ? client.name : '';

      const matchesSearch = !contractSearchFilters.searchTerm ||
        clientName.toLowerCase().includes(contractSearchFilters.searchTerm.toLowerCase()) ||
        (client && client.address.toLowerCase().includes(contractSearchFilters.searchTerm.toLowerCase()));

      const matchesType = !contractSearchFilters.type || contract.type === contractSearchFilters.type;
      const matchesStatus = !contractSearchFilters.status || contract.status === contractSearchFilters.status;

      const matchesYear = !contractSearchFilters.year ||
        new Date(contract.startDate).getFullYear().toString() === contractSearchFilters.year;

      return matchesSearch && matchesType && matchesStatus && matchesYear;
    });
  };

  // FONCTIONS FACTURES
  const addInvoice = () => {
    if (!invoiceForm.type || !invoiceForm.amount || !invoiceForm.date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (invoiceForm.type === 'revenu' && !invoiceForm.clientId) {
      alert('Veuillez sélectionner un client pour les revenus.');
      return;
    }
    const invoice = {
      id: Date.now(),
      clientId: invoiceForm.type === 'revenu' ? parseInt(invoiceForm.clientId) : null,
      amount: parseFloat(invoiceForm.amount),
      date: invoiceForm.date,
      type: invoiceForm.type,
      description: invoiceForm.description
    };
    const newInvoices = [...invoices, invoice];
    setInvoices(newInvoices);
    saveToStorage('invoices', newInvoices);
    setInvoiceForm({ clientId: '', amount: '', date: '', type: '', description: '' });
  };

  const deleteInvoice = (id) => {
    if (window.confirm('Supprimer cette facture ?')) {
      const newInvoices = invoices.filter(invoice => invoice.id !== id);
      setInvoices(newInvoices);
      saveToStorage('invoices', newInvoices);
    }
  };

  // FONCTIONS PIQUETS
  const addStakes = () => {
    if (!stakesForm.clientId || !stakesForm.date || !stakesForm.quantity) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    const stake = {
      id: Date.now(),
      clientId: parseInt(stakesForm.clientId),
      date: stakesForm.date,
      quantity: parseInt(stakesForm.quantity)
    };
    const newStakes = [...stakes, stake];
    setStakes(newStakes);
    saveToStorage('stakes', newStakes);
    setStakesForm({ clientId: '', date: '', quantity: '' });
  };

  const deleteStakes = (id) => {
    if (window.confirm('Supprimer cette installation ?')) {
      const newStakes = stakes.filter(stake => stake.id !== id);
      setStakes(newStakes);
      saveToStorage('stakes', newStakes);
    }
  };

  // FONCTIONS PAIEMENTS
  const showPaymentModalFunc = (clientId, paymentNumber, amount) => {
    setPaymentModal({
      isOpen: true,
      clientId,
      paymentNumber,
      amount
    });
  };

  const handlePaymentMethodSelect = (method) => {
    markPaymentReceived(
      paymentModal.clientId,
      paymentModal.paymentNumber,
      paymentModal.amount,
      new Date().toISOString().split('T')[0],
      method
    );
    setPaymentModal({ isOpen: false, clientId: null, paymentNumber: null, amount: 0 });
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, clientId: null, paymentNumber: null, amount: 0 });
  };

  const markPaymentReceived = (clientId, paymentNumber, amount, date, paymentMethod) => {
    const payment = {
      id: Date.now(),
      clientId: parseInt(clientId),
      paymentNumber: paymentNumber,
      amount: parseFloat(amount),
      date: date,
      paymentMethod: paymentMethod,
      received: true,
      recordedAt: new Date().toISOString()
    };

    const newPayments = [...payments, payment];
    setPayments(newPayments);
    saveToStorage('payments', newPayments);

    const client = clients.find(c => c.id === parseInt(clientId));
    if (client) {
      const invoice = {
        id: Date.now() + 1,
        clientId: parseInt(clientId),
        amount: parseFloat(amount),
        date: date,
        type: 'revenu',
        description: `Paiement ${paymentNumber}${paymentNumber === 1 ? 'er' : 'e'} versement - ${client.name} (${paymentMethod === 'cheque' ? 'Chèque' : 'Comptant'})`
      };

      const newInvoices = [...invoices, invoice];
      setInvoices(newInvoices);
      saveToStorage('invoices', newInvoices);
    }

    alert(`Paiement ${paymentNumber}${paymentNumber === 1 ? 'er' : 'e'} versement marqué comme reçu (${paymentMethod === 'cheque' ? 'Chèque' : 'Comptant'}) !`);
  };

  // GÉNÉRATION CONTRAT PDF COMPLET
  const generateContract = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    const client = clients.find(c => c.id === contract.clientId);

    if (!contract || !client) {
      alert('Erreur: Contrat ou client introuvable');
      return;
    }

    const paymentStructure = client.paymentStructure || '2';
    const firstPayment = paymentStructure === '1' ? contract.amount : contract.amount / 2;
    const secondPayment = paymentStructure === '2' ? contract.amount / 2 : 0;
    const today = new Date().toLocaleDateString('fr-CA');
    
    const contractHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; font-size: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; margin-bottom: 8px; font-size: 20px; font-weight: bold;">CONTRAT DE SERVICE DE DÉNEIGEMENT</h1>
          <h2 style="color: #000; margin-bottom: 4px; font-size: 16px; font-weight: bold;">JM Pominville</h2>
          <p style="font-style: italic; color: #000; margin-bottom: 15px; font-size: 12px;">Service fiable et rapide</p>
          <p style="color: #000; margin-bottom: 4px; font-size: 12px;"><strong>Maxim Pominville</strong></p>
          <p style="color: #000; margin-bottom: 15px; font-size: 12px;"><strong>Téléphone: 514-444-6324</strong></p>
          <p style="color: #000; margin-bottom: 15px; font-size: 12px;"><strong>Adresse: 10330 Du Plein-air, Mirabel, Québec, J7J-1S8</strong></p>
          <hr style="border: 1px solid #000; margin: 20px 0;">
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Informations du Client :</h3>
          <p style="margin: 8px 0;"><strong>• Prénom et Nom :</strong> ${client.name}</p>
          <p style="margin: 8px 0;"><strong>• Adresse du Service :</strong> ${client.address}</p>
          <p style="margin: 8px 0;"><strong>• Numéro de Téléphone :</strong> ${client.phone}</p>
          ${client.email ? `<p style="margin: 8px 0;"><strong>• Courriel :</strong> ${client.email}</p>` : ''}
        </div>
        
        <hr style="border: 1px solid #000; margin: 25px 0;">
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Conditions Générales du Service :</h3>
          <p style="margin-bottom: 15px;">Le présent contrat établit les termes et conditions du service de déneigement fourni par JM Pominville au client susmentionné pour la saison hivernale.</p>
          <p style="margin: 12px 0;"><strong>1. Déclenchement du Service :</strong> Le service de déneigement débutera lorsque l'accumulation de neige atteindra un minimum de cinq (5) centimètres.</p>
          <p style="margin: 12px 0;"><strong>2. Protection de la Propriété :</strong> Il est de la responsabilité exclusive du client de protéger adéquatement ses arbres, arbustes, ainsi que tout autre objet décoratif ou aménagement paysager situé dans la zone de déneigement.</p>
          <p style="margin: 12px 0;"><strong>3. Libération des Aires de Stationnement :</strong> Le stationnement et les aires d'accès doivent être libérés de tout objet mobile avant l'intervention de déneigement.</p>
          <p style="margin: 12px 0;"><strong>4. Déplacement des Véhicules :</strong> Les véhicules doivent être retirés des entrées de stationnement avant 9h00 du matin le lendemain de la tempête pour permettre le déneigement complet.<strong style="color: #d32f2f;">Des frais supplémentaires de 30$ seront facturés si nous devons ressortir en raison de véhicules non déplacés ou d'obstacles non prévus.</strong></p>
          <p style="margin: 12px 0;"><strong>5. Installation des Piquets :</strong> Les piquets de délimitation seront installés uniquement après réception du paiement intégral ou du premier versement du contrat.</p>
        </div>
        
        ${contract.notes ? `
        <hr style="border: 1px solid #000; margin: 25px 0;">
        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Notes Spéciales :</h3>
          <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 12px 0;">
            <p style="margin: 0; font-style: italic; color: #495057;">${contract.notes}</p>
          </div>
        </div>
        ` : ''}
      
        <hr style="border: 1px solid #000; margin: 25px 0;">

        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Période de Validité :</h3>
          <p style="margin: 12px 0;">Le présent contrat entre en vigueur le <strong>${contract.startDate}</strong> et demeure valide jusqu'au <strong>${contract.endDate || '31 mars ' + (new Date().getFullYear() + 1)}</strong>.</p>
          <p style="margin: 12px 0;">Cette période couvre l'intégralité de la saison de déneigement ${new Date().getFullYear()}-${new Date().getFullYear() + 1}.</p>
        </div>

        <hr style="border: 1px solid #000; margin: 25px 0;">

        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Modalités de Tarification et de Paiement :</h3>
          <p style="margin: 12px 0;">Le tarif pour la saison de déneigement est fixe et établi comme suit :</p>
          <p style="margin: 15px 0; font-size: 14px;"><strong>• Montant Total du Contrat :</strong> ${contract.amount.toFixed(2)} $</p>
          
          ${paymentStructure === '1' ? `
            <p style="margin: 15px 0;">Le paiement s'effectuera en un versement unique :</p>
            <div style="margin: 15px 0;">
              <p style="margin: 8px 0;"><strong>• Paiement Unique :</strong></p>
              <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.firstPaymentDate || contract.startDate}</p>
              <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${firstPayment.toFixed(2)} $</p>
              ${client.firstPaymentMethod ? `<p style="margin: 5px 0; margin-left: 20px;">• Méthode : ${client.firstPaymentMethod === 'cheque' ? 'Chèque' : 'Argent comptant'}</p>` : ''}
            </div>
          ` : `
            <p style="margin: 15px 0;">Le paiement s'effectuera selon les modalités suivantes :</p>
            <div style="margin: 15px 0;">
              <p style="margin: 8px 0;"><strong>• 1er Versement :</strong></p>
              <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.firstPaymentDate || contract.startDate}</p>
              <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${firstPayment.toFixed(2)} $</p>
              ${client.firstPaymentMethod ? `<p style="margin: 5px 0; margin-left: 20px;">• Méthode : ${client.firstPaymentMethod === 'cheque' ? 'Chèque' : 'Argent comptant'}</p>` : ''}
            </div>
            <div style="margin: 15px 0;">
              <p style="margin: 8px 0;"><strong>• 2e Versement :</strong></p>
              <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.secondPaymentDate || 'À déterminer'}</p>
              <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${secondPayment.toFixed(2)} $</p>
              ${client.secondPaymentMethod ? `<p style="margin: 5px 0; margin-left: 20px;">• Méthode : ${client.secondPaymentMethod === 'cheque' ? 'Chèque' : 'Argent comptant'}</p>` : ''}
            </div>
          `}
          
          <p style="margin: 12px 0; font-size: 11px;">Tout retard de paiement pourrait entraîner la suspension immédiate du service de déneigement jusqu'à la régularisation du solde.</p>
          <p style="margin: 12px 0; font-size: 11px;">Les paiements peuvent être effectués par chèque ou en argent comptant. Tous les chèques doivent être libellés à l'ordre de JM Pominville.</p>
        </div>
        
        <hr style="border: 1px solid #000; margin: 25px 0;">
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Acceptation du Contrat :</h3>
          <p style="margin: 12px 0;">En signant ci-dessous, le client et le représentant de JM Pominville reconnaissent avoir lu, compris et accepté l'intégralité des clauses et conditions énoncées dans le présent contrat.</p>
        </div>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="width: 45%;">
            <p style="margin: 5px 0; font-weight: bold;">Signature du Client :</p>
            <hr style="border: none; border-top: 1px solid #000; margin: 30px 0;">
            <p style="margin: 5px 0;">(Signature)</p>
            <hr style="border: none; border-top: 1px solid #000; margin: 20px 0;">
            <p style="margin: 5px 0;">(Nom en lettres moulées)</p>
            <p style="margin: 15px 0;"><strong>Date :</strong> ${today}</p>
          </div>
          <div style="width: 45%;">
            <p style="margin: 5px 0; font-weight: bold;">Signature du Représentant de JM Pominville :</p>
            
            <div style="margin: 20px 0; height: 60px; display: flex; align-items: center;">
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAK4AAAB9CAYAAAA7plhvAAABdWlDQ1BrQ0dDb2xvclNwYWNlRGlzcGxheVAzAAAokXWQvUvDUBTFT6tS0DqIDh0cMolD1NIKdnFoKxRFMFQFq1OafgltfCQpUnETVyn4H1jBWXCwiFRwcXAQRAcR3Zw6KbhoeN6XVNoi3sfl/Ticc7lcwBtQGSv2AijplpFMxKS11Lrke4OHnlOqZrKooiwK/v276/PR9d5PiFlNu3YQ2U9cl84ul3aeAlN//V3Vn8maGv3f1EGNGRbgkYmVbYsJ3iUeMWgp4qrgvMvHgtMunzuelWSc+JZY0gpqhrhJLKc79HwHl4plrbWD2N6f1VeXxRzqUcxhEyYYilBRgQQF4X/8044/ji1yV2BQLo8CLMpESRETssTz0KFhEjJxCEHqkLhz634PrfvJbW3vFZhtcM4v2tpCAzidoZPV29p4BBgaAG7qTDVUR+qh9uZywPsJMJgChu8os2HmwiF3e38M6Hvh/GMM8B0CdpXzryPO7RqFn4Er/QcXKWq8UwZBywAAAARjSUNQDA0AAW4D4+8AAACoZVhJZk1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAA2AAAAAEAAADYAAAAAQAGkAAABwAAAAQwMjIxkQEABwAAAAQBAgMAoAAABwAAAAQwMTAwoAIABAAAAAEAAACuoAMABAAAAAEAAAB9pAYAAwAAAAEAAAAAAAAAAIzjB0AAAAAJcEhZcwAAITgAACE4AUWWMWAAAAR6aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NTc0PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6U2NlbmVDYXB0dXJlVHlwZT4wPC9leGlmOlNjZW5lQ2FwdHVyZVR5cGU+CiAgICAgICAgIDxleGlmOkV4aWZWZXJzaW9uPjAyMjE8L2V4aWY6RXhpZlZlcnNpb24+CiAgICAgICAgIDxleGlmOkZsYXNoUGl4VmVyc2lvbj4wMTAwPC9leGlmOkZsYXNoUGl4VmVyc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjI4MDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbXBvbmVudHNDb25maWd1cmF0aW9uPgogICAgICAgICAgICA8cmRmOlNlcT4KICAgICAgICAgICAgICAgPHJkZjpsaT4xPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGk+MjwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpPjM8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaT4wPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC9leGlmOkNvbXBvbmVudHNDb25maWd1cmF0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj4yMTY8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjIxNjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CgXxCbMAAEAASURB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"

           alt="Signature Maxim Pominville" 
                   style="height: 50px; max-width: 200px;" />

</div>
            
            <p style="margin: 5px 0;">Maxim Pominville</p>
            <p style="margin: 5px 0; font-size: 11px;">JM Pominville</p>
            <p style="margin: 15px 0;"><strong>Date :</strong> ${today}</p>
          </div>
        </div>
      </div>
    `;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Contrat JM Pominville - ${client.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .header-bar {
              background: #1a4d1a;
              color: white;
              padding: 15px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: sticky;
              top: 0;
              z-index: 100;
            }
            .btn {
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-left: 10px;
              font-weight: bold;
            }
            .btn-close { background: #dc3545; color: white; }
            .btn-print { background: #28a745; color: white; }
            .contract-content { padding: 20px; }
            @media print { 
              .header-bar { display: none !important; }
              .contract-content { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h3 style="margin: 0;">Contrat de Service - ${client.name}</h3>
            <div>
              <button class="btn btn-print" onclick="window.print()">Imprimer / PDF</button>
              <button class="btn btn-close" onclick="window.close()">Fermer</button>
            </div>
          </div>
          <div class="contract-content">
            ${contractHTML}
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  // FONCTIONS OBJECTIFS
  const saveObjective = () => {
    if (!objectiveForm.revenueTarget || !objectiveForm.expenseLimit) {
      alert('Veuillez remplir tous les champs d\'objectifs.');
      return;
    }
    const newObjective = {
      year: parseInt(objectiveForm.year),
      revenueTarget: parseFloat(objectiveForm.revenueTarget),
      expenseLimit: parseFloat(objectiveForm.expenseLimit)
    };
    const updatedObjectives = objectives.filter(obj => obj.year !== newObjective.year);
    updatedObjectives.push(newObjective);
    setObjectives(updatedObjectives);
    saveToStorage('objectives', updatedObjectives);
    setObjectiveForm({ year: new Date().getFullYear(), revenueTarget: '', expenseLimit: '' });
    alert('Objectif sauvegardé avec succès !');
  };

  const exportYearData = (year) => {
    const yearInvoices = invoices.filter(inv => new Date(inv.date).getFullYear() === year);
    const revenus = yearInvoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0);
    const depenses = yearInvoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0);

    const csvContent = [
      'Type,Date,Client,Description,Montant',
      ...yearInvoices.map(inv => {
        const client = clients.find(c => c.id === inv.clientId);
        return `${inv.type},${inv.date},${client ? client.name : 'N/A'},"${inv.description}",${inv.amount}`;
      }),
      '',
      `Résumé ${year}`,
      `Total Revenus,${revenus}`,
      `Total Dépenses,${depenses}`,
      `Bénéfice,${revenus - depenses}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JM_Pominville_${year}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const generateChecklistReport = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; margin-bottom: 30px;">JM Pominville - Feuille de Suivi</h1>
        <h2 style="margin-bottom: 20px;">Cases à cocher - Saison ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Adresse</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">1er Versement</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">2e Versement</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Piquets</th>
            </tr>
          </thead>
          <tbody>
            ${clients.sort((a, b) => {
      const rueA = a.address.split(',')[0].trim().toLowerCase();
      const rueB = b.address.split(',')[0].trim().toLowerCase();
      return rueA.localeCompare(rueB);
    }).map(client => {
      const contract = contracts.find(c => c.clientId === client.id);
      const firstPaymentReceived = isPaymentReceived(client.id, 1);
      const secondPaymentReceived = isPaymentReceived(client.id, 2);
      const stakesInstalled = stakes.find(s => s.clientId === client.id);

      return `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">
                    <strong>${client.name}</strong><br>
                    <small>${client.address}</small><br>
                    <small>${client.phone}</small>
                  </td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <span style="font-size: 20px;">${firstPaymentReceived ? '☑' : '☐'}</span>
                    ${contract ? ` (${(contract.amount / 2).toFixed(0)}$)` : ''}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <span style="font-size: 20px;">${secondPaymentReceived ? '☑' : '☐'}</span>
                    ${contract ? ` (${(contract.amount / 2).toFixed(0)}$)` : ''}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                    <span style="font-size: 20px;">${stakesInstalled ? '☑' : '☐'}</span>
                    ${stakesInstalled ? ` (${stakesInstalled.quantity})` : ''}
                  </td>
                </tr>
      `;
    }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 40px;">
          <p><strong>Date d'impression :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>
          <p><strong>Total clients :</strong> ${clients.length}</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // FONCTIONS INTERVENTIONS
  const addIntervention = () => {
    if (interventionForm.heureDebut >= interventionForm.heureFin) {
      alert('L\'heure de fin doit être après l\'heure de début.');
      return;
    }
    if (!interventionForm.clientId || !interventionForm.datePrevu || !interventionForm.heureDebut || !interventionForm.heureFin) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const intervention = {
      id: Date.now(),
      clientId: parseInt(interventionForm.clientId),
      datePrevu: interventionForm.datePrevu,
      heureDebut: interventionForm.heureDebut,
      heureFin: interventionForm.heureFin,
      equipe: interventionForm.equipe,
      typeService: interventionForm.typeService,
      notes: interventionForm.notes,
      statut: 'planifie',
      createdAt: new Date().toISOString()
    };

    const newInterventions = [...interventions, intervention];
    setInterventions(newInterventions);
    saveToStorage('interventions', newInterventions);

    setInterventionForm({
      clientId: '',
      datePrevu: '',
      heureDebut: '08:00',
      heureFin: '09:00',
      equipe: 'Équipe 1',
      typeService: 'deneigement',
      notes: ''
    });

    alert('Intervention planifiée avec succès !');
  };

  const updateInterventionStatus = async (id, status) => {
    const intervention = interventions.find(i => i.id === id);
    const client = clients.find(c => c.id === intervention?.clientId);

    const updatedInterventions = interventions.map(intervention =>
      intervention.id === id ? { ...intervention, statut: status, updatedAt: new Date().toISOString() } : intervention
    );
    setInterventions(updatedInterventions);
    saveToStorage('interventions', updatedInterventions);

    if (client && (status === 'en_cours' || status === 'termine')) {
      const notificationType = status === 'en_cours' ? 'enroute' : 'completion';
      await sendNotificationViaBackend(client.id, notificationType);
    }
  };

  const deleteIntervention = (id) => {
    if (window.confirm('Supprimer cette intervention ?')) {
      const newInterventions = interventions.filter(intervention => intervention.id !== id);
      setInterventions(newInterventions);
      saveToStorage('interventions', newInterventions);
    }
  };

// Fonction améliorée pour extraire le nom de rue
const extractStreetName = (address) => {
  if (!address || typeof address !== 'string') return 'Adresses non définies';
  
  try {
    // Nettoyer l'adresse
    const cleanAddress = address.trim();
    
    // Séparer par virgule pour isoler la partie rue
    const parts = cleanAddress.split(',');
    if (parts.length === 0) return 'Adresses non définies';
    
    // Prendre la première partie (généralement numéro + rue)
    let streetPart = parts[0].trim();
    
    // Enlever le numéro de rue au début (supporter différents formats)
    streetPart = streetPart.replace(/^(\d+\s*[-\/\s]?\s*[a-zA-Z]?\s*)/i, '').trim();
    
    // Si il ne reste rien après suppression du numéro, garder l'original
    if (!streetPart) {
      streetPart = parts[0].trim();
    }
    
    // Normaliser les types de rues communes (avec gestion des variations)
    streetPart = streetPart
      // Rue variations
      .replace(/^(rue\s+)/gi, 'Rue ')
      .replace(/^(r\.\s+)/gi, 'Rue ')
      // Avenue variations
      .replace(/^(av\.?\s+)/gi, 'Avenue ')
      .replace(/^(avenue\s+)/gi, 'Avenue ')
      // Boulevard variations
      .replace(/^(boul\.?\s+)/gi, 'Boulevard ')
      .replace(/^(boulevard\s+)/gi, 'Boulevard ')
      .replace(/^(blvd\.?\s+)/gi, 'Boulevard ')
      // Autres types
      .replace(/^(chemin\s+)/gi, 'Chemin ')
      .replace(/^(ch\.?\s+)/gi, 'Chemin ')
      .replace(/^(route\s+)/gi, 'Route ')
      .replace(/^(rte\.?\s+)/gi, 'Route ')
      .replace(/^(place\s+)/gi, 'Place ')
      .replace(/^(pl\.?\s+)/gi, 'Place ')
      .replace(/^(rang\s+)/gi, 'Rang ')
      .replace(/^(montée\s+)/gi, 'Montée ')
      .replace(/^(impasse\s+)/gi, 'Impasse ')
      .replace(/^(allée\s+)/gi, 'Allée ')
      .replace(/^(croissant\s+)/gi, 'Croissant ')
      .replace(/^(cres\.?\s+)/gi, 'Croissant ')
      .replace(/^(terrasse\s+)/gi, 'Terrasse ');
    
    // Nettoyer les espaces multiples
    streetPart = streetPart.replace(/\s+/g, ' ').trim();
    
    // Capitaliser correctement
    streetPart = streetPart.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return streetPart || 'Adresses non définies';
    
  } catch (error) {
    console.error('Erreur extraction rue pour:', address, error);
    return 'Adresses non définies';
  }
};

  // Fonction pour créer des messages personnalisés
  const createCustomMessage = (type, streetName, customText = '') => {
    const baseMessages = {
      enroute: {
        title: 'Équipe en route',
        templates: [
          `Notre équipe se dirige vers ${streetName}. Estimated d'arrivée: 15-30 minutes.`,
          `Déneigement en cours sur ${streetName}. Merci de libérer vos entrées.`,
          `Nous approchons de ${streetName}. Veuillez déplacer vos véhicules si nécessaire.`,
          'Message personnalisé...' // Option pour texte libre
        ]
      },
      completion: {
        title: 'Service terminé',
        templates: [
          `Déneigement terminé sur ${streetName}. Merci de votre patience!`,
          `Service complété sur ${streetName}. Entrées et trottoirs dégagés.`,
          `Nous avons terminé ${streetName}. Bonne journée!`,
          'Message personnalisé...'
        ]
      },
      reminder: {
        title: 'Rappel de paiement',
        templates: [
          `Rappel amical: votre paiement pour le service de déneigement est dû.`,
          `Nous n'avons pas encore reçu votre paiement. Contactez-nous SVP.`,
          `Votre versement est en retard. Merci de régulariser rapidement.`,
          'Message personnalisé...'
        ]
      }
    };
    
    if (customText) {
      return customText;
    }
    
    return baseMessages[type]?.templates[0] || `Notification pour ${streetName}`;
  };

  // NOTIFICATIONS GROUPÉES PAR RUE
  const sendStreetNotifications = async (streetName, streetClients, notificationType, customMessage = '') => {
    console.log(`Envoi notifications à ${streetClients.length} clients sur ${streetName}`);
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (const client of streetClients) {
      try {
        await delay(1000);
        await sendNotificationViaBackend(client.id, notificationType, customMessage);
        successCount++;
        results.push({ client: client.name, success: true });
      } catch (error) {
        console.error(`Erreur notification pour ${client.name}:`, error);
        failureCount++;
        results.push({ client: client.name, success: false, error: error.message });
      }
    }

    return {
      street: streetName,
      totalClients: streetClients.length,
      successCount,
      failureCount,
      results
    };
  };

  // Fonction pour sélectionner/désélectionner toutes les rues
  const toggleAllStreets = (streetGroups) => {
    const allStreetNames = Object.keys(streetGroups);
    if (selectedStreets.length === allStreetNames.length) {
      setSelectedStreets([]); // Tout désélectionner
    } else {
      setSelectedStreets(allStreetNames); // Tout sélectionner
    }
  };

  const sendBulkStreetNotifications = async () => {
    if (selectedStreets.length === 0) {
      alert('Veuillez sélectionner au moins une rue');
      return;
    }

    const confirmMessage = `Envoyer des notifications "${bulkNotificationType}" à ${selectedStreets.length} rue(s) sélectionnée(s) ?\n\n${selectedStreets.join('\n')}`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsSendingBulk(true);
    const streetGroups = groupClientsByStreet(clients);

    let totalClients = 0;
    let totalSuccess = 0;
    let totalFailures = 0;
    const results = [];

    try {
      for (const streetName of selectedStreets) {
        const streetClients = streetGroups[streetName] || [];
        totalClients += streetClients.length;

        console.log(`Envoi notifications pour ${streetName} (${streetClients.length} clients)...`);

        const streetResult = await sendStreetNotifications(
          streetName,
          streetClients,
          bulkNotificationType,
          bulkCustomMessage || `Service ${bulkNotificationType === 'enroute' ? 'en cours' : 'terminé'} sur ${streetName}`
        );

        totalSuccess += streetResult.successCount;
        totalFailures += streetResult.failureCount;
        results.push(streetResult);

        // Délai entre les rues pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const summaryMessage = `Notifications envoyées !\n\n` +
        `Rues traitées: ${selectedStreets.length}\n` +
        `Clients notifiés: ${totalSuccess}/${totalClients}\n` +
        `Succès: ${totalSuccess}\n` +
        `Échecs: ${totalFailures}`;

      alert(summaryMessage);
      setSelectedStreets([]); // Réinitialiser la sélection

    } catch (error) {
      alert(`Erreur lors de l'envoi groupé: ${error.message}`);
    } finally {
      setIsSendingBulk(false);
    }
  };

  const setManualLocation = async () => {
    if (!manualAddress.trim()) {
      alert('Veuillez saisir une adresse');
      return;
    }

    try {
      // Géocodage de l'adresse saisie
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}&limit=1`
      );
      const data = await response.json();

      if (data && data[0]) {
        const pos = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          accuracy: 10,
          time: new Date().toLocaleTimeString('fr-CA'),
          method: 'manual'
        };

        const posWithAddress = { ...pos, address: manualAddress };
        setGpsPosition(posWithAddress);
        setShowManualInput(false);
        setManualAddress('');

        alert(`Position définie manuellement:\n${manualAddress}`);
      } else {
        alert('Adresse non trouvée');
      }
    } catch (error) {
      alert('Erreur géocodage: ' + error.message);
    }
  };

  // SYNCHRONISATION AVEC BACKEND
  const syncWithBackend = async (key, data) => {
    try {
      const allCurrentData = {
        clients: key === 'clients' ? data : clients,
        contracts: key === 'contracts' ? data : contracts,
        invoices: key === 'invoices' ? data : invoices,
        stakes: key === 'stakes' ? data : stakes,
        objectives: key === 'objectives' ? data : objectives,
        payments: key === 'payments' ? data : payments,
        interventions: key === 'interventions' ? data : interventions,
        notificationsHistory: key === 'notificationsHistory' ? data : notificationsHistory,
        lastModified: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allCurrentData)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ Synchronisation backend réussie');
      }
    } catch (error) {
      console.error('Erreur sync backend:', error);
      throw error;
    }
  };

  // FONCTIONS UTILITAIRES POUR L'INTERFACE
  const getFilteredClients = () => {
    if (!clientSearch.trim()) return clients;
    return clients.filter(client =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.address.toLowerCase().includes(clientSearch.toLowerCase()) ||
      client.phone.includes(clientSearch)
    );
  };

  const handleClientSelect = (client) => {
    setContractForm({ ...contractForm, clientId: client.id });
    setClientSearch(client.name);
    setShowClientSuggestions(false);
  };

  const startEditContract = (contract) => {
    setEditingContract(contract.id);
    setEditContractForm({
      clientId: contract.clientId,
      type: contract.type,
      startDate: contract.startDate,
      endDate: contract.endDate,
      amount: contract.amount,
      status: contract.status,
      notes: contract.notes
    });
  };

  const deletePayment = (id) => {
    if (window.confirm('Supprimer ce paiement ?')) {
      const newPayments = payments.filter(payment => payment.id !== id);
      setPayments(newPayments);
      saveToStorage('payments', newPayments);
    }
  };

  // Fonction de recherche avancée pour clients
  const getAdvancedFilteredClients = () => {
    return clients.filter(client => {
      const matchesSearch = !clientSearchFilters.searchTerm ||
        client.name.toLowerCase().includes(clientSearchFilters.searchTerm.toLowerCase()) ||
        client.address.toLowerCase().includes(clientSearchFilters.searchTerm.toLowerCase()) ||
        client.phone.includes(clientSearchFilters.searchTerm);

      const matchesType = !clientSearchFilters.type || client.type === clientSearchFilters.type;

      const matchesStreet = !clientSearchFilters.streetName ||
        extractStreetName(client.address).toLowerCase().includes(clientSearchFilters.streetName.toLowerCase());

      let matchesPaymentStatus = true;
      if (clientSearchFilters.paymentStatus) {
        const firstPaid = isPaymentReceived(client.id, 1);
        const secondPaid = isPaymentReceived(client.id, 2);
        const paymentStructure = client.paymentStructure || '2';

        switch (clientSearchFilters.paymentStatus) {
          case 'paid_full':
            matchesPaymentStatus = paymentStructure === '1' ? firstPaid : (firstPaid && secondPaid);
            break;
          case 'paid_partial':
            matchesPaymentStatus = paymentStructure === '2' && firstPaid && !secondPaid;
            break;
          case 'unpaid':
            matchesPaymentStatus = !firstPaid;
            break;
        }
      }

      return matchesSearch && matchesType && matchesStreet && matchesPaymentStatus;
    });
  };

  // COMPOSANTS DE RECHERCHE
  const ClientSearchPanel = () => (
    <div style={{
      background: '#f8f9fa', padding: '20px', borderRadius: '12px',
      marginBottom: '20px', border: '1px solid #dee2e6'
    }}>
      <h4 style={{ color: '#495057', marginBottom: '15px' }}>Recherche Avancée</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div>
          <label>Recherche générale</label>
          <input
            type="text"
            placeholder="Nom, adresse, téléphone..."
            value={clientSearchFilters.searchTerm}
            onChange={(e) => setClientSearchFilters({ ...clientSearchFilters, searchTerm: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label>Type de client</label>
          <select
            value={clientSearchFilters.type}
            onChange={(e) => setClientSearchFilters({ ...clientSearchFilters, type: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="">Tous les types</option>
            <option value="résidentiel">Résidentiel</option>
            <option value="commercial">Commercial</option>
            <option value="industriel">Industriel</option>
          </select>
        </div>

        <div>
          <label>Statut paiement</label>
          <select
            value={clientSearchFilters.paymentStatus}
            onChange={(e) => setClientSearchFilters({ ...clientSearchFilters, paymentStatus: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="">Tous les statuts</option>
            <option value="paid_full">Payé complètement</option>
            <option value="paid_partial">Partiellement payé</option>
            <option value="unpaid">Non payé</option>
          </select>
        </div>

        <div>
          <label>Nom de rue</label>
          <input
            type="text"
            placeholder="Ex: rue Principale"
            value={clientSearchFilters.streetName}
            onChange={(e) => setClientSearchFilters({ ...clientSearchFilters, streetName: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setClientSearchFilters({ searchTerm: '', type: '', paymentStatus: '', streetName: '' })}
          style={{
            padding: '8px 16px', background: '#6c757d', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          Réinitialiser
        </button>
        <div style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
          Résultats: {getAdvancedFilteredClients().length} client(s) trouvé(s)
        </div>
      </div>
    </div>
  );

  const ContractSearchPanel = () => (
    <div style={{
      background: '#f8f9fa', padding: '20px', borderRadius: '12px',
      marginBottom: '20px', border: '1px solid #dee2e6'
    }}>
      <h4 style={{ color: '#495057', marginBottom: '15px' }}>Recherche Avancée</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div>
          <label>Client ou adresse</label>
          <input
            type="text"
            placeholder="Nom du client ou adresse..."
            value={contractSearchFilters.searchTerm}
            onChange={(e) => setContractSearchFilters({ ...contractSearchFilters, searchTerm: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label>Type de contrat</label>
          <select
            value={contractSearchFilters.type}
            onChange={(e) => setContractSearchFilters({ ...contractSearchFilters, type: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="">Tous les types</option>
            <option value="saisonnier">Saisonnier</option>
            <option value="par-service">Par service</option>
            <option value="mensuel">Mensuel</option>
          </select>
        </div>

        <div>
          <label>Statut</label>
          <select
            value={contractSearchFilters.status}
            onChange={(e) => setContractSearchFilters({ ...contractSearchFilters, status: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
            <option value="terminé">Terminé</option>
          </select>
        </div>

        <div>
          <label>Année</label>
          <select
            value={contractSearchFilters.year}
            onChange={(e) => setContractSearchFilters({ ...contractSearchFilters, year: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="">Toutes les années</option>
            {Array.from(new Set(contracts.map(c => new Date(c.startDate).getFullYear())))
              .sort((a, b) => b - a)
              .map(year => (
                <option key={year} value={year}>{year}</option>
              ))
            }
          </select>
        </div>
      </div>

      <div style ={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setContractSearchFilters({ searchTerm: '', type: '', status: '', year: '' })}
          style={{
            padding: '8px 16px', background: '#6c757d', color: 'white',

            border: 'none', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          Réinitialiser
        </button>
        <div style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
          Résultats: {getAdvancedFilteredContracts().length} contrat(s) trouvé(s)
        </div>
      </div>
    </div>
  );
  //Fonction de test pour le groupement des rues
const testStreetGrouping = () => {
  console.log('=== TEST GROUPEMENT RUES ===');
  debugStreetExtraction();
  
  const streetGroups = groupClientsByStreet(clients);
  console.log('Sections qui devraient apparaître:', Object.keys(streetGroups));
  
  return streetGroups;
};

// Fonction pour créer des groupes de rues fictifs (fallback)
const createFakeStreetGroups = () => {
  const groups = {};
  
  clients.forEach(client => {
    const fakeStreet = client.address ? 
      client.address.substring(0, 30) + '...' : 
      `Client ${client.name}`;
    
    if (!groups[fakeStreet]) {
      groups[fakeStreet] = [];
    }
    groups[fakeStreet].push(client);
  });
  
  return groups;
};


  // RENDU DE L'INTERFACE PRINCIPALE
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>JM Pominville Web</h1>
            <p>Gestion Web de Déneigement</p>
            <div className="status-indicator">
              <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
              <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
              <span className={`status-dot ${backendConnected ? 'online' : 'offline'}`}></span>
              <span>Backend {backendConnected ? 'OK' : 'OFF'}</span>
              <small>Dernière sync: {lastSync}</small>
            </div>
            
            <div style={{
              display: 'flex', gap: '10px', marginTop: '10px', fontSize: '12px'
            }}>
              <div style={{
                background: '#e3f2fd', padding: '4px 8px', borderRadius: '12px',
                fontSize: '11px', fontWeight: 'bold', color: '#1976d2'
              }}>
                🌐 Web App
              </div>
              {gpsPosition && (
                <div style={{
                  background: '#d4edda', padding: '4px 8px', borderRadius: '12px',
                  fontSize: '11px', fontWeight: 'bold', color: '#155724'
                }}>
                  📍 GPS OK
                </div>
              )}
              {isLocationShared && (
                <div style={{
                  background: '#d1ecf1', padding: '4px 8px', borderRadius: '12px',
                  fontSize: '11px', fontWeight: 'bold', color: '#0c5460'
                }}>
                  🔗 Partagé
                </div>
              )}
              <button
                onClick={checkBackendConnection}
                style={{
                  background: backendConnected ? '#28a745' : '#dc3545',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {backendConnected ? '🟢 Backend OK' : '🔴 Test Backend'}
              </button>
            </div>
          </div>        

          <div className="data-management">
            <input 
              type="file" accept=".json" onChange={importData} 
              style={{display: 'none'}} id="import-file" 
            />
            <label htmlFor="import-file" className="btn" style={{marginRight: '10px'}}>
              Import
            </label>
            <button className="btn" onClick={exportData}>
              Export
            </button>
            {needsBackup && (
              <span style={{
                background: '#ff6b6b', color: 'white', padding: '4px 8px',
                borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                marginLeft: '8px'
              }}>

                ⚠️ Sync
              </span>
            )}
          </div>
        </div>
        
        <nav className="nav-tabs" style={{overflowX: 'auto', whiteSpace: 'nowrap'}}>
          <button 
            className={activeTab === 'clients' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('clients')}
          >
            👥 Clients
          </button>
          <button 
            className={activeTab === 'contracts' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('contracts')}
          >
            
            📋 Contrats
          </button>
          <button 
  className={activeTab === 'accounting' ? 'tab-button active' : 'tab-button'}
  onClick={() => setActiveTab('accounting')}
>
  💰 Comptabilité
</button>
<button 
  className={activeTab === 'dashboard' ? 'tab-button active' : 'tab-button'}
  onClick={() => setActiveTab('dashboard')}
>
  📊 Tableau de bord
</button>
          <button 
            className={activeTab === 'payments' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('payments')}
          >
            💰 Paiements
          </button>
          <button 
            className={activeTab === 'terrain' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('terrain')}
          >
            🚛 Terrain
          </button>
          <button 
            className={activeTab === 'notifications' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('notifications')}
          >
            📱 Notifications
          </button>

        </nav>
      </header>
  
      {/* SECTION CLIENTS */}
      {activeTab === 'clients' && (
        <div className="tab-content">
          {(() => {
            const alerts = getPaymentAlerts();
            if (alerts.length === 0) return null;

            return (
              <div style={{
                background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '12px',
                padding: '20px', marginBottom: '30px', borderLeft: '5px solid #fdcb6e'
              }}>
                <h3 style={{ color: '#856404', marginBottom: '15px', fontSize: '1.4em' }}>
                  Alertes de Paiements ({alerts.length})
                </h3>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {alerts.map((alert, index) => (
                    <div key={index} style={{
                      padding: '12px 16px', borderRadius: '8px',
                      background: alert.priority === 'high' ? '#f8d7da' : '#fff3cd',
                      border: `1px solid ${alert.priority === 'high' ? '#f5c6cb' : '#ffeaa7'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <strong style={{ color: alert.priority === 'high' ? '#721c24' : '#856404' }}>
                          {alert.client}
                        </strong>
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                          {alert.message}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                        background: alert.priority === 'high' ? '#dc3545' : '#ffc107', color: 'white'
                      }}>
                        {alert.amount}$
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <h2 className="section-title">Gestion des Clients</h2>

          {/* Panneau de recherche avancée */}
          <ClientSearchPanel />

          {/* Formulaire client pour web */}
          <div className="form-group">
            <div className="form-row">
              <div>
                <label>Nom du client</label>
                <input
                  type="text" value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div>
                <label>Téléphone</label>
                <input
                  type="tel" value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="514-555-0123"
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Email</label>
                <input
                  type="email" value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label>Type de client</label>
                <select
                  value={clientForm.type}
                  onChange={(e) => setClientForm({ ...clientForm, type: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  <option value="résidentiel">Résidentiel</option>
                  <option value="commercial">Commercial</option>
                  <option value="industriel">Industriel</option>
                </select>
              </div>
            </div>

            <div>
              <label>Adresse complète</label>
              <textarea
                rows="2" value={clientForm.address}
                onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                placeholder="123 Rue Example, Ville, Province, Code postal"
              />
            </div>

            <div className="form-row">
              <div>
                <label>Structure de paiement</label>
                <select
                  value={clientForm.paymentStructure}
                  onChange={(e) => setClientForm({ ...clientForm, paymentStructure: e.target.value })}
                >
                  <option value="1">1 versement unique</option>
                  <option value="2">2 versements</option>
                </select>
              </div>
              <div>
                <label>Date 1er versement</label>
                <input
                  type="date" value={clientForm.firstPaymentDate}
                  onChange={(e) => setClientForm({ ...clientForm, firstPaymentDate: e.target.value })}
                />
              </div>
            </div>

            {clientForm.paymentStructure === '2' && (
              <div className="form-row">
                <div>
                  <label>Date 2e versement</label>
                  <input
                    type="date" value={clientForm.secondPaymentDate}
                    onChange={(e) => setClientForm({ ...clientForm, secondPaymentDate: e.target.value })}
                  />
                </div>
                <div></div>
              </div>
            )}

            <button className="btn" onClick={addClient}>
              Ajouter Client
            </button>
          </div>

          {/* Liste clients */}
         {getAdvancedFilteredClients().length > 0 ? (
  <table className="data-table">
    <thead>
      <tr>
        <th>Client</th>
        <th>Contact</th>
        <th>Type</th>
        <th>Structure Paiement</th>
        <th>Statut Paiements</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {getAdvancedFilteredClients()
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
        .map(client => {
          const contract = contracts.find(c => c.clientId === client.id && !c.archived);
          const firstPaymentReceived = isPaymentReceived(client.id, 1);
          const secondPaymentReceived = isPaymentReceived(client.id, 2);
          
          // Récupérer les détails des paiements
          const firstPayment = payments.find(p => p.clientId === client.id && p.paymentNumber === 1);
          const secondPayment = payments.find(p => p.clientId === client.id && p.paymentNumber === 2);

          return (
            <tr key={client.id}>
              <td>
                <div>
                  <strong style={{ color: '#1a4d1a' }}>{client.name}</strong>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                    {client.address}
                  </div>
                </div>
              </td>
              
              <td>
                <div>
                  <div>📞 {client.phone}</div>
                  {client.email && <div style={{ fontSize: '12px', color: '#666' }}>📧 {client.email}</div>}
                </div>
              </td>
              
              <td>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                  fontWeight: 'bold', background: '#e8f5e8', color: '#1a4d1a'
                }}>
                  {client.type || 'Non défini'}
                </span>
              </td>

              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Structure de paiement */}
                  <span style={{
                    padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                    background: '#e3f2fd', color: '#1976d2'
                  }}>
                    {client.paymentStructure === '1' ? '1 versement' : '2 versements'}
                  </span>
                  
                  {/* Dates prévues */}
                  {client.firstPaymentDate && (
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      1er: {client.firstPaymentDate}
                    </div>
                  )}
                  {client.paymentStructure === '2' && client.secondPaymentDate && (
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      2e: {client.secondPaymentDate}
                    </div>
                  )}
                </div>
              </td>

              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Premier versement */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '2px',
                    padding: '6px 8px', borderRadius: '8px',
                    background: firstPaymentReceived ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${firstPaymentReceived ? '#c3e6cb' : '#f5c6cb'}`
                  }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 'bold',
                      color: firstPaymentReceived ? '#155724' : '#721c24'
                    }}>
                      1er versement: {firstPaymentReceived ? 'Reçu' : 'En attente'}
                    </div>
                    
                    {firstPayment && (
                      <>
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          Reçu le: {firstPayment.date}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          Méthode: {firstPayment.paymentMethod === 'cheque' ? '📄 Chèque' : '💰 Comptant'}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#155724' }}>
                          Montant: {firstPayment.amount.toFixed(0)}$
                        </div>
                      </>
                    )}
                    
                    {!firstPaymentReceived && contract && (
                      <div style={{ fontSize: '10px', color: '#721c24', fontWeight: 'bold' }}>
                        Attendu: {(contract.amount / (client.paymentStructure === '1' ? 1 : 2)).toFixed(0)}$
                      </div>
                    )}
                  </div>

                  {/* Deuxième versement si applicable */}
                  {client.paymentStructure === '2' && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '2px',
                      padding: '6px 8px', borderRadius: '8px',
                      background: secondPaymentReceived ? '#d4edda' : '#f8d7da',
                      border: `1px solid ${secondPaymentReceived ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 'bold',
                        color: secondPaymentReceived ? '#155724' : '#721c24'
                      }}>
                        2e versement: {secondPaymentReceived ? 'Reçu' : 'En attente'}
                      </div>
                      
                      {secondPayment && (
                        <>
                          <div style={{ fontSize: '10px', color: '#666' }}>
                            Reçu le: {secondPayment.date}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>
                            Méthode: {secondPayment.paymentMethod === 'cheque' ? '📄 Chèque' : '💰 Comptant'}
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#155724' }}>
                            Montant: {secondPayment.amount.toFixed(0)}$
                          </div>
                        </>
                      )}
                      
                      {!secondPaymentReceived && contract && (
                        <div style={{ fontSize: '10px', color: '#721c24', fontWeight: 'bold' }}>
                          Attendu: {(contract.amount / 2).toFixed(0)}$
                        </div>
                      )}
                    </div>
                  )}

                  {/* Résumé total */}
                  {contract && (
                    <div style={{
                      fontSize: '10px', textAlign: 'center', padding: '2px 4px',
                      background: '#f8f9fa', borderRadius: '4px', color: '#495057'
                    }}>
                      Total contrat: {contract.amount.toFixed(0)}$
                    </div>
                  )}
                </div>
              </td>

              <td>
                <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                  <button
                    onClick={() => sendNotificationViaBackend(client.id, 'enroute')}
                    style={{
                      padding: '5px 10px', background: '#007bff', color: 'white',
                      border: 'none', borderRadius: '4px', fontSize: '12px',
                      cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    📱 Notifier
                  </button>
                  
                  {contract && !firstPaymentReceived && (
                    <button
                      onClick={() => showPaymentModalFunc(client.id, 1, contract.amount / (client.paymentStructure === '1' ? 1 : 2))}
                      style={{
                        padding: '5px 10px', background: '#28a745', color: 'white',
                        border: 'none', borderRadius: '4px', fontSize: '12px',
                        cursor: 'pointer', fontWeight: 'bold'
                      }}
                    >
                      💰 1er Paiement
                    </button>
                  )}
                  
                  {contract && client.paymentStructure === '2' && firstPaymentReceived && !secondPaymentReceived && (
                    <button
                      onClick={() => showPaymentModalFunc(client.id, 2, contract.amount / 2)}
                      style={{
                        padding: '5px 10px', background: '#28a745', color: 'white',
                        border: 'none', borderRadius: '4px', fontSize: '12px',
                        cursor: 'pointer', fontWeight: 'bold'
                      }}
                    >
                      💰 2e Paiement
                    </button>
                  )}

                  <button
                    className="btn"
                    onClick={() => startEditClient(client)}
                    style={{ padding: '5px 10px', fontSize: '12px', background: '#ffc107', color: '#000' }}
                  >
                    ✏️ Modifier
                  </button>
                  
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteClient(client.id)}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
    </tbody>
  </table>
) : (
  <div style={{
    textAlign: 'center', padding: '40px 20px',
    background: '#f8f9fa', borderRadius: '12px',
    color: '#666', fontSize: '16px'
  }}>
    Aucun client trouvé avec ces critères de recherche.
    
  </div>
)}
</div>
)}

               {/* Section Contrats */}
          {activeTab === 'contracts' && (
            <div className="tab-content">
              <h2 className="section-title">Gestion des Contrats</h2>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  className={`btn ${!showArchived ? 'active' : ''}`}
                  onClick={() => setShowArchived(false)}
                  style={{ background: !showArchived ? '#1a4d1a' : '#6c757d' }}
                >
                  Contrats Actifs
                </button>
                <button
                  className={`btn ${showArchived ? 'active' : ''}`}
                  onClick={() => setShowArchived(true)}
                  style={{ background: showArchived ? '#1a4d1a' : '#6c757d' }}
                >
                  Archives ({contracts.filter(c => c.archived).length})
                </button>
                <button
                  className="btn" onClick={archiveOldContracts}
                  style={{ background: '#fd7e14' }}
                >
                  Archiver Anciens Contrats
                </button>
              </div>
              <ContractSearchPanel />

              {!showArchived && (
                <div className="form-group">
                  <div className="form-row">
                    <div style={{ position: 'relative' }}>
                      <label>Client</label>
                      <input
                        type="text" value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientSuggestions(true);
                          if (!e.target.value) {
                            setContractForm({ ...contractForm, clientId: '' });
                          }
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                        placeholder="Tapez le nom ou l'adresse du client..."
                      />

                      {showClientSuggestions && clientSearch && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'white', border: '1px solid #ddd', borderRadius: '8px',
                          maxHeight: '200px', overflowY: 'auto', zIndex: 10,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                          {getFilteredClients().map(client => (
                            <div
                              key={client.id} onClick={() => handleClientSelect(client)}
                              style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                              onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              <strong>{client.name}</strong><br />
                              <small style={{ color: '#666' }}>{client.address}</small>
                            </div>
                          ))}
                          {getFilteredClients().length === 0 && (
                            <div style={{ padding: '10px 15px', color: '#666', fontStyle: 'italic' }}>
                              Aucun client trouvé pour "{clientSearch}"
                            </div>
                          )}
                        </div>
                      )}

                      {showClientSuggestions && (
                        <button
                          type="button" onClick={() => setShowClientSuggestions(false)}
                          style={{
                            position: 'absolute', right: '10px', top: '35px',
                            background: 'transparent', border: 'none',
                            fontSize: '16px', cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div>
                      <label>Type de contrat</label>
                      <select
                        value={contractForm.type}
                        onChange={(e) => setContractForm({ ...contractForm, type: e.target.value })}
                      >
                        <option value="">Sélectionner...</option>
                        <option value="saisonnier">Saisonnier</option>
                        <option value="par-service">Par service</option>
                        <option value="mensuel">Mensuel</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Date de début</label>
                      <input
                        type="date" value={contractForm.startDate}
                        onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Date de fin</label>
                      <input
                        type="date" value={contractForm.endDate}
                        onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Montant ($)</label>
                      <input
                        type="number" min="0" step="0.01" value={contractForm.amount}
                        onChange={(e) => setContractForm({ ...contractForm, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label>Statut</label>
                      <select
                        value={contractForm.status}
                        onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                      >
                        <option value="actif">Actif</option>
                        <option value="suspendu">Suspendu</option>
                        <option value="terminé">Terminé</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>Notes spéciales</label>
                    <textarea
                      rows="3" value={contractForm.notes}
                      onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                      placeholder="Instructions spéciales, accès, etc."
                    />
                  </div>

                  <button className="btn" onClick={addContract}>
                    Créer Contrat
                  </button>
                </div>
              )} {getAdvancedFilteredContracts().length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Type</th>
                      <th>Période</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAdvancedFilteredContracts()
                      .sort((a, b) => {
                        const clientA = clients.find(c => c.id === a.clientId);
                        const clientB = clients.find(c => c.id === b.clientId);
                        const nameA = clientA ? clientA.name.toLowerCase() : 'zzz';
                        const nameB = clientB ? clientB.name.toLowerCase() : 'zzz';
                        return nameA.localeCompare(nameB);
                      })
                      .map(contract => {
                        const client = clients.find(c => c.id === contract.clientId);
                        return (
                          <tr key={contract.id}>
                            <td>
                              <div>
                                <strong>{client ? client.name : 'Client supprimé'}</strong>
                                {client && <><br /><small style={{ color: '#666' }}>{client.address}</small></>}
                                {contract.archived && (
                                  <div style={{
                                    background: '#fff3e0', color: '#f57c00', padding: '2px 6px',
                                    borderRadius: '10px', fontSize: '10px', fontWeight: 'bold',
                                    marginTop: '5px', display: 'inline-block'
                                  }}>
                                    Archivé {contract.yearArchived}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{contract.type}</td>
                            <td>
                              <div>
                                <div>Début: {contract.startDate}</div>
                                <div>Fin: {contract.endDate || 'Non définie'}</div>
                              </div>
                            </td>
                            <td>{contract.amount.toFixed(2)} $</td>
                            <td>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                background: contract.status === 'actif' ? '#d4edda' : contract.status === 'suspendu' ? '#fff3cd' : '#f8d7da',
                                color: contract.status === 'actif' ? '#155724' : contract.status === 'suspendu' ? '#856404' : '#721c24'
                              }}>
                                {contract.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                <button
                                  className="btn"
                                  onClick={() => generateContract(contract.id)}
                                  style={{ padding: '5px 10px', fontSize: '12px', background: '#17a2b8' }}
                                >
                                  Contrat PDF
                                </button>
                                <button
                                  className="btn"
                                  onClick={() => startEditContract(contract)}
                                  style={{ padding: '5px 10px', fontSize: '12px', background: '#007bff' }}
                                >
                                  Modifier
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => deleteContract(contract.id)}
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Section Comptabilité */}
          {activeTab === 'accounting' && (
            <div className="tab-content">
              <h2 className="section-title">Comptabilité</h2>

              <div className="form-group">
                <div className="form-row">
                  <div>
                    <label>Type de transaction</label>
                    <select
                      value={invoiceForm.type}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, type: e.target.value })}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="revenu">Revenu</option>
                      <option value="depense">Dépense</option>
                    </select>
                  </div>
                  <div>
                    <label>Date</label>
                    <input
                      type="date" value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                    />
                  </div>
                </div>

                {invoiceForm.type === 'revenu' && (
                  <div className="form-row">
                    <div>
                      <label>Client (pour revenus)</label>
                      <select
                        value={invoiceForm.clientId}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                      >
                        <option value="">Sélectionner client...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div></div>
                  </div>
                )}

                <div className="form-row">
                  <div>
                    <label>Montant ($)</label>
                    <input
                      type="number" min="0" step="0.01" value={invoiceForm.amount}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div></div>
                </div>

                <div>
                  <label>Description</label>
                  <textarea
                    rows="3" value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    placeholder="Description de la transaction"
                  />
                </div>

                <button className="btn" onClick={addInvoice}>
                  Ajouter Transaction
                </button>
              </div>

              {invoices.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Client</th>
                      <th>Description</th>
                      <th>Montant</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => {
                      const client = invoice.clientId ? clients.find(c => c.id === invoice.clientId) : null;
                      return (
                        <tr key={invoice.id}>
                          <td>{invoice.date}</td>
                          <td>
                            <span style={{
                              padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                              background: invoice.type === 'revenu' ? '#d4edda' : '#f8d7da',
                              color: invoice.type === 'revenu' ? '#155724' : '#721c24'
                            }}>
                              {invoice.type}
                            </span>
                          </td>
                          <td>{client ? client.name : 'N/A'}</td>
                          <td>{invoice.description}</td>
                          <td style={{
                            fontWeight: 'bold',
                            color: invoice.type === 'revenu' ? '#28a745' : '#dc3545'
                          }}>
                            {invoice.type === 'revenu' ? '+' : '-'}{invoice.amount.toFixed(2)} $
                          </td>
                          <td>
                            <button
                              className="btn btn-danger"
                              onClick={() => deleteInvoice(invoice.id)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <div style={{
                marginTop: '30px', padding: '20px',
                background: '#f8f9fa', borderRadius: '12px'
              }}>
                <h3 style={{ marginBottom: '15px' }}>Résumé Financier</h3>
                {(() => {
                  const revenus = invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0);
                  const depenses = invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0);
                  const benefice = revenus - depenses;

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#155724', marginBottom: '5px' }}>Total Revenus</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                          {revenus.toFixed(2)} $
                        </div>
                      </div>
                      <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#721c24', marginBottom: '5px' }}>Total Dépenses</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                          {depenses.toFixed(2)} $
                        </div>
                      </div>
                      <div style={{
                        background: benefice >= 0 ? '#d1ecf1' : '#f8d7da',
                        padding: '15px', borderRadius: '8px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '14px', color: benefice >= 0 ? '#0c5460' : '#721c24', marginBottom: '5px' }}>Bénéfice Net</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: benefice >= 0 ? '#0c5460' : '#721c24' }}>
                          {benefice.toFixed(2)} $
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Section Paiements */}
          {activeTab === 'payments' && (
            <div className="tab-content">
              <h2 className="section-title">Suivi des Paiements</h2>

              {/* Résumé financier en haut */}
              <div style={{
                marginBottom: '30px', padding: '20px',
                background: '#f8f9fa', borderRadius: '12px'
              }}>
                <h3 style={{ marginBottom: '15px' }}>Résumé Financier Global</h3>
                {(() => {
                  const revenus = invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0);
                  const depenses = invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0);
                  const benefice = revenus - depenses;
                  const totalPaiementsRecus = payments.reduce((sum, payment) => sum + payment.amount, 0);

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#155724', marginBottom: '5px' }}>Total Revenus</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                          {revenus.toFixed(2)} $
                        </div>
                      </div>
                      <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#721c24', marginBottom: '5px' }}>Total Dépenses</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                          {depenses.toFixed(2)} $
                        </div>
                      </div>
                      <div style={{
                        background: benefice >= 0 ? '#d1ecf1' : '#f8d7da',
                        padding: '15px', borderRadius: '8px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '14px', color: benefice >= 0 ? '#0c5460' : '#721c24', marginBottom: '5px' }}>Bénéfice Net</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: benefice >= 0 ? '#0c5460' : '#721c24' }}>
                          {benefice.toFixed(2)} $
                        </div>
                      </div>
                      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#1976d2', marginBottom: '5px' }}>Paiements Reçus</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                          {totalPaiementsRecus.toFixed(2)} $
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                          {payments.length} versement{payments.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {payments.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Versement</th>
                      <th>Montant</th>
                      <th>Date Reçue</th>
                      <th>Méthode</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(payment => {
                        const client = clients.find(c => c.id === payment.clientId);
                        return (
                          <tr key={payment.id}>
                            <td>
                              <strong>{client ? client.name : 'Client supprimé'}</strong>
                              {client && <><br /><small style={{ color: '#666' }}>{client.address}</small></>}
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                                fontWeight: 'bold', background: '#e3f2fd', color: '#1976d2'
                              }}>
                                {payment.paymentNumber}{payment.paymentNumber === 1 ? 'er' : 'e'} versement
                              </span>
                            </td>
                            <td style={{ fontWeight: 'bold', color: '#28a745' }}>
                              {payment.amount.toFixed(2)} $
                            </td>
                            <td>{payment.date}</td>
                            <td>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                background: payment.paymentMethod === 'cheque' ? '#fff3cd' : '#d4edda',
                                color: payment.paymentMethod === 'cheque' ? '#856404' : '#155724'
                              }}>
                                {payment.paymentMethod === 'cheque' ? 'Chèque' : 'Comptant'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger"
                                onClick={() => deletePayment(payment.id)}
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  color: '#666', fontStyle: 'italic'
                }}>
                  Aucun paiement enregistré pour le moment.
                </div>
              )}

              {/* Détail des paiements par méthode */}
              {payments.length > 0 && (
                <div style={{
                  marginTop: '30px', padding: '20px',
                  background: '#f8f9fa', borderRadius: '12px'
                }}>
                  <h3 style={{ marginBottom: '15px' }}>Répartition par Méthode de Paiement</h3>
                  {(() => {
                    const paymentsParMethode = payments.reduce((acc, payment) => {
                      const methode = payment.paymentMethod === 'cheque' ? 'Chèques' : 'Comptant';
                      acc[methode] = (acc[methode] || 0) + payment.amount;
                      return acc;
                    }, {});

                    return (
                      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        {Object.entries(paymentsParMethode).map(([methode, montant]) => (
                          <div key={methode} style={{
                            background: methode === 'Chèques' ? '#fff3cd' : '#d4edda',
                            padding: '15px 20px', borderRadius: '8px', textAlign: 'center',
                            minWidth: '150px'
                          }}>
                            <div style={{
                              fontSize: '14px',
                              color: methode === 'Chèques' ? '#856404' : '#155724',
                              marginBottom: '5px'
                            }}>
                              {methode}
                            </div>
                            <div style={{
                              fontSize: '20px', fontWeight: 'bold',
                              color: methode === 'Chèques' ? '#856404' : '#155724'
                            }}>
                              {montant.toFixed(2)} $
                            </div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>
                              {payments.filter(p => (p.paymentMethod === 'cheque') === (methode === 'Chèques')).length} paiement{payments.filter(p => (p.paymentMethod === 'cheque') === (methode === 'Chèques')).length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )} 

          {/* Section Tableau de Bord */}
          {activeTab === 'dashboard' && (
            <div className="tab-content">
              <h2 className="section-title">Tableau de Bord Opérationnel</h2>

              <div style={{
                background: 'white',
                borderRadius: '15px',
                padding: '25px',
                marginBottom: '30px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                borderLeft: '5px solid #1a4d1a'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: '#1a4d1a', fontSize: '1.3em', margin: 0 }}>Feuille de Suivi - Cases à cocher</h3>
                  <button
                    className="btn"
                    onClick={() => generateChecklistReport()}
                    style={{
                      background: '#1a4d1a',
                      color: 'white',
                      padding: '10px 20px',
                      fontSize: '14px'
                    }}
                  >
                    Imprimer Feuille de Suivi
                  </button>
                </div>

                {clients.length > 0 ? (
                  <table className="data-table" style={{ fontSize: '14px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Adresse</th>
                        <th style={{ width: '30%' }}>Paiement Reçu</th>
                        <th style={{ width: '30%' }}>Piquets Installés</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients
                        .sort((a, b) => {
                          const rueA = a.address.split(',')[0].trim().toLowerCase();
                          const rueB = b.address.split(',')[0].trim().toLowerCase();
                          return rueA.localeCompare(rueB);
                        })
                        .map(client => {
                          const contract = contracts.find(c => c.clientId === client.id);
                          const firstPaymentReceived = isPaymentReceived(client.id, 1);
                          const secondPaymentReceived = isPaymentReceived(client.id, 2);
                          const stakesInstalled = stakes.find(s => s.clientId === client.id);

                          return (
                            <tr key={client.id}>
                              <td>
                                <div>
                                  <strong style={{ color: '#1a4d1a' }}>{client.name}</strong><br />
                                  <span style={{ color: '#666', fontSize: '12px' }}>{client.address}</span><br />
                                  <span style={{ color: '#999', fontSize: '11px' }}>{client.phone}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {contract ? (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          width: '15px',
                                          height: '15px',
                                          border: '2px solid #1a4d1a',
                                          borderRadius: '3px',
                                          display: 'inline-block',
                                          background: firstPaymentReceived ? '#1a4d1a' : 'white',
                                          position: 'relative'
                                        }}>
                                          {firstPaymentReceived && (
                                            <span style={{
                                              position: 'absolute',
                                              top: '-2px',
                                              left: '1px',
                                              color: 'white',
                                              fontSize: '12px',
                                              fontWeight: 'bold'
                                            }}>✓</span>
                                          )}
                                        </span>
                                        <span style={{ fontSize: '12px' }}>
                                          1er versement ({(contract.amount / 2).toFixed(0)}$)
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          width: '15px',
                                          height: '15px',
                                          border: '2px solid #1a4d1a',
                                          borderRadius: '3px',
                                          display: 'inline-block',
                                          background: secondPaymentReceived ? '#1a4d1a' : 'white',
                                          position: 'relative'
                                        }}>
                                          {secondPaymentReceived && (
                                            <span style={{
                                              position: 'absolute',
                                              top: '-2px',
                                              left: '1px',
                                              color: 'white',
                                              fontSize: '12px',
                                              fontWeight: 'bold'
                                            }}>✓</span>
                                          )}
                                        </span>
                                        <span style={{ fontSize: '12px' }}>
                                          2e versement ({(contract.amount / 2).toFixed(0)}$)
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <span style={{ color: '#999', fontSize: '12px' }}>Aucun contrat</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    width: '15px',
                                    height: '15px',
                                    border: '2px solid #1a4d1a',
                                    borderRadius: '3px',
                                    display: 'inline-block',
                                    background: stakesInstalled ? '#1a4d1a' : 'white',
                                    position: 'relative'
                                  }}>
                                    {stakesInstalled && (
                                      <span style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        left: '1px',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                      }}>✓</span>
                                    )}
                                  </span>
                                  <span style={{ fontSize: '12px' }}>
                                    {stakesInstalled ?
                                      `${stakesInstalled.quantity} piquets (${stakesInstalled.date})` :
                                      'À installer'
                                    }
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                    Aucun client enregistré pour générer la feuille de route.
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>

                <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color: '#1a4d1a', marginBottom: '15px', fontSize: '1.3em' }}>Adresses des Clients</h3>
                  <div>
                    {clients.length > 0 ? (
                      clients.map(client => (
                        <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                          <div>
                            <strong>{client.name}</strong><br />
                            <small style={{ color: '#666' }}>{client.address}</small>
                          </div>
                          <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', background: '#e8f5e8', color: '#2d5a27' }}>
                            {client.type || 'N/A'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Aucun client enregistré</p>
                    )}
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color: '#1a4d1a', marginBottom: '15px', fontSize: '1.3em' }}>Revenus Récents</h3>
                  <div>
                    {invoices.filter(invoice => invoice.type === 'revenu').length > 0 ? (
                      invoices
                        .filter(invoice => invoice.type === 'revenu')
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 5)
                        .map(invoice => {
                          const client = clients.find(c => c.id === invoice.clientId);
                          const clientName = client ? client.name : 'Client supprimé';

                          return (
                            <div key={invoice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                              <div>
                                <strong>{clientName}</strong><br />
                                <small style={{ color: '#666' }}>{invoice.date}</small>
                              </div>
                              <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#d4edda', color: '#155724' }}>
                                {invoice.amount.toFixed(2)}$
                              </span>
                            </div>
                          );
                        })
                    ) : (
                      <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Aucun revenu enregistré</p>
                    )}
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color: '#1a4d1a', marginBottom: '15px', fontSize: '1.3em' }}>Piquets Installés</h3>
                  <div>
                    {stakes.length > 0 ? (
                      stakes.map(stake => {
                        const client = clients.find(c => c.id === stake.clientId);
                        const clientName = client ? client.name : 'Client supprimé';

                        return (
                          <div key={stake.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                            <div>
                              <strong>{clientName}</strong><br />
                              <small style={{ color: '#666' }}>{stake.date} - {stake.quantity} piquets</small>
                            </div>
                            <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#e8f5e8', color: '#2d5a27' }}>
                              Installé
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Aucune installation de piquets enregistrée</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )} 
          {/* Section Interventions */}
          {activeTab === 'interventions' && (
            <div className="tab-content">
              <h2 className="section-title">Planification des Interventions</h2>

              <div className="form-group">
                <div className="form-row">
                  <div style={{ position: 'relative' }}>
                    <label>Client</label>
                    <input
                      type="text"
                      value={interventionClientSearch}
                      onChange={(e) => {
                        setInterventionClientSearch(e.target.value);
                        setShowInterventionClientSuggestions(true);
                        if (!e.target.value) {
                          setInterventionForm({ ...interventionForm, clientId: '' });
                        }
                      }}
                      onFocus={() => setShowInterventionClientSuggestions(true)}
                      placeholder="Tapez le nom ou l'adresse du client..."
                    />

                    {showInterventionClientSuggestions && interventionClientSearch && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #ddd', borderRadius: '8px',
                        maxHeight: '200px', overflowY: 'auto', zIndex: 10,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}>
                        {getFilteredInterventionClients().map(client => (
                          <div
                            key={client.id}
                            onClick={() => handleInterventionClientSelect(client)}
                            style={{
                              padding: '10px 15px', cursor: 'pointer',
                              borderBottom: '1px solid #eee'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            <strong>{client.name}</strong><br />
                            <small style={{ color: '#666' }}>{client.address}</small>
                          </div>
                        ))}
                        {getFilteredInterventionClients().length === 0 && (
                          <div style={{ padding: '10px 15px', color: '#666', fontStyle: 'italic' }}>
                            Aucun client trouvé pour "{interventionClientSearch}"
                          </div>
                        )}
                      </div>
                    )}

                    {showInterventionClientSuggestions && (
                      <button
                        type="button"
                        onClick={() => setShowInterventionClientSuggestions(false)}
                        style={{
                          position: 'absolute', right: '10px', top: '35px',
                          background: 'transparent', border: 'none',
                          fontSize: '16px', cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div>
                    <label>Date prévue</label>
                    <input
                      type="date"
                      value={interventionForm.datePrevu}
                      onChange={(e) => setInterventionForm({ ...interventionForm, datePrevu: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label>Heure de début</label>
                    <input
                      type="time"
                      value={interventionForm.heureDebut}
                      onChange={(e) => setInterventionForm({ ...interventionForm, heureDebut: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Heure de fin</label>
                    <input
                      type="time"
                      value={interventionForm.heureFin}
                      onChange={(e) => setInterventionForm({ ...interventionForm, heureFin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div>
                    <label>Équipe</label>
                    <select
                      value={interventionForm.equipe}
                      onChange={(e) => setInterventionForm({ ...interventionForm, equipe: e.target.value })}
                    >
                      <option value="Équipe 1">Équipe 1</option>
                      <option value="Équipe 2">Équipe 2</option>
                      <option value="Équipe 3">Équipe 3</option>
                    </select>
                  </div>
                  <div>
                    <label>Type de service</label>
                    <select
                      value={interventionForm.typeService}
                      onChange={(e) => setInterventionForm({ ...interventionForm, typeService: e.target.value })}
                    >
                      <option value="deneigement">Déneigement</option>
                      <option value="salage">Salage</option>
                      <option value="complet">Déneigement + Salage</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label>Notes spéciales</label>
                  <textarea
                    rows="3"
                    value={interventionForm.notes}
                    onChange={(e) => setInterventionForm({ ...interventionForm, notes: e.target.value })}
                    placeholder="Instructions particulières, accès, etc."
                  />
                </div>

                <button className="btn" onClick={addIntervention}>
                  Planifier Intervention
                </button>
              </div>

              {interventions.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date/Heure</th>
                      <th>Client</th>
                      <th>Équipe</th>
                      <th>Service</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interventions
                      .sort((a, b) => new Date(b.datePrevu + ' ' + b.heureDebut) - new Date(a.datePrevu + ' ' + a.heureDebut))
                      .map(intervention => {
                        const client = clients.find(c => c.id === intervention.clientId);
                        return (
                          <tr key={intervention.id}>
                            <td>
                              <div>{intervention.datePrevu}</div>
                              <small>{intervention.heureDebut} - {intervention.heureFin}</small>
                            </td>
                            <td>
                              <strong>{client ? client.name : 'Client supprimé'}</strong>
                              {client && <><br /><small style={{ color: '#666' }}>{client.address}</small></>}
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                background: '#e3f2fd', color: '#1976d2'
                              }}>
                                {intervention.equipe}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                background: intervention.typeService === 'deneigement' ? '#e8f5e8' :
                                  intervention.typeService === 'salage' ? '#fff3cd' : '#f3e5f5',
                                color: intervention.typeService === 'deneigement' ? '#1a4d1a' :
                                  intervention.typeService === 'salage' ? '#856404' : '#7b1fa2'
                              }}>
                                {intervention.typeService === 'deneigement' ? 'Déneigement' :
                                  intervention.typeService === 'salage' ? 'Salage' : 'Complet'}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                background: intervention.statut === 'planifie' ? '#fff3cd' :
                                  intervention.statut === 'en_cours' ? '#d1ecf1' :
                                    intervention.statut === 'termine' ? '#d4edda' : '#f8d7da',
                                color: intervention.statut === 'planifie' ? '#856404' :
                                  intervention.statut === 'en_cours' ? '#0c5460' :
                                    intervention.statut === 'termine' ? '#155724' : '#721c24'
                              }}>
                                {intervention.statut === 'planifie' ? 'Planifiée' :
                                  intervention.statut === 'en_cours' ? 'En cours' :
                                    intervention.statut === 'termine' ? 'Terminée' : 'Annulée'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                {intervention.statut === 'planifie' && (
                                  <button
                                    onClick={() => updateInterventionStatus(intervention.id, 'en_cours')}
                                    style={{ padding: '5px 10px', fontSize: '12px', background: '#007bff' }}
                                    className="btn"
                                  >
                                    Démarrer
                                  </button>
                                )}

                                {intervention.statut === 'en_cours' && (
                                  <button
                                    onClick={() => updateInterventionStatus(intervention.id, 'termine')}
                                    style={{ padding: '5px 10px', fontSize: '12px', background: '#28a745' }}
                                    className="btn"
                                  >
                                    Terminer
                                  </button>
                                )}
                                <button
                                  className="btn btn-danger"
                                  onClick={() => deleteIntervention(intervention.id)}
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}
  {/* Section Terrain */}
      {activeTab === 'terrain' && (
        <div className="tab-content">
          <h2 className="section-title">🚛 Vue Équipe Terrain</h2>
          
          {/* Section GPS optimisée web */}
          <div style={{
            background: '#f8f9fa', padding: '20px', borderRadius: '15px',
            marginBottom: '20px', border: isLocationShared ? '3px solid #28a745' : '1px solid #ddd'
          }}>
            <h3 style={{margin: '0 0 15px 0', color: '#1a4d1a'}}>📍 Position GPS</h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px'}}>
              <button 
                onClick={getCurrentPosition}
                style={{
                  padding: '15px 20px', background: '#007bff', color: 'white',
                  border: 'none', borderRadius: '8px', fontWeight: 'bold',
                  fontSize: '16px', cursor: 'pointer'
                }}
              >
                📍 Obtenir Position GPS
              </button>
              
              {gpsPosition && (
              <button onClick={async () => {
  try {
    await shareLocationWithClients();
  } catch (error) {
    console.error('Erreur partage:', error);
  }
}}>
                  📤 Partager avec Clients
                </button>
              )}

              {isTrackingActive && (
                <button 
                  onClick={stopLocationTracking}
                  style={{
                    padding: '15px 20px', background: '#dc3545', color: 'white',
                    border: 'none', borderRadius: '8px', fontWeight: 'bold',
                    fontSize: '16px', cursor: 'pointer'
                  }}
                >
                  ⏹ Arrêter Suivi
                </button>
              )}
            </div>
            
            {gpsPosition && (
              <div style={{
                background: '#d4edda', padding: '15px', borderRadius: '12px',
                border: '1px solid #c3e6cb', marginTop: '15px'
              }}>
                <h4 style={{margin: '0 0 10px 0', color: '#155724'}}>Position Actuelle</h4>
                <div style={{fontSize: '14px'}}>
                  <strong>Adresse:</strong><br />
                  <span>{gpsPosition.address || 'Calcul en cours...'}</span>
                </div>
                <div style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
                  Précision: {gpsPosition.accuracy}m | Méthode: {gpsPosition.method}
                </div>
              </div>
            )}

            {gpsError && (
              <div style={{
                background: '#f8d7da', padding: '15px', borderRadius: '12px',
                border: '1px solid #f5c6cb', marginTop: '15px', color: '#721c24'
              }}>
                <strong>Erreur GPS:</strong> {gpsError}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div style={{
            background: 'white', 
            padding: '20px', 
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
            marginBottom: '20px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{color: '#1a4d1a', marginBottom: '15px'}}>🚀 Actions Rapides</h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px'}}>
              <button 
                onClick={() => {
                  const message = "🌅 Bonjour! Notre équipe de déneigement commence sa tournée aujourd'hui.";
                  clients.forEach(client => {
                    setTimeout(() => {
                      sendNotificationViaBackend(client.id, 'custom', message);
                    }, Math.random() * 5000);
                  });
                }}
                style={{
                  padding: '15px 20px', background: '#17a2b8', color: 'white',
                  border: 'none', borderRadius: '8px', fontWeight: 'bold',
                  fontSize: '16px', cursor: 'pointer'
                }}
              >
                🌅 Notifier Début de Journée
              </button>
              
              <button 
                onClick={() => {
                  const message = "🌙 Bonsoir! Notre équipe a terminé sa tournée pour aujourd'hui. Merci de votre patience et à bientôt!";
                  clients.forEach(client => {
                    setTimeout(() => {
                      sendNotificationViaBackend(client.id, 'custom', message);
                    }, Math.random() * 5000);
                  });
                }}
                style={{
                  padding: '15px 20px', background: '#6f42c1', color: 'white',
                  border: 'none', borderRadius: '8px', fontWeight: 'bold',
                  fontSize: '16px', cursor: 'pointer'
                }}
              >
                🌙 Notifier Fin de Journée
              </button>
              
              <button 
                onClick={checkBackendConnection}
                style={{
                  padding: '15px 20px', 
                  background: backendConnected ? '#28a745' : '#dc3545', 
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
                }}
              >
                {backendConnected ? '✅ Backend Connecté' : '❌ Test Connexion'}
              </button>
            </div>
          </div>

          {/* Interventions du jour */}
          <div style={{
            background: 'white', padding: '20px', borderRadius: '15px',
            marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{color: '#1a4d1a', marginBottom: '15px'}}>⚡ Interventions du Jour</h3>
            
            {interventions
              .filter(i => {
                const today = new Date().toISOString().split('T')[0];
                return i.datePrevu === today && (i.statut === 'planifie' || i.statut === 'en_cours');
              })
              .length > 0 ? (
              <div style={{display: 'grid', gap: '15px'}}>
                {interventions
                  .filter(i => {
                    const today = new Date().toISOString().split('T')[0];
                    return i.datePrevu === today && (i.statut === 'planifie' || i.statut === 'en_cours');
                  })
                  .map(intervention => {
                    const client = clients.find(c => c.id === intervention.clientId);
                    return (
                      <div key={intervention.id} style={{
                        background: intervention.statut === 'en_cours' ? '#e3f2fd' : '#f8f9fa',
                        padding: '15px', borderRadius: '12px',
                        border: intervention.statut === 'en_cours' ? '2px solid #007bff' : '1px solid #ddd'
                      }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                          <div>
                            <h4 style={{color: '#1a4d1a', margin: '0 0 5px 0'}}>{client?.name || 'Client supprimé'}</h4>
                            <p style={{margin: '0', color: '#666', fontSize: '14px'}}>{client?.address}</p>
                            <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '14px'}}>📞 {client?.phone}</p>
                          </div>
                          
                          <div style={{textAlign: 'right'}}>
                            <span style={{
                              padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                              background: intervention.statut === 'planifie' ? '#fff3cd' : '#d1ecf1',
                              color: intervention.statut === 'planifie' ? '#856404' : '#0c5460'
                            }}>
                              {intervention.statut === 'planifie' ? 'À faire' : 'En cours'}
                            </span>
                            <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                              {intervention.heureDebut} - {intervention.heureFin}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px'}}>
                          {intervention.statut === 'planifie' && (
                            <button 
                              onClick={() => updateInterventionStatus(intervention.id, 'en_cours')}
                              style={{
                                padding: '10px 15px', background: '#007bff', color: 'white',
                                border: 'none', borderRadius: '6px', fontWeight: 'bold',
                                fontSize: '14px', cursor: 'pointer'
                              }}
                            >
                              ▶️ Commencer
                            </button>
                          )}
                          
                          {intervention.statut === 'en_cours' && (
                            <button 
                              onClick={() => updateInterventionStatus(intervention.id, 'termine')}
                              style={{
                                padding: '10px 15px', background: '#28a745', color: 'white',
                                border: 'none', borderRadius: '6px', fontWeight: 'bold',
                                fontSize: '14px', cursor: 'pointer'
                              }}
                            >
                              ✅ Terminer
                            </button>
                          )}
                          
                          {client && client.phone && (
                            <button 
                              onClick={() => {
                                const notifType = intervention.statut === 'planifie' ? 'enroute' : 'completion';
                                sendNotificationViaBackend(client.id, notifType);
                              }}
                              style={{
                                padding: '10px 15px', background: '#fd7e14', color: 'white',
                                border: 'none', borderRadius: '6px', fontWeight: 'bold',
                                fontSize: '14px', cursor: 'pointer'
                              }}
                            >
                              📱 Notifier
                            </button>
                          )}
                        </div>
                        
                        {intervention.notes && (
                          <div style={{
                            marginTop: '10px', padding: '10px', background: 'rgba(26, 77, 26, 0.1)',
                            borderRadius: '8px', fontSize: '14px'
                          }}>
                            <strong>Notes: </strong>{intervention.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: '#f8f9fa', borderRadius: '12px',
                color: '#666', fontSize: '16px'
              }}>
                Aucune intervention prévue aujourd'hui
              </div>
            )}
          </div>
        </div>
      )}
{/* Section Notifications avec recherche de rues corrigée */}
{activeTab === 'notifications' && (
  <div className="tab-content">
    <h2 className="section-title">📱 Notifications par Rue</h2>
    
    <div style={{
      background: backendConnected ? '#d4edda' : '#f8d7da',
      padding: '15px', borderRadius: '10px',
      marginBottom: '20px', textAlign: 'center', fontWeight: 'bold',
      color: backendConnected ? '#155724' : '#721c24'
    }}>
      {backendConnected ? '🟢 Connecté - Notifications réelles' : '🔴 Déconnecté - Notifications simulées'}
    </div>

    {/* Configuration globale des notifications */}
    <div style={{
      background: '#f8f9fa', padding: '20px', borderRadius: '12px',
      marginBottom: '20px', border: '1px solid #ddd'
    }}>
      <h4 style={{marginBottom: '15px', color: '#495057'}}>Configuration des notifications</h4>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px'}}>
        <div>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
            Type de notification:
          </label>
          <select 
            value={bulkNotificationType} 
            onChange={(e) => setBulkNotificationType(e.target.value)}
            style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd'}}
          >
            <option value="enroute">🚛 En route</option>
            <option value="completion">✅ Service terminé</option>
            <option value="reminder">💰 Rappel paiement</option>
            <option value="custom">✏️ Message personnalisé</option>
          </select>
        </div>
        
        <div>
          <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold'}}>
            Message personnalisé:
          </label>
          <textarea 
            value={bulkCustomMessage}
            onChange={(e) => setBulkCustomMessage(e.target.value)}
            placeholder={bulkNotificationType === 'custom' ? 'Saisissez votre message...' : 'Message optionnel pour remplacer le message par défaut'}
            style={{
              width: '100%', padding: '10px', borderRadius: '6px', 
              border: '1px solid #ddd', minHeight: '60px', resize: 'vertical'
            }}
          />
        </div>
      </div>

      {/* Section de recherche de rues améliorée */}
      <div style={{
        marginTop: '20px', padding: '20px', background: '#e8f5e8',
        borderRadius: '12px', border: '1px solid #c3e6cb'
      }}>
        <h5 style={{marginBottom: '15px', color: '#155724', display: 'flex', alignItems: 'center', gap: '8px'}}>
          🔍 Recherche et sélection de rues
        </h5>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginBottom: '15px'}}>
          <div>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px'}}>
              Rechercher par nom de rue:
            </label>
            <input
              type="text"
              value={streetSearchTerm}
              onChange={(e) => setStreetSearchTerm(e.target.value)}
              placeholder="Ex: principale, saint-jean, maple, 1re avenue..."
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '2px solid #28a745', fontSize: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <small style={{color: '#666', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Tapez une partie du nom de rue pour filtrer les résultats
            </small>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <button
              onClick={() => {
                if (!streetSearchTerm.trim()) {
                  alert('Veuillez saisir un terme de recherche');
                  return;
                }
                
                // Obtenir toutes les rues uniques avec groupement correct
                const streetGroups = groupClientsByStreet(clients);
                const allStreets = Object.keys(streetGroups);
                
                // Filtrer les rues qui contiennent le terme recherché (insensible à la casse)
                const matchingStreets = allStreets.filter(street =>
                  street.toLowerCase().includes(streetSearchTerm.toLowerCase())
                );
                
                if (matchingStreets.length === 0) {
                  alert(`Aucune rue trouvée contenant "${streetSearchTerm}"`);
                  return;
                }
                
                // Ajouter les rues correspondantes à la sélection (éviter les doublons)
                setSelectedStreets(prev => {
                  const newSelection = [...new Set([...prev, ...matchingStreets])];
                  return newSelection;
                });
                
                // Feedback utilisateur
                const addedCount = matchingStreets.filter(street => 
                  !selectedStreets.includes(street)
                ).length;
                
                if (addedCount > 0) {
                  alert(`${addedCount} nouvelle(s) rue(s) ajoutée(s) à la sélection`);
                } else {
                  alert('Toutes les rues trouvées sont déjà sélectionnées');
                }
              }}
              style={{
                padding: '12px 15px', background: '#28a745', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 'bold', whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              ➕ Ajouter
            </button>
            
            <button
              onClick={() => {
                if (!streetSearchTerm.trim()) {
                  // Si pas de terme de recherche, sélectionner toutes les rues
                  const streetGroups = groupClientsByStreet(clients);
                  const allStreets = Object.keys(streetGroups);
                  setSelectedStreets(allStreets);
                  alert(`${allStreets.length} rues sélectionnées`);
                } else {
                  // Sélectionner toutes les rues correspondant au terme de recherche
                  const streetGroups = groupClientsByStreet(clients);
                  const allStreets = Object.keys(streetGroups);
                  const matchingStreets = allStreets.filter(street =>
                    street.toLowerCase().includes(streetSearchTerm.toLowerCase())
                  );
                  
                  if (matchingStreets.length > 0) {
                    setSelectedStreets(matchingStreets);
                    alert(`${matchingStreets.length} rues correspondantes sélectionnées`);
                  } else {
                    alert(`Aucune rue trouvée pour "${streetSearchTerm}"`);
                  }
                }
              }}
              style={{
                padding: '8px 12px', background: '#007bff', color: 'white',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap'
              }}
            >
              Tout sélectionner
            </button>
          </div>
        </div>

        {/* Actions de sélection rapide */}
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px'}}>
          <button
            onClick={() => setSelectedStreets([])}
            style={{
              padding: '6px 10px', background: '#6c757d', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '12px'
            }}
          >
            🗑️ Vider sélection
          </button>

          {/* Boutons de sélection rapide par type de rue */}
          {['rue', 'avenue', 'boulevard', 'chemin', 'rang', 'place'].map(type => {
            const streetGroups = groupClientsByStreet(clients);
            const matchingStreets = Object.keys(streetGroups).filter(street => 
              street.toLowerCase().includes(type)
            );
            
            if (matchingStreets.length === 0) return null;
            
            return (
              <button
                key={type}
                onClick={() => {
                  setSelectedStreets(prev => [...new Set([...prev, ...matchingStreets])]);
                  alert(`${matchingStreets.length} ${type}(s) ajoutée(s)`);
                }}
                style={{
                  padding: '6px 10px', background: '#17a2b8', color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: 'bold', fontSize: '12px', textTransform: 'capitalize'
                }}
              >
                {type} ({matchingStreets.length})
              </button>
            );
          })}
        </div>

        {/* Aperçu des rues disponibles avec recherche en temps réel */}
        {(() => {
          const streetGroups = groupClientsByStreet(clients);
          const allStreets = Object.keys(streetGroups).sort();

          const filteredStreets = streetSearchTerm 
            ? allStreets.filter(street => 
                street.toLowerCase().includes(streetSearchTerm.toLowerCase())
              )
            : allStreets.slice(0, 15); // Montrer les 15 premières si pas de recherche

          return (
            <div>
              <div style={{fontSize: '14px', color: '#666', marginBottom: '10px', fontWeight: 'bold'}}>
                {streetSearchTerm 
                  ? `Rues contenant "${streetSearchTerm}" (${allStreets.filter(street => 
                      street.toLowerCase().includes(streetSearchTerm.toLowerCase())
                    ).length} trouvée(s)):`
                  : `Aperçu des rues disponibles (${allStreets.length} au total):`
                }
              </div>
              
              <div style={{
                maxHeight: '200px', overflowY: 'auto',
                background: 'white', padding: '15px', borderRadius: '8px',
                border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {filteredStreets.length > 0 ? (
                  <div style={{display: 'grid', gap: '8px'}}>
                    {filteredStreets.map(street => {
                      const clientCount = streetGroups[street]?.length || 0;
                      const isSelected = selectedStreets.includes(street);
                      
                      return (
                        <div
                          key={street}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStreets(prev => prev.filter(s => s !== street));
                            } else {
                              setSelectedStreets(prev => [...prev, street]);
                            }
                          }}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 12px', borderRadius: '8px',
                            background: isSelected ? '#d4edda' : '#f8f9fa',
                            border: `2px solid ${isSelected ? '#28a745' : '#e9ecef'}`,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 2px 8px rgba(40, 167, 69, 0.2)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.target.style.background = '#e9ecef';
                              e.target.style.borderColor = '#adb5bd';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.target.style.background = '#f8f9fa';
                              e.target.style.borderColor = '#e9ecef';
                            }
                          }}
                        >
                          <div>
                            <div style={{
                              fontWeight: 'bold', 
                              color: isSelected ? '#155724' : '#1a4d1a', 
                              marginBottom: '2px',
                              fontSize: '14px'
                            }}>
                              📍 {street}
                            </div>
                            <div style={{fontSize: '12px', color: '#666'}}>
                              {clientCount} client{clientCount !== 1 ? 's' : ''}
                              {streetGroups[street] && (
                                ` • ${streetGroups[street].filter(c => c.phone || c.email).length} contactable${streetGroups[street].filter(c => c.phone || c.email).length !== 1 ? 's' : ''}`
                              )}
                            </div>
                          </div>
                          
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '6px',
                            background: isSelected ? '#28a745' : '#e9ecef',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isSelected ? 'white' : '#6c757d', 
                            fontWeight: 'bold', fontSize: '14px',
                            transition: 'all 0.2s ease'
                          }}>
                            {isSelected ? '✓' : '+'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px'}}>
                    {streetSearchTerm ? `Aucune rue trouvée contenant "${streetSearchTerm}"` : 'Aucune rue disponible'}
                  </div>
                )}
                
                {!streetSearchTerm && allStreets.length > 15 && (
                  <div style={{
                    textAlign: 'center', padding: '10px', 
                    color: '#666', fontSize: '12px', fontStyle: 'italic',
                    borderTop: '1px solid #e9ecef', marginTop: '10px'
                  }}>
                    ... et {allStreets.length - 15} autres rues. Utilisez la recherche pour les trouver.
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Résumé de la sélection amélioré */}
      {selectedStreets.length > 0 && (
        <div style={{
          marginTop: '20px', padding: '20px', background: '#d1ecf1',
          borderRadius: '12px', border: '1px solid #bee5eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px'}}>
            <div>
              <strong style={{color: '#0c5460', fontSize: '18px'}}>
                📋 Sélection actuelle: {selectedStreets.length} rue{selectedStreets.length !== 1 ? 's' : ''}
              </strong>
              <div style={{fontSize: '14px', color: '#0c5460', marginTop: '5px'}}>
                {(() => {
                  const streetGroups = groupClientsByStreet(clients);
                  const totalClients = selectedStreets.reduce((total, street) => {
                    return total + (streetGroups[street]?.length || 0);
                  }, 0);
                  return `${totalClients} client${totalClients !== 1 ? 's' : ''} au total`;
                })()}
              </div>
            </div>
            
            <button 
              onClick={sendBulkStreetNotifications}
              disabled={selectedStreets.length === 0 || isSendingBulk}
              style={{
                padding: '15px 25px',
                background: selectedStreets.length > 0 && !isSendingBulk ? '#dc3545' : '#e9ecef',
                color: selectedStreets.length > 0 && !isSendingBulk ? 'white' : '#6c757d',
                border: 'none', borderRadius: '8px',
                fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: selectedStreets.length > 0 && !isSendingBulk ? '0 4px 12px rgba(220, 53, 69, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {isSendingBulk ? '⏳ Envoi en cours...' : `📤 Envoyer à ${selectedStreets.length} rue${selectedStreets.length !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Liste des rues sélectionnées avec compteur de clients */}
          <div style={{maxHeight: '150px', overflowY: 'auto'}}>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {selectedStreets.map(street => {
                const streetGroups = groupClientsByStreet(clients);
                const clientCount = streetGroups[street]?.length || 0;
                
                return (
                  <span
                    key={street}
                    style={{
                      padding: '8px 12px', background: '#0c5460', color: 'white',
                      borderRadius: '20px', fontSize: '13px', fontWeight: 'bold',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span>{street} ({clientCount})</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStreets(prev => prev.filter(s => s !== street));
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.3)', border: 'none',
                        borderRadius: '50%', width: '18px', height: '18px',
                        cursor: 'pointer', fontSize: '12px', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title={`Retirer ${street} de la sélection`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Historique des Notifications (reste identique) */}
    <div style={{
      background: 'white',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      marginTop: '30px'
    }}>
      <h3 style={{ marginBottom: '20px' }}>📋 Historique des Notifications</h3>

      {notificationLogs.length > 0 ? (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Client</th>
                <th>Type</th>
                <th>Canal</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {notificationLogs.slice(0, 50).map(notification => (
                <tr key={notification.id}>
                  <td>
                    <div>{new Date(notification.sentAt).toLocaleDateString('fr-CA')}</div>
                    <small>{new Date(notification.sentAt).toLocaleTimeString('fr-CA')}</small>
                  </td>
                  <td><strong>{notification.clientName}</strong></td>
                  <td>
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                      background: notification.type === 'completion' ? '#d4edda' :
                        notification.type === 'reminder' ? '#fff3cd' : 
                        notification.type === 'custom' ? '#e3f2fd' : '#f8d7da',
                      color: notification.type === 'completion' ? '#155724' :
                        notification.type === 'reminder' ? '#856404' : 
                        notification.type === 'custom' ? '#1976d2' : '#721c24'
                    }}>
                      {notification.type === 'completion' ? 'Service terminé' :
                        notification.type === 'reminder' ? 'Rappel paiement' : 
                        notification.type === 'custom' ? 'Message personnalisé' : 'En route'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {notification.sms && (
                        <span style={{
                          padding: '2px 6px', borderRadius: '10px', fontSize: '10px',
                          background: '#fff3cd', color: '#856404', fontWeight: 'bold'
                        }}>SMS</span>
                      )}
                      {notification.email && (
                        <span style={{
                          padding: '2px 6px', borderRadius: '10px', fontSize: '10px',
                          background: '#e3f2fd', color: '#1976d2', fontWeight: 'bold'
                        }}>Email</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                      background: notification.simulated ? '#fff3cd' : '#d4edda',
                      color: notification.simulated ? '#856404' : '#155724'
                    }}>
                      {notification.simulated ? 'Simulé' : 'Envoyé'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '40px',
          background: '#f8f9fa', borderRadius: '12px',
          color: '#666', fontStyle: 'italic'
        }}>
          Aucune notification envoyée pour le moment
        </div>
      )}
    </div>
  </div>
)}
  {/* Modal pour les contrats */}
      {showContractModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', margin: '20px', padding: '30px',
            borderRadius: '15px', maxHeight: '90vh', overflow: 'auto', maxWidth: '90vw'
          }}>
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button
                className="btn btn-danger"
                onClick={() => setShowContractModal(false)}
              >
                Fermer
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: contractContent }}></div>
          </div>
        </div>
      )}
       
    {/* Modal de paiement */}
      {paymentModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '20px',
            width: '100%', maxWidth: '400px'
          }}>
            <h3 style={{color: '#1a4d1a', marginBottom: '15px', fontSize: '1.2em'}}>
              Paiement de {paymentModal.amount.toFixed(0)}$ reçu
            </h3>
            <p style={{color: '#666', marginBottom: '20px', fontSize: '14px'}}>
              Comment le paiement a-t-il été reçu ?
            </p>
            
            <div style={{display: 'grid', gap: '10px', marginBottom: '15px'}}>
              <button
                onClick={() => handlePaymentMethodSelect('cheque')}
                style={{
                  padding: '15px 20px', border: '2px solid #007bff',
                  borderRadius: '8px', background: 'white', cursor: 'pointer',
                  fontSize: '16px', fontWeight: 'bold', color: '#007bff'
                }}
              >
                📄 Chèque
              </button>
              
              <button
                onClick={() => handlePaymentMethodSelect('comptant')}
                style={{padding: '15px 20px', border: '2px solid #28a745',
                  borderRadius: '8px', background: 'white', cursor: 'pointer',
                  fontSize: '16px', fontWeight: 'bold', color: '#28a745'
                }}
              >
                💰 Argent comptant
              </button>
            </div>
            
            <button
              onClick={closePaymentModal}
              style={{
                padding: '12px 20px', border: 'none',
                background: '#6c757d', color: 'white', borderRadius: '8px',
                cursor: 'pointer', width: '100%', fontSize: '14px'
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
{showInstallPrompt && !isInstalled && (
  <button
    onClick={installApp}
    style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1a4d1a',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000
    }}
  >
    Installer l'App
  </button>
)}
</div>
  )};
    }

    
export default App;