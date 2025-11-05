import React, { useState, useEffect } from 'react'; 
import './App.css';

function App() { 
  // TOUS LES ÉTATS
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://backend-1-ohz7.onrender.com';
  console.log('https://backend-1-ohz7.onrender.com:' ,API_BASE_URL);

  const [backendConnected, setBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractContent, setContractContent] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState('');
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    clientId: null,
    paymentNumber: null,
    amount: 0,
    customAmount: undefined
  });
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingContract, setEditingContract] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [bulkNotificationType, setBulkNotificationType] = useState('enroute');
const [bulkCustomMessage, setBulkCustomMessage] = useState('');
const [isSendingBulk, setIsSendingBulk] = useState(false);
const [gpsPosition, setGpsPosition] = useState(null);
const [gpsError, setGpsError] = useState(null);
const [isLocationShared, setIsLocationShared] = useState(false);
const [shareToken, setShareToken] = useState(null);
const [isTrackingActive, setIsTrackingActive] = useState(false);
const [trackingInterval, setTrackingInterval] = useState(null);
const [selectedStreets, setSelectedStreets] = useState([]);
const [streetSearchTerm, setStreetSearchTerm] = useState('');
const [needsBackup, setNeedsBackup] = useState(false);
const [notificationsHistory, setNotificationsHistory] = useState([]);
const [notificationLogs, setNotificationLogs] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]); // États pour la recherche avancée
  const [showAddClientModal, setShowAddClientModal] = useState(false);
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
  name: '', phone: '', phone2: '', email: '', type: '', address: '',
  paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
  firstPaymentMethod: '', secondPaymentMethod: '',
  // ✅ NOUVEAUX CHAMPS POUR LE CONTRAT
  contractType: 'saisonnier',
  contractAmount: '',
  startDate: '',
  endDate: '',
  contractNotes: ''
});
  const [editClientForm, setEditClientForm] = useState({
    name: '', phone: '', email: '', type: '', address: '',
    paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
    firstPaymentMethod: '', secondPaymentMethod: '', firstPaymentDateReelle: '',
    secondPaymentDateReelle: '' 
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
  // INITIALISATION
useEffect(() => {
  const loadData = async () => {
    console.log('=== DÉMARRAGE APP RENDER ===');
    
    const clientsData = loadFromStorage('clients');
    const contractsData = loadFromStorage('contracts');
    const invoicesData = loadFromStorage('invoices');
    const paymentsData = loadFromStorage('payments');
    
    setClients(clientsData);
    setContracts(contractsData);
    setInvoices(invoicesData);
    setPayments(paymentsData);
    
    const lastSyncStored = localStorage.getItem('lastSync');
    setLastSync(lastSyncStored || 'Jamais');
    
    // Vérification initiale du backend
    await checkBackendConnection();
    
    setTimeout(() => { 
      archiveOldContracts();
      checkAndMarkPaymentsReceived();
    }, 1000);
  };    

  loadData();

  const handleOnline = () => { 
    setIsOnline(true); 
    syncData(); 
  };
  
  const handleOffline = () => setIsOnline(false);
  
  // Configuration des intervals et event listeners
  const backendInterval = setInterval(checkBackendConnection, 60000);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
    
  // Fonction de nettoyage retournée par useEffect
  return () => {
    clearInterval(backendInterval);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []); // ← Fermez le premier useEffect ici

// ✅ Second useEffect séparé
useEffect(() => {
  if (clients.length === 0) {
    console.log('⏳ En attente du chargement des clients...');
    return;
  }
  
  console.log('✅ Données React chargées, lancement vérification automatique');
  console.log(`👥 ${clients.length} clients dans l'état React`);
  console.log(`📋 ${contracts.length} contrats dans l'état React`);
  console.log(`💰 ${payments.length} paiements dans l'état React`);
  
  const timer = setTimeout(() => {
    console.log('🔄 Lancement vérification automatique...');
    archiveOldContracts();
    checkAndMarkPaymentsReceived();
  }, 500);
  
  const paymentCheckInterval = setInterval(() => {
    console.log('⏰ Vérification périodique des paiements...');
    checkAndMarkPaymentsReceived();
  }, 300000);
  
  return () => {
    clearTimeout(timer);
    clearInterval(paymentCheckInterval);
  };
}, [clients.length, contracts.length]); // ← Fermez le second useEffect ici

// ✅ FONCTIONS DE STOCKAGE (en dehors des useEffect)
const loadFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Erreur loadFromStorage:', error);
    return defaultValue;
  }
};

const saveToStorage = async (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem('lastModified', new Date().toISOString());
    
    try {
      await syncWithBackend(key, data);
      setNeedsBackup(false);
    } catch (backendError) {
      console.log('Backend sync échoué, données sauvées localement');
      setNeedsBackup(true);
    }
  } catch (error) {
    console.error('Erreur de sauvegarde:', error);
  }
};

// ✅ VÉRIFICATION CONNEXION BACKEND (en dehors des useEffect)
const checkBackendConnection = async () => {
  try {
    console.log('=== TEST CONNEXION BACKEND ===');
    console.log('URL:', API_BASE_URL);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('Statut réponse:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      setBackendConnected(true);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status, response.statusText);
      console.error('Corps de l\'erreur:', errorText);
      setBackendConnected(false);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur complète:', error);
    
    if (error.name === 'AbortError') {
      console.error('Timeout - Backend trop lent');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('Problème réseau ou CORS');
    }
    
    setBackendConnected(false);
    return false;
  }
};

  // SYNCHRONISATION AVEC BACKEND
  const syncWithBackend = async (key, data) => {
    try {
      const allCurrentData = {
        clients: key === 'clients' ? data : clients,
        contracts: key === 'contracts' ? data : contracts,
        invoices: key === 'invoices' ? data : invoices,
        payments: key === 'payments' ? data : payments,
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
// FONCTION SIMPLIFIÉE - COMME AVANT
const checkAndMarkPaymentsReceived = () => {
  // Éviter les doubles exécutions
  if (sessionStorage.getItem('checkingPayments') === 'true') {
    return false;
  }
  sessionStorage.setItem('checkingPayments', 'true'); 
  
  try {
    console.log('🔍 === DÉBUT VÉRIFICATION AUTO-PAIEMENTS ===');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ TOUJOURS lire depuis localStorage pour avoir les données fraîches
    const freshClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const freshPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    const freshInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const freshContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
    
  let updatedPayments = false;
  const newPayments = [...freshPayments];
  const newInvoices = [...freshInvoices];
  const newClients = [...freshClients];  // ← Utilise les données fraîches

  console.log('👥 Nombre de clients:', freshClients.length);
  console.log('📋 Nombre de contrats:', freshContracts.length);
  console.log('💰 Nombre de paiements existants:', freshPayments.length);

  newClients.forEach((client, index) => {
    const contract = freshContracts.find(c => c.clientId === client.id && !c.archived);
    if (!contract) {
      console.log(`⏭️ ${client.name}: Pas de contrat actif`);
      return;
    }

    console.log(`\n🔍 Analyse: ${client.name}`);
    console.log(`  - Structure: ${client.paymentStructure} versement(s)`); 
    console.log(`  - 1er paiement prévu: ${client.firstPaymentDate}`);

    // ✅ VÉRIFIER 1ER PAIEMENT - VERSION SIMPLIFIÉE
    if (client.firstPaymentDate && client.firstPaymentMethod === 'cheque') {
      const firstPaymentDate = new Date(client.firstPaymentDate);
      firstPaymentDate.setHours(0, 0, 0, 0);
      
      console.log(`  📅 Date prévue: ${firstPaymentDate.toLocaleDateString('fr-CA')}`);
      console.log(`  ⏰ Aujourd'hui: ${today.toLocaleDateString('fr-CA')}`);
      
      const alreadyReceived = newPayments.some(p => 
        p.clientId === client.id && 
        p.paymentNumber === 1 && 
        p.received
      );
      
      console.log(`  ✓ Déjà marqué reçu? ${alreadyReceived}`);

      if (firstPaymentDate <= today && !alreadyReceived) {
        const amount = contract.amount / (client.paymentStructure === '1' ? 1 : 2);
        
        console.log(`  💰 Date atteinte! Marquage automatique de ${amount}$`);
        
        const payment = {
          id: Date.now() + Math.random(),
          clientId: client.id,
          paymentNumber: 1,
          amount: parseFloat(amount),
          date: client.firstPaymentDate,
          paymentMethod: 'cheque',
          received: true,
          recordedAt: new Date().toISOString(),
          autoMarked: true
        };
        newPayments.push(payment);

        const invoice = {
          id: Date.now() + Math.random() + 1,
          clientId: client.id,
          amount: parseFloat(amount),
          date: client.firstPaymentDate,
          type: 'revenu',
          description: `1er versement - ${client.name} (Chèque)`
        };
        newInvoices.push(invoice);
        
        newClients[index] = {
          ...client,
          firstPaymentReceived: true
        };
        
        updatedPayments = true;
        console.log(`  ✅ AUTO: ${client.name} - 1er paiement ${amount}$ marqué reçu`);
      } else if (firstPaymentDate > today) {
        console.log(`  ⏭️ Date pas encore atteinte (${firstPaymentDate.toLocaleDateString('fr-CA')})`);
      }
    } else if (!client.firstPaymentDate) {
      console.log(`  ⏳ Aucune date de paiement configurée`);
    }

    // ✅ VÉRIFIER 2E PAIEMENT - VERSION SIMPLIFIÉE
    if (client.paymentStructure === '2' && client.secondPaymentDate && client.secondPaymentDate !== 'À venir' && client.secondPaymentMethod === 'cheque') {
      const secondPaymentDate = new Date(client.secondPaymentDate);
      secondPaymentDate.setHours(0, 0, 0, 0);
      
      console.log(`  📅 2e paiement - Date prévue: ${secondPaymentDate.toLocaleDateString('fr-CA')}`);
      
      const alreadyReceived = newPayments.some(p => 
        p.clientId === client.id && 
        p.paymentNumber === 2 && 
        p.received
      );

      if (secondPaymentDate <= today && !alreadyReceived) {
        const amount = contract.amount / 2;
        
        console.log(`  💰 Date du 2e paiement atteinte! Marquage automatique de ${amount}$`);
        
        const payment = {
          id: Date.now() + Math.random() + 2,
          clientId: client.id,
          paymentNumber: 2,
          amount: parseFloat(amount),
          date: client.secondPaymentDate,
          paymentMethod: 'cheque',
          received: true,
          recordedAt: new Date().toISOString(),
          autoMarked: true
        };
        newPayments.push(payment);

        const invoice = {
          id: Date.now() + Math.random() + 3,
          clientId: client.id,
          amount: parseFloat(amount),
          date: client.secondPaymentDate,
          type: 'revenu',
          description: `2e versement - ${client.name} (Chèque)`
        };
        newInvoices.push(invoice);
        
        newClients[index] = {
          ...newClients[index],
          secondPaymentReceived: true
        };
        
        updatedPayments = true;
        console.log(`  ✅ AUTO: ${client.name} - 2e paiement ${amount}$ marqué reçu`);
      } else if (secondPaymentDate > today) {
        console.log(`  ⏭️ Date du 2e paiement pas encore atteinte (${secondPaymentDate.toLocaleDateString('fr-CA')})`);
      }
      // ✅ VÉRIFIER 3E PAIEMENT
if ((client.paymentStructure === '3' || client.paymentStructure === '4') && 
    client.thirdPaymentDate && 
    client.thirdPaymentDate !== 'À venir' && 
    client.thirdPaymentMethod === 'cheque') {
  
  const thirdPaymentDate = new Date(client.thirdPaymentDate);
  thirdPaymentDate.setHours(0, 0, 0, 0);
  
  const alreadyReceived = newPayments.some(p => 
    p.clientId === client.id && 
    p.paymentNumber === 3 && 
    p.received
  );

  if (thirdPaymentDate <= today && !alreadyReceived) {
    const amount = contract.amount / parseInt(client.paymentStructure);
    
    console.log(`  💰 Date du 3e paiement atteinte! Marquage automatique de ${amount}$`);
    
    const payment = {
      id: Date.now() + Math.random() + 4,
      clientId: client.id,
      paymentNumber: 3,
      amount: parseFloat(amount),
      date: client.thirdPaymentDate,
      paymentMethod: 'cheque',
      received: true,
      recordedAt: new Date().toISOString(),
      autoMarked: true
    };
    newPayments.push(payment);

    const invoice = {
      id: Date.now() + Math.random() + 5,
      clientId: client.id,
      amount: parseFloat(amount),
      date: client.thirdPaymentDate,
      type: 'revenu',
      description: `3e versement - ${client.name} (Chèque)`
    };
    newInvoices.push(invoice);
    
    newClients[index] = {
      ...newClients[index],
      thirdPaymentReceived: true
    };
    
    updatedPayments = true;
    console.log(`  ✅ AUTO: ${client.name} - 3e paiement ${amount}$ marqué reçu`);
  }
}

// ✅ VÉRIFIER 4E PAIEMENT
if (client.paymentStructure === '4' && 
    client.fourthPaymentDate && 
    client.fourthPaymentDate !== 'À venir' && 
    client.fourthPaymentMethod === 'cheque') {
  
  const fourthPaymentDate = new Date(client.fourthPaymentDate);
  fourthPaymentDate.setHours(0, 0, 0, 0);
  
  const alreadyReceived = newPayments.some(p => 
    p.clientId === client.id && 
    p.paymentNumber === 4 && 
    p.received
  );

  if (fourthPaymentDate <= today && !alreadyReceived) {
    const amount = contract.amount / 4;
    
    console.log(`  💰 Date du 4e paiement atteinte! Marquage automatique de ${amount}$`);
    
    const payment = {
      id: Date.now() + Math.random() + 6,
      clientId: client.id,
      paymentNumber: 4,
      amount: parseFloat(amount),
      date: client.fourthPaymentDate,
      paymentMethod: 'cheque',
      received: true,
      recordedAt: new Date().toISOString(),
      autoMarked: true
    };
    newPayments.push(payment);

    const invoice = {
      id: Date.now() + Math.random() + 7,
      clientId: client.id,
      amount: parseFloat(amount),
      date: client.fourthPaymentDate,
      type: 'revenu',
      description: `4e versement - ${client.name} (Chèque)`
    };
    newInvoices.push(invoice);
    
    newClients[index] = {
      ...newClients[index],
      fourthPaymentReceived: true
    };
    
    updatedPayments = true;
    console.log(`  ✅ AUTO: ${client.name} - 4e paiement ${amount}$ marqué reçu`);
  }
}
    }
  });
    
  if (updatedPayments) {
      saveToStorage('payments', newPayments);
      saveToStorage('invoices', newInvoices);
      saveToStorage('clients', newClients);
      
      setPayments(newPayments);
      setInvoices(newInvoices);
      setClients(newClients);
      
      alert('✅ Des paiements ont été automatiquement marqués comme reçus selon les dates prévues!');
      return true;
    }
    
    return false;
  } finally {
    sessionStorage.removeItem('checkingPayments');
  }
};
  const deletePayment = (paymentId) => {
  if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
    return;
  }

  // Trouver le paiement à supprimer
  const payment = payments.find(p => p.id === paymentId);
  if (!payment) {
    alert('Paiement introuvable');
    return;
  }

  // Supprimer le paiement
  const newPayments = payments.filter(p => p.id !== paymentId);
  setPayments(newPayments);
  saveToStorage('payments', newPayments);

  // Supprimer la facture associée si elle existe
  const associatedInvoice = invoices.find(inv => 
    inv.clientId === payment.clientId && 
    Math.abs(inv.amount - payment.amount) < 0.01 &&
    inv.date === payment.date
  );

  if (associatedInvoice) {
    const newInvoices = invoices.filter(inv => inv.id !== associatedInvoice.id);
    setInvoices(newInvoices);
    saveToStorage('invoices', newInvoices);
  }

  // Mettre à jour le statut du client (remettre le paiement en "non reçu")
  const updatedClients = clients.map(client => {
    if (client.id === payment.clientId) {
      const paymentField = `${
        payment.paymentNumber === 1 ? 'first' :
        payment.paymentNumber === 2 ? 'second' :
        payment.paymentNumber === 3 ? 'third' : 'fourth'
      }PaymentReceived`;
      
      return { ...client, [paymentField]: false };
    }
    return client;
  });

  setClients(updatedClients);
  saveToStorage('clients', updatedClients);

  alert('✅ Paiement supprimé avec succès!');
};

  // METTRE CETTE FONCTION ICI, AVANT sendNotificationViaBackend
const formatPhoneForTwilio = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g,'');
  
  // Si le numéro commence par 1 et a 11 chiffres, on le garde
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }
  // Si le numéro a 10 chiffres, on ajoute +1
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  }
  
  console.warn(`Numéro invalide pour ${phone} (nettoyé: ${cleaned})`);
  return null;
};
  // ENVOI NOTIFICATIONS VIA BACKEND
const sendNotificationViaBackend = async (clientId, type, customMessage = '') => {
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    alert('Client non trouvé');
    return;
  }

  // Vérification backend
  if (!backendConnected) {
    alert('❌ Backend non connecté !');
    return;
  }

  console.log('=== ENVOI NOTIFICATION ===');
  console.log('Client:', client.name);
  console.log('Backend URL:', API_BASE_URL);

  const formattedPhone = formatPhoneForTwilio(client.phone);
  const clientEmail = client.email?.trim() || null;

  if (!formattedPhone && !clientEmail) {
    alert(`❌ Aucun contact valide pour ${client.name}\nTéléphone: ${client.phone}\nEmail: ${client.email}`);
    return;
  }

  const notificationData = {
    clientId: client.id,
    clientName: client.name,
    clientPhone: formattedPhone,
    clientEmail: clientEmail,
    type: type,
    customMessage: customMessage
  };
  
  console.log('📦 Données envoyées:', JSON.stringify(notificationData, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });

    console.log('Statut réponse:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur serveur:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
 
  const result = await response.json();
    console.log('✅ Résultat:', result);
    
    if (result.success) {
      alert(`✅ Notification envoyée à ${client.name}`);
    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('❌ ERREUR:', error);
    alert(`❌ Erreur: ${error.message}`);
  }
};
  const sendNotification = async (clientId, type, customMessage = '') => {
  console.log('🔍 État backend:', backendConnected);  // ← AJOUTEZ CECI
  console.log('🔍 API_BASE_URL:', API_BASE_URL); 
  const client = clients.find(c => c.id === clientId);
  if (!client) {
    alert('Client non trouvé');
    return;
  }

  if (backendConnected) {
    await sendNotificationViaBackend(clientId, type, customMessage);
  } else {
    alert(`Notification simulée envoyée à ${client.name}`);
  }
};



//  PARTAGE DE LOCALISATION AVEC BACKEND
const shareLocationWithClientsBackend = async () => {  // ← IMPORTANT: async ici
  let positionToShare = gpsPosition;
  
  if (!positionToShare) {
    alert('Obtenez d\'abord votre position GPS');
    return;
  }
  
  try {
    // Vérification de la connexion backend
    if (!backendConnected) {
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        alert('❌ Erreur: Backend non disponible\n\nImpossible de créer la page de suivi.\nVérifiez que le serveur est accessible.');
        return;
      }
    }

    const trackingData = {
      position: positionToShare,
      teamName: 'Équipe JM Pominville',
      lastUpdate: new Date().toISOString(),
      active: true,
      fallbackMode: positionToShare.method === 'fallback'
    };

    console.log('=== CRÉATION PAGE DE SUIVI ===');
    console.log('URL backend:', `${API_BASE_URL}/api/location/share`);

    const response = await fetch(`${API_BASE_URL}/api/location/share`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(trackingData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue du serveur');
    }

    const trackingUrl = result.trackingUrl;
    setShareToken(result.token);
    setIsLocationShared(true);

    const message = `🚛 Équipe JM Pominville - Suivi en Temps Réel

Bonjour! Notre équipe de déneigement a commencé sa tournée.

📍 Suivez notre progression en temps réel:
${trackingUrl}

Cette page vous montrera:
- Notre position actuelle
- Les rues en cours de traitement
- L'heure estimée d'arrivée dans votre secteur

Merci de votre patience!
- Équipe JM Pominville`;

    const clientsWithActiveContracts = clients.filter(client => {
      const contract = contracts.find(c =>
        c.clientId === client.id &&
        c.status === 'actif' &&
        !c.archived
      );
      return contract;
    });

    if (clientsWithActiveContracts.length === 0) {
      alert(`✅ Page de suivi créée avec succès!\n\nLien: ${trackingUrl}\n\n⚠️ Aucun client avec contrat actif trouvé.`);
      return;
    }

    const confirmSend = window.confirm(
      `✅ Page de suivi créée avec succès!\n\nLien: ${trackingUrl}\n\nEnvoyer le lien à ${clientsWithActiveContracts.length} clients avec contrat actif?`
    );

    if (confirmSend) {
      let successCount = 0;
      let failureCount = 0;

      for (const client of clientsWithActiveContracts) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          if (backendConnected) {
          await sendNotificationViaBackend(client.id, 'custom', message);
          successCount++;
               } else {
          console.log(`Simulation: notification à ${client.name}`);
          successCount++;
        }
      } catch (error) {
          console.error(`Erreur envoi à ${client.name}:`, error);
          failureCount++;
        }
      }

      alert(`📱 Notifications envoyées!\n\nSuccès: ${successCount}\nÉchecs: ${failureCount}\n\n🔗 Lien de suivi: ${trackingUrl}`);
    }

  } catch (error) {
    console.error('Erreur partage localisation:', error);
    alert('Erreur lors du partage de localisation: ' + error.message);
  }
};  

  // FONCTIONS UTILITAIRES
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

  // FONCTIONS CLIENTS
// ✅ CRÉER LE CLIENT
const addClient = () => {
  // Validations client
  if (!clientForm.name || !clientForm.phone || !clientForm.address) {
    alert('Veuillez remplir au moins le nom, le téléphone et l\'adresse.');
    return;
  }

  // Validations contrat
  if (!clientForm.contractType || !clientForm.contractAmount || !clientForm.startDate) {
    alert('Veuillez remplir les informations du contrat (type, montant, date de début).');
    return;
  }

  // Validations paiements
  if (clientForm.paymentStructure === '1' && !clientForm.firstPaymentDate) {
    alert('Veuillez spécifier la date de paiement.');
    return;
  }
  
  if (clientForm.paymentStructure === '2' && !clientForm.firstPaymentDate) {
    alert('Veuillez spécifier la date du 1er versement.');
    return;
  }
  
  if (!clientForm.firstPaymentMethod) {
    alert('Veuillez sélectionner la méthode du 1er paiement.');
    return;
  }

  if (clientForm.paymentStructure === '2' && !clientForm.secondPaymentMethod) {
    alert('Veuillez sélectionner la méthode du 2e paiement.');
    return;
  }

  const clientId = Date.now();

  // ✅ CRÉER LE CLIENT
  const client = {
    id: clientId,
    name: clientForm.name,
    phone: clientForm.phone,
    phone2: clientForm.phone2 || '',
    email: clientForm.email,
    type: clientForm.type,
    address: clientForm.address,
    paymentStructure: clientForm.paymentStructure,
    
    // 1er paiement
    firstPaymentDate: clientForm.firstPaymentDate,
    firstPaymentMethod: clientForm.firstPaymentMethod,
    firstPaymentReceived: false,
    
    // 2e paiement
    secondPaymentDate: clientForm.secondPaymentDate || '',
    secondPaymentMethod: clientForm.secondPaymentMethod || '',
    secondPaymentReceived: (clientForm.paymentStructure === '2' && clientForm.secondPaymentDate && clientForm.secondPaymentDate !== '' && clientForm.secondPaymentDate !== 'À venir') ? true : false,
    
    // 3e paiement (nouveau)
    thirdPaymentDate: clientForm.thirdPaymentDate || '',
    thirdPaymentMethod: clientForm.thirdPaymentMethod || '',
    thirdPaymentReceived: false,
    
    // 4e paiement (nouveau)
    fourthPaymentDate: clientForm.fourthPaymentDate || '',
    fourthPaymentMethod: clientForm.fourthPaymentMethod || '',
    fourthPaymentReceived: false
  }; // ← UNE SEULE accolade fermante ici

  // ✅ CRÉER LE CONTRAT AUTOMATIQUEMENT
  const contract = {
    id: clientId + 1,
    clientId: clientId,
    type: clientForm.contractType,
    startDate: clientForm.startDate,
    endDate: clientForm.endDate || `${new Date().getFullYear() + 1}-03-31`, // Par défaut: 31 mars prochain
    amount: parseFloat(clientForm.contractAmount),
    status: 'actif',
    notes: clientForm.contractNotes,
    createdAt: new Date().toISOString()
  };

  // Sauvegarder
  const newClients = [...clients, client];
  const newContracts = [...contracts, contract];
  
  setClients(newClients);
  setContracts(newContracts);
  
  saveToStorage('clients', newClients);
  saveToStorage('contracts', newContracts);
  
  // Réinitialiser le formulaire
  setClientForm({
    name: '', 
    phone: '', 
    phone2: '', 
    email: '', 
    type: '', 
    address: '',
    paymentStructure: '2', 
    firstPaymentDate: '', 
    secondPaymentDate: '',
    firstPaymentMethod: '', 
    secondPaymentMethod: '',
    thirdPaymentDate: '',      // ← Ajouter
    thirdPaymentMethod: '',     // ← Ajouter
    fourthPaymentDate: '',      // ← Ajouter
    fourthPaymentMethod: '',    // ← Ajouter
    contractType: 'saisonnier',
    contractAmount: '',
    startDate: '',
    endDate: '',
    contractNotes: ''
  });

  alert(`✅ Client "${client.name}" et contrat créés avec succès!\n\nMontant: ${contract.amount.toFixed(2)}$\nDébut: ${contract.startDate}\nFin: ${contract.endDate}`);
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
      phone2: client.phone2 || '', 
      paymentStructure: client.paymentStructure || '2',
      firstPaymentMethod: client.firstPaymentMethod || '',
      secondPaymentMethod: client.secondPaymentMethod || '',
      firstPaymentDateReelle: client.firstPaymentDateReelle || '',
      secondPaymnetDateReelle: client.secondPaymentDateReelle || ''
    });
  };

const saveEditClient = () => {
  try {
    console.log('🔄 Début de la modification du client...');
    
    // Vérification que nous sommes bien en train de modifier un client
    if (!editingClient) {
      throw new Error('Aucun client en cours de modification');
    }

    // Validation des champs obligatoires
    if (!editClientForm.name || !editClientForm.phone || !editClientForm.address) {
      alert('⚠️ Le nom, le téléphone et l\'adresse sont obligatoires');
      return;
    }

    console.log('✅ Validation OK, mise à jour du client ID:', editingClient);

    // Mise à jour du client
    const updatedClients = clients.map(client => {
      if (client.id === editingClient) {
        return {
          ...client,
          name: editClientForm.name,
          phone: editClientForm.phone,
          phone2: editClientForm.phone2 || '',
          email: editClientForm.email || '',
          type: editClientForm.type || client.type,
          address: editClientForm.address,
          paymentStructure: editClientForm.paymentStructure || client.paymentStructure,
          firstPaymentDate: editClientForm.firstPaymentDate || client.firstPaymentDate,
          firstPaymentMethod: editClientForm.firstPaymentMethod || client.firstPaymentMethod,
          secondPaymentDate: editClientForm.secondPaymentDate || client.secondPaymentDate,
          secondPaymentMethod: editClientForm.secondPaymentMethod || client.secondPaymentMethod,
          thirdPaymentDate: editClientForm.thirdPaymentDate || client.thirdPaymentDate,
          thirdPaymentMethod: editClientForm.thirdPaymentMethod || client.thirdPaymentMethod,
          fourthPaymentDate: editClientForm.fourthPaymentDate || client.fourthPaymentDate,
          fourthPaymentMethod: editClientForm.fourthPaymentMethod || client.fourthPaymentMethod
        };
      }
      return client;
    });

    console.log('💾 Sauvegarde des modifications...');

    // Sauvegarde
    setClients(updatedClients);
    saveToStorage('clients', updatedClients);

    console.log('✅ Client modifié avec succès');

    // Fermer le modal et réinitialiser le formulaire
    setEditingClient(null);
    setEditClientForm({
      name: '', 
      phone: '', 
      phone2: '', 
      email: '', 
      type: '', 
      address: '',
      paymentStructure: '2', 
      firstPaymentDate: '', 
      secondPaymentDate: '',
      firstPaymentMethod: '', 
      secondPaymentMethod: '',
      thirdPaymentDate: '', 
      thirdPaymentMethod: '',
      fourthPaymentDate: '', 
      fourthPaymentMethod: ''
    });

    alert('✅ Client modifié avec succès!');
    
  } catch (error) {
    console.error('❌ ERREUR lors de la modification:', error);
    alert('❌ Erreur lors de la sauvegarde: ' + error.message + '\n\nVos données n\'ont pas été modifiées.');
  }
};
  const cancelEdit = () => {
    setEditingClient(null);
    setEditClientForm({
      name: '', phone: '', email: '', type: '', address: '',
      paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
      firstPaymentMethod: '', secondPaymentMethod: ''
    });
  }; 
// FONCTION DE RENOUVELLEMENT AUTOMATIQUE DE CONTRAT
const renewContract = (oldContractId) => {
  const oldContract = contracts.find(c => c.id === oldContractId);
  if (!oldContract) {
    alert('Contrat introuvable');
    return;
  }

  const client = clients.find(c => c.id === oldContract.clientId);
  if (!client) {
    alert('Client introuvable');
    return;
  }

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const startDate = `${currentYear}-11-01`;
  const endDate = `${nextYear}-03-31`;

  // Structure de paiement
  const paymentStructure = window.prompt(
    `Renouvellement du contrat pour ${client.name}\n\n` +
    `Période du contrat: ${startDate} au ${endDate}\n` +
    `Montant: ${oldContract.amount.toFixed(2)}$\n\n` +
    `Structure de paiement?\n` +
    `Tapez "1" pour 1 versement unique\n` +
    `Tapez "2" pour 2 versements`,
    client.paymentStructure || '2'
  );

  if (!paymentStructure || (paymentStructure !== '1' && paymentStructure !== '2')) {
    alert('Renouvellement annulé');
    return;
  }

  // Date PRÉVUE du 1er paiement
  const firstPaymentDate = window.prompt(
    `Date PRÉVUE du ${paymentStructure === '1' ? 'paiement unique' : '1er versement'}?\n\n` +
    `Format: AAAA-MM-JJ (ex: ${currentYear}-11-15)\n\n` +
    `⚠️ Ceci est la date prévue, pas la date réelle.\n` +
    `Vous marquerez le paiement reçu plus tard.`,
    `${currentYear}-11-15`
  );

  if (!firstPaymentDate) {
    alert('Renouvellement annulé - Date du 1er paiement requise');
    return;
  }

  // Méthode du 1er paiement
  const firstPaymentMethod = window.prompt(
    `Méthode PRÉVUE du ${paymentStructure === '1' ? 'paiement' : '1er versement'}?\n\n` +
    `Tapez "cheque" pour chèque\n` +
    `Tapez "comptant" pour argent comptant\n\n` +
    `Vous pourrez modifier au moment de recevoir le paiement.`,
    'cheque'
  );

  let secondPaymentDate = '';
  let secondPaymentMethod = '';

  if (paymentStructure === '2') {
    const secondDateInput = window.prompt(
      `Date PRÉVUE du 2e versement?\n\n` +
      `Format: AAAA-MM-JJ (ex: ${nextYear}-01-15)\n` +
      `Tapez "avenir" si la date n'est pas encore déterminée`,
      `${nextYear}-01-15`
    );

    if (secondDateInput && secondDateInput !== 'avenir') {
      secondPaymentDate = secondDateInput;
      secondPaymentMethod = window.prompt(
        `Méthode PRÉVUE du 2e versement?\n\n` +
        `Tapez "cheque" pour chèque\n` +
        `Tapez "comptant" pour argent comptant\n\n` +
        `Vous pourrez modifier au moment de recevoir le paiement.`,
        'cheque'
      );
    } else if (secondDateInput === 'avenir') {
      secondPaymentDate = 'À venir';
      secondPaymentMethod = '';
    }
  }

  // Créer le nouveau contrat
  const newContract = {
    id: Date.now(),
    clientId: oldContract.clientId,
    type: oldContract.type,
    startDate: startDate,
    endDate: endDate,
    amount: oldContract.amount,
    status: 'actif',
    notes: oldContract.notes || '',
    createdAt: new Date().toISOString(),
    renewedFrom: oldContract.id,
    archived: false
  };

  // Mettre à jour le client avec les dates PRÉVUES
  const updatedClient = {
    ...client,
    paymentStructure: paymentStructure,
    firstPaymentDate: firstPaymentDate,
    secondPaymentDate: secondPaymentDate || '',
    firstPaymentMethod: firstPaymentMethod || '',
    secondPaymentMethod: secondPaymentMethod || '',
    // ❌ Pas encore reçu
    firstPaymentReceived: false,
    secondPaymentReceived: false,
    // ❌ Champs pour dates RÉELLES vides (pas encore de chèque reçu)
  firstPaymentDateReelle: '',     // ← VIDE
  secondPaymentDateReelle: ''     // ← VIDE 
}; 

  // Archiver l'ancien contrat
  const updatedContracts = contracts.map(c =>
    c.id === oldContract.id 
      ? { ...c, archived: true, yearArchived: currentYear, status: 'terminé' }
      : c
  );

  const newContracts = [...updatedContracts, newContract];
  const updatedClients = clients.map(c => 
    c.id === client.id ? updatedClient : c
  );
  
  setContracts(newContracts);
  setClients(updatedClients);
  
  saveToStorage('contracts', newContracts);
  saveToStorage('clients', updatedClients);

  let summaryMessage = `✅ Contrat renouvelé avec succès!\n\n` +
    `Client: ${client.name}\n` +
    `📅 Période du contrat: ${startDate} au ${endDate}\n` +
    `💰 Montant: ${newContract.amount.toFixed(2)}$\n\n` +
    `Structure: ${paymentStructure} versement${paymentStructure === '2' ? 's' : ''}\n\n`;

  if (firstPaymentDate) {
    summaryMessage += `📋 ${paymentStructure === '1' ? 'Paiement' : '1er versement'} PRÉVU:\n`;
    summaryMessage += `   Date prévue: ${firstPaymentDate}\n`;
    summaryMessage += `   Méthode prévue: ${firstPaymentMethod === 'cheque' ? '📄 Chèque' : '💰 Comptant'}\n`;
  }

  if (paymentStructure === '2' && secondPaymentDate) {
    summaryMessage += `\n📋 2e versement PRÉVU:\n`;
    summaryMessage += `   Date prévue: ${secondPaymentDate}\n`;
    if (secondPaymentDate !== 'À venir') {
      summaryMessage += `   Méthode prévue: ${secondPaymentMethod === 'cheque' ? '📄 Chèque' : '💰 Comptant'}\n`;
    }
  }

  summaryMessage += `\n⏳ Les paiements sont à marquer manuellement quand vous les recevez.\n`;
  summaryMessage += `Cliquez sur "💰 1er Paiement" ou "💰 2e Paiement" dans la liste des clients.`;

  alert(summaryMessage);
};
// FONCTION DE RENOUVELLEMENT EN MASSE AMÉLIORÉE
const renewMultipleContracts = () => {
  const activeContracts = contracts.filter(c => !c.archived && c.status === 'actif');
  
  if (activeContracts.length === 0) {
    alert('Aucun contrat actif à renouveler');
    return;
  }

  const confirmBulk = window.confirm(
    `⚠️ ATTENTION - Renouvellement en masse\n\n` +
    `${activeContracts.length} contrats seront renouvelés.\n\n` +
    `Vous allez configurer les dates de paiement UNE FOIS pour tous les clients.\n\n` +
    `Voulez-vous continuer?`
  );

  if (!confirmBulk) return;

  // 🆕 DEMANDER LA SAISON
  const currentYear = new Date().getFullYear();
  const seasonYearInput = window.prompt(
    `Pour quelle saison voulez-vous renouveler?\n\n` +
    `Entrez l'année de DÉBUT de la saison.\n\n` +
    `Exemples:\n` +
    `• Tapez "${currentYear}" pour la saison ${currentYear}-${currentYear + 1}\n` +
    `• Tapez "${currentYear + 1}" pour la saison ${currentYear + 1}-${currentYear + 2}\n\n` +
    `Année de début:`,
    currentYear.toString()
  );

  if (!seasonYearInput) {
    alert('Renouvellement annulé');
    return;
  }

  const seasonStartYear = parseInt(seasonYearInput);
  if (isNaN(seasonStartYear) || seasonStartYear < 2024 || seasonStartYear > 2050) {
    alert('Année invalide. Renouvellement annulé.');
    return;
  }

  const seasonEndYear = seasonStartYear + 1;
  const startDate = `${seasonStartYear}-11-01`;
  const endDate = `${seasonEndYear}-03-31`;

  // Confirmation de la saison choisie
  const confirmSeason = window.confirm(
    `Vous avez choisi la saison:\n\n` +
    `📅 ${seasonStartYear}-${seasonEndYear}\n` +
    `Du ${startDate} au ${endDate}\n\n` +
    `Est-ce correct?`
  );

  if (!confirmSeason) {
    alert('Renouvellement annulé');
    return;
  }

  // 📅 CONFIGURATION DES DATES - UNE SEULE FOIS POUR TOUS
const paymentStructure = window.prompt(
  `Configuration des paiements pour TOUS les ${activeContracts.length} clients\n\n` +
  `Structure de paiement?\n` +
  `Tapez "1" pour 1 versement unique\n` +
  `Tapez "2" pour 2 versements\n` +
  `Tapez "3" pour 3 versements\n` +
  `Tapez "4" pour 4 versements`,
  '2'
);

if (!paymentStructure || !['1', '2', '3', '4'].includes(paymentStructure)) {
  alert('Renouvellement annulé');
  return;
}

// Demander les dates selon le nombre de versements...
  // Date du 1er paiement (avec l'année de la saison choisie)
  const firstPaymentDate = window.prompt(
    `Date du ${paymentStructure === '1' ? 'paiement unique' : '1er versement'} pour TOUS les clients?\n\n` +
    `Format: AAAA-MM-JJ (ex: ${seasonStartYear}-11-15)\n\n` +
    `Cette date sera appliquée à tous les ${activeContracts.length} contrats.`,
    `${seasonStartYear}-11-15`
  );

  if (!firstPaymentDate) {
    alert('Renouvellement annulé - Date du 1er paiement requise');
    return;
  }

  // Méthode du 1er paiement
  const firstPaymentMethod = window.prompt(
    `Méthode du ${paymentStructure === '1' ? 'paiement' : '1er versement'} pour TOUS les clients?\n\n` +
    `Tapez "cheque" pour chèque\n` +
    `Tapez "comptant" pour argent comptant`,
    'cheque'
  );

  let secondPaymentDate = '';
  let secondPaymentMethod = '';

  // Si 2 versements, demander la date du 2e
  if (paymentStructure === '2') {
    const secondDateInput = window.prompt(
      `Date du 2e versement pour TOUS les clients?\n\n` +
      `Format: AAAA-MM-JJ (ex: ${seasonEndYear}-01-15)\n` +
      `Tapez "avenir" si la date n'est pas encore déterminée\n\n` +
      `Cette date sera appliquée à tous les ${activeContracts.length} contrats.`,
      `${seasonEndYear}-01-15`
    );

    if (secondDateInput && secondDateInput !== 'avenir') {
      secondPaymentDate = secondDateInput;
      secondPaymentMethod = window.prompt(
        `Méthode du 2e versement pour TOUS les clients?\n\n` +
        `Tapez "cheque" pour chèque\n` +
        `Tapez "comptant" pour argent comptant`,
        'cheque'
      );
    } else if (secondDateInput === 'avenir') {
      secondPaymentDate = 'À venir';
      secondPaymentMethod = '';
    }
  }

  // Confirmation finale avec résumé
  const finalConfirm = window.confirm(
    `📋 RÉSUMÉ DU RENOUVELLEMENT EN MASSE\n\n` +
    `Nombre de contrats: ${activeContracts.length}\n` +
    `Saison: ${seasonStartYear}-${seasonEndYear}\n` +
    `Période: ${startDate} au ${endDate}\n\n` +
    `💰 Configuration des paiements:\n` +
    `• Structure: ${paymentStructure} versement${paymentStructure === '2' ? 's' : ''}\n` +
    `• 1er paiement: ${firstPaymentDate} (${firstPaymentMethod === 'cheque' ? 'Chèque' : 'Comptant'})\n` +
    (paymentStructure === '2' ? `• 2e paiement: ${secondPaymentDate} ${secondPaymentMethod ? '(' + (secondPaymentMethod === 'cheque' ? 'Chèque' : 'Comptant') + ')' : ''}` : '') +
    `\n\nCes paramètres seront appliqués à TOUS les clients.\n\n` +
    `Confirmer le renouvellement?`
  );

  if (!finalConfirm) {
    alert('Renouvellement annulé');
    return;
  }

  // 🚀 TRAITEMENT DU RENOUVELLEMENT
  let renewedCount = 0;
  let updatedContracts = [...contracts];
  let updatedClients = [...clients];

  activeContracts.forEach(oldContract => {
    // Créer nouveau contrat
    const newContract = {
      id: Date.now() + renewedCount,
      clientId: oldContract.clientId,
      type: oldContract.type,
      startDate: startDate,
      endDate: endDate,
      amount: oldContract.amount,
      status: 'actif',
      notes: oldContract.notes || '',
      createdAt: new Date().toISOString(),
      renewedFrom: oldContract.id,
      archived: false
    };

    // Archiver l'ancien contrat
    updatedContracts = updatedContracts.map(c =>
      c.id === oldContract.id
        ? { ...c, archived: true, yearArchived: seasonStartYear, status: 'terminé' }
        : c
    );

    // ✅ APPLIQUER LES DATES À CHAQUE CLIENT
    updatedClients = updatedClients.map(client => {
      if (client.id === oldContract.clientId) {
        return {
          ...client,
          paymentStructure: paymentStructure,
          firstPaymentDate: firstPaymentDate,
          secondPaymentDate: secondPaymentDate || '',
          firstPaymentMethod: firstPaymentMethod || '',
          secondPaymentMethod: secondPaymentMethod || '',
          firstPaymentReceived: false,
          secondPaymentReceived: false,
          firstPaymentDateReelle: '',
          secondPaymentDateReelle: ''
        };
      }
      return client;
    });

    // Ajouter le nouveau contrat
    updatedContracts.push(newContract);
    renewedCount++;
  });

  // Sauvegarder
  setContracts(updatedContracts);
  setClients(updatedClients);
  
  saveToStorage('contracts', updatedContracts);
  saveToStorage('clients', updatedClients);

  alert(
    `✅ Renouvellement en masse terminé avec succès!\n\n` +
    `${renewedCount} contrat(s) renouvelé(s)\n` +
    `Saison: ${seasonStartYear}-${seasonEndYear}\n` +
    `Période: ${startDate} au ${endDate}\n\n` +
    `💰 Configuration appliquée:\n` +
    `• ${paymentStructure} versement${paymentStructure === '2' ? 's' : ''}\n` +
    `• 1er paiement: ${firstPaymentDate} (${firstPaymentMethod === 'cheque' ? 'Chèque' : 'Comptant'})\n` +
    (paymentStructure === '2' ? `• 2e paiement: ${secondPaymentDate} ${secondPaymentMethod ? '(' + (secondPaymentMethod === 'cheque' ? 'Chèque' : 'Comptant') + ')' : ''}\n` : '') +
    `\n` +
    `📋 Les anciens contrats ont été archivés.\n` +
    `⏳ Les paiements seront marqués automatiquement selon les dates des chèques reçus.`
  );
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


const saveEditContract = () => {
  console.log('=== DÉBUT MODIFICATION CONTRAT ===');
  
  try {
    // 1. Vérifications de base
    console.log('1. Vérification editingContract:', editingContract);
    
    if (!editingContract) {
      throw new Error('Aucun contrat sélectionné pour modification');
    }

    console.log('2. Vérification du formulaire:', editContractForm);
    
    if (!editContractForm || !editContractForm.type || !editContractForm.amount) {
      alert('⚠️ Le type et le montant du contrat sont obligatoires');
      return;
    }

    console.log('3. Vérification de contracts:', contracts);
    
    if (!contracts || contracts.length === 0) {
      throw new Error('Liste des contrats vide ou non définie');
    }

    console.log('4. Recherche du contrat à modifier...');
    
    const contractToUpdate = contracts.find(c => c.id === editingContract);
    
    if (!contractToUpdate) {
      throw new Error(`Contrat avec ID ${editingContract} introuvable`);
    }

    console.log('5. Contrat trouvé:', contractToUpdate);
    console.log('6. Création de la version mise à jour...');

    // 2. Mise à jour du contrat
    const updatedContracts = contracts.map(contract => {
      if (contract.id === editingContract) {
        const updated = {
          ...contract,
          type: editContractForm.type,
          amount: parseFloat(editContractForm.amount) || 0,
          startDate: editContractForm.startDate || contract.startDate,
          endDate: editContractForm.endDate || contract.endDate,
          notes: editContractForm.notes || '',
          archived: contract.archived || false
        };
        
        console.log('7. Contrat mis à jour:', updated);
        return updated;
      }
      return contract;
    });

    console.log('8. Sauvegarde dans React state...');
    
    // 3. Vérification que setContracts existe
    if (typeof setContracts !== 'function') {
      throw new Error('setContracts n\'est pas une fonction');
    }
    
    setContracts(updatedContracts);

    console.log('9. Sauvegarde dans localStorage...');
    
    // 4. Sauvegarde dans localStorage
    try {
      localStorage.setItem('contracts', JSON.stringify(updatedContracts));
      console.log('10. ✅ Sauvegarde localStorage réussie');
    } catch (storageError) {
      console.error('Erreur localStorage:', storageError);
      throw new Error('Impossible de sauvegarder dans localStorage: ' + storageError.message);
    }

    console.log('11. Fermeture du modal...');

    // 5. Fermer le modal et réinitialiser
    setEditingContract(null);
    setEditContractForm({
      type: '',
      amount: '',
      startDate: '',
      endDate: '',
      notes: ''
    });

    console.log('12. ✅ MODIFICATION TERMINÉE AVEC SUCCÈS');
    alert('✅ Contrat modifié avec succès!');
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
    console.error('Stack trace:', error.stack);
    alert(`❌ Erreur lors de la modification du contrat:\n\n${error.message}\n\nVos données n'ont PAS été modifiées.\n\nOuvrez la console (Cmd+Option+J) pour plus de détails.`);
  }
  
  console.log('=== FIN MODIFICATION CONTRAT ===\n');
};
const cancelEditContract = () => {
  console.log('🚫 Annulation de la modification de contrat');
  
  setEditingContract(null);
  setEditContractForm({
    clientId: '', 
    type: '', 
    startDate: '', 
    endDate: '',
    amount: '', 
    status: 'actif', 
    notes: ''
  });
};
  // FONCTION POUR IMPRIMER PLUSIEURS CONTRATS
const printMultipleContracts = () => {
  if (selectedContracts.length === 0) {
    alert('Aucun contrat sélectionné');
    return;
  }

  const confirmPrint = window.confirm(
    `Imprimer ${selectedContracts.length} contrat(s) ?\n\n` +
    `Tous les contrats seront générés dans une seule fenêtre d'impression.`
  );

  if (!confirmPrint) return;

  let allContractsHTML = '';

  selectedContracts.forEach((contractId, index) => {
    const contract = contracts.find(c => c.id === contractId);
    const client = clients.find(c => c.id === contract?.clientId);

    if (!contract || !client) return;


const paymentStructure = client.paymentStructure || '2';
const numPayments = parseInt(paymentStructure);
const paymentAmount = contract.amount / numPayments;
    const today = new Date().toLocaleDateString('fr-CA');

    const contractHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; font-size: 12px; page-break-after: always;">
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
  ${client.phone2 ? `<p style="margin: 8px 0;"><strong>• Téléphone 2 :</strong> ${client.phone2}</p>` : ''}
  ${client.email ? `<p style="margin: 8px 0;"><strong>• Courriel :</strong> ${client.email}</p>` : ''}
</div>        
        <hr style="border: 1px solid #000; margin: 25px 0;">
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Conditions Générales du Service :</h3>
          <p style="margin-bottom: 15px;">Le présent contrat établit les termes et conditions du service de déneigement fourni par JM Pominville au client susmentionné pour la saison hivernale.</p>
          <p style="margin: 12px 0;"><strong>1. Déclenchement du Service :</strong> Le service de déneigement débutera lorsque l'accumulation de neige atteindra un minimum de cinq (5) centimètres.</p>
          <p style="margin: 12px 0;"><strong>2. Protection de la Propriété :</strong> Il est de la responsabilité exclusive du client de protéger adéquatement ses arbres, arbustes, ainsi que tout autre objet décoratif ou aménagement paysager situé dans la zone de déneigement.</p>
          <p style="margin: 12px 0;"><strong>3. Libération des Aires de Stationnement :</strong> Le client s'engage à libérer les aires de stationnement et d'accès de tout objet mobile avant chaque intervention de déneigement.</p>
          <p style="margin: 12px 0;"><strong>4. Déplacement des Véhicules :</strong> Les véhicules doivent être retirés des entrées de stationnement avant 9h00 du matin le lendemain de la tempête pour permettre le déneigement complet. <strong style="color: #d32f2f;">Des frais supplémentaires de 30$ seront facturés si nous devons ressortir en raison de véhicules non déplacés ou d'obstacles non prévus.</strong></p>
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
    <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
  </div>
` : `
  <p style="margin: 15px 0;">Le paiement s'effectuera en ${paymentStructure} versements :</p>
  
  <!-- 1er versement -->
  <div style="margin: 15px 0;">
    <p style="margin: 8px 0;"><strong>• 1er Versement :</strong></p>
    <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.firstPaymentDate || contract.startDate}</p>
    <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
  </div>
  
  <!-- 2e versement -->
  <div style="margin: 15px 0;">
    <p style="margin: 8px 0;"><strong>• 2e Versement :</strong></p>
    <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.secondPaymentDate || 'À déterminer'}</p>
    <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
  </div>
  
  ${(paymentStructure === '3' || paymentStructure === '4') ? `
    <!-- 3e versement -->
    <div style="margin: 15px 0;">
      <p style="margin: 8px 0;"><strong>• 3e Versement :</strong></p>
      <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.thirdPaymentDate || 'À déterminer'}</p>
      <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
    </div>
  ` : ''}
  
  ${paymentStructure === '4' ? `
    <!-- 4e versement -->
    <div style="margin: 15px 0;">
      <p style="margin: 8px 0;"><strong>• 4e Versement :</strong></p>
      <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.fourthPaymentDate || 'À déterminer'}</p>
      <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
    </div>
  ` : ''}
`}
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
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAK4AAAB9CAYAAAA7plhvAAABdWlDQ1BrQ0dDb2xvclNwYWNlRGlzcGxheVAzAAAokXWQvUvDUBTFT6tS0DqIDh0cMolD1NIKdnFoKxRFMFQFq1OafgltfCQpUnETVyn4H1jBWXCwiFRwcXAQRAcR3Zw6KbhoeN6XVNoi3sfl/Ticc7lcwBtQGSv2AijplpFMxKS11Lrke4OHnlOqZrKooiwK/v276/PR9d5PiFlNu3YQ2U9cl84ul3aeAlN//V3Vn8maGv3f1EGNGRbgkYmVbYsJ3iUeMWgp4qrgvMvHgtMunzuelWSc+JZY0gpqhrhJLKc79HwHl4plrbWD2N6f1VeXxRzqUcxhEyYYilBRgQQF4X/8044/ji1yV2BQLo8CLMpESRETssTz0KFhEjJxCEHqkLhz634PrfvJbW3vFZhtcM4v2tpCAzidoZPV29p4BBgaAG7qTDVUR+qh9uZywPsJMJgChu8os2HmwiF3e38M6Hvh/GMM8B0CdpXzryPO7RqFn4Er/QcXKWq8UwZBywAAAARjSUNQDA0AAW4D4+8AAACoZVhJZk1NACoAAAAIAAUBEgADAAAAAQABAAABGgAFAAAAAQAAAEoBGwAFAAAAAQAAAFIBKAADAAAAAQACAACHaQAEAAAAAQAAAFoAAAAAAAAA2AAAAAEAAADYAAAAAQAGkAAABwAAAAQwMjIxkQEABwAAAAQBAgMAoAAABwAAAAQwMTAwoAIABAAAAAEAAACuoAMABAAAAAEAAAB9pAYAAwAAAAEAAAAAAAAAAIzjB0AAAAAJcEhZcwAAITgAACE4AUWWMWAAAAR6aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NTc0PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6U2NlbmVDYXB0dXJlVHlwZT4wPC9leGlmOlNjZW5lQ2FwdHVyZVR5cGU+CiAgICAgICAgIDxleGlmOkV4aWZWZXJzaW9uPjAyMjE8L2V4aWY6RXhpZlZlcnNpb24+CiAgICAgICAgIDxleGlmOkZsYXNoUGl4VmVyc2lvbj4wMTAwPC9leGlmOkZsYXNoUGl4VmVyc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjI4MDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbXBvbmVudHNDb25maWd1cmF0aW9uPgogICAgICAgICAgICA8cmRmOlNlcT4KICAgICAgICAgICAgICAgPHJkZjpsaT4xPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGk+MjwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpPjM8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaT4wPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOlNlcT4KICAgICAgICAgPC9leGlmOkNvbXBvbmVudHNDb25maWd1cmF0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpYUmVzb2x1dGlvbj4yMTY8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjIxNjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CgXxCbMAAEAASURBVHgB7Z0HvFXFtf+Hy0V6L1IELk2aoqKAoogUUVFRVOw9liR/U0zy8k97Sd776S/1H2N6YgVLVOyKCEgT6dJFeu+91///vu/ZZh3H7zuWiFCPO/Zy7t5ZtbNmzexZs2bNmzexWCwrbdO0OZwsKwY8eOSO UlpXvvNo9+7dYd++faFMmTKhXOEJRM0G0uzds8eeES/sC6F0qVKhQoUK2Th82bx9q8XZl5CyZwWKx+89SleuXLmwZ+/ewL3SpUuHvfpO4DtlKKX73Es/83u7KMPKS/D48XfqVLZs2Ww+BQUF9p10lJ9n1JHyFYomgd8EaBLIlzJ6oKxxPsczfdrBeeG8cj5xdd7u2imMCUd8Yl7SBqQ/4YQTrJ3Jr5R+w2PDlfKw/HWPsF9tY982bdoUSusrDUmwBPrumXvB7GHm36ZtWywDQL5r1y5r/P2l9ocy5cvG0ew7BYWwBwgDEq4Udtu2bdlCGpgyjIBuYUFhtlyAh3z48IzAPQ+khUkAlec7xSieU0aCx6VefAdsgJYQdyq7kflHPPIiX/gCsMuWOcHKwD3Pk+jHK30DlXhD2LNnn8C21wAHn+GRtaP4dkKG19yHj/ATXvIcoHq7WUb6B2gdOwgQhBwg53spMX7/Hv3Yvn17EEqyACMRhFwCnSAAxWHXvgQkLqU8gBXLlo+jBQCORPVCeGdw0NLYAIhCE49yVKxQMezYuSPbA2Op53Qgwn2YVrpAUnpfwqQyhWUEwn2S/Lq3f68xhThO1+tDeWBWLCnJE+kOGKFDiBsFBvs9nnvdj3f68AI+IYBGjRoV3n///XDllVeGWnXqhBMyQgO+EhBygNH5zz3A6+Xn9O01bLR1YCcEfhJcnVV0GDi0BiY9KqwAX/RNHDqaZZr11G/gUofBWD5vYN4TQJMsv53vcS8PNH6gUVpxfA+4xIdX3v9I1z9u3FhzEK6jY4vOPf+8UFbnOHCSYq9evUKXrl3tCM0u3bt7T6hdp7bxmHZ2YFIGvkObeIQYtzMQ4TNt4O1CWm8TH/0MGOD1YQWC09I5hxXQVYECWgr4NcT1IQoZpO9UvvTxfr1qwv0jpctIWhQOPB1LxKP7Hpe0Ho/0xKdsbA8c59y5c8Njjz4WlixeEjZv3BzmyJnJwez4xScf/rj/M+q3ZssWLcOKFSu0cLFHHUgSFGmNR/CJe+A/V6s7eQB07lEWcESgDFxJAx7s3m+upGeeN52Gk8b+0X2UqozyZF2G9d+7Zjv9r7k+gxCn4T/+sEIBHzjRV7/ylfA+9dtyTRo3CS+++GJYv36ddI0C+5DG68WVPPw39cqCP/0vW69kO+3Zu9fs7C5M0D6kt08p/SZQPwLY9kDP6dXZ36QhPmUucIa+zjeeMy4QLIEKAw4vHPkQIIgBwRu+dJwKeDwviJN5n8aVJzhx+O1X8vG4/tuucZ4ej3t8Z2LH0FxaHxgop79RwwbavgvCqlUrwxqd+cBOCE​​​​​​​​​​​​​​​​"    
                 <p style="margin: 0; font-style: italic; color: #666;">[Signature Maxim Pominville]</p>
            </div>
            <p style="margin: 5px 0;">Maxim Pominville</p>
            <p style="margin: 5px 0; font-size: 11px;">JM Pominville</p>
            <p style="margin: 15px 0;"><strong>Date :</strong> ${today}</p>
          </div>
        </div>
      </div>
    `;
    
    allContractsHTML += contractHTML;
  });

  // Ouvrir fenêtre d'impression
  const newWindow = window.open('', '_blank');
  newWindow.document.write(`
    <html>
      <head>
        <title>Contrats JM Pominville</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
          } 
          @media print { 
            .header-bar { 
              display: none !important; 
            }
          }
        </style>
      </head>
      <body>${allContractsHTML}</body>
    </html>
  `);
  newWindow.document.close();
  newWindow.print();
};
  // Fonction Facture
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

  // FONCTIONS PAIEMENTS
const showPaymentModalFunc = (clientId, paymentNumber, amount) => {
  setPaymentModal({
    isOpen: true,
    clientId: clientId,
    paymentNumber: paymentNumber,
    amount: amount,
    customAmount: undefined  // ✅ Initialement undefined
  });
};
const handlePaymentMethodSelect = (method) => {
  if (!paymentModal.clientId || !paymentModal.paymentNumber) {
    alert('Erreur: Informations de paiement manquantes');
    return;
  }

  // ✅ Utiliser le montant personnalisé s'il existe, sinon le montant par défaut
  const finalAmount = paymentModal.customAmount !== undefined 
    ? paymentModal.customAmount 
    : paymentModal.amount;

  // Validation
  if (finalAmount <= 0) {
    alert('⚠️ Le montant doit être supérieur à 0$');
    return;
  }

  const client = clients.find(c => c.id === paymentModal.clientId);
  if (!client) {
    alert('Client introuvable');
    return;
  }

  // Créer l'enregistrement de paiement
  const payment = {
    id: Date.now(),
    clientId: paymentModal.clientId,
    paymentNumber: paymentModal.paymentNumber,
    amount: finalAmount,  // ✅ Utilise le montant final (modifié ou non)
    date: new Date().toISOString().split('T')[0],
    paymentMethod: method,
    received: true,
    recordedAt: new Date().toISOString()
  };

  const newPayments = [...payments, payment];
  setPayments(newPayments);
  saveToStorage('payments', newPayments);

  // Créer la facture avec le montant réel
  const invoice = {
    id: Date.now() + 1,
    clientId: paymentModal.clientId,
    amount: finalAmount,  // ✅ Utilise le montant final
    date: new Date().toISOString().split('T')[0],
    type: 'revenu',
    description: `Paiement ${paymentModal.paymentNumber} - ${client.name} (${method === 'cheque' ? 'Chèque' : 'Comptant'})${
      paymentModal.customAmount !== undefined && Math.abs(paymentModal.customAmount - paymentModal.amount) > 0.01
        ? ` - Montant ajusté: ${finalAmount.toFixed(2)}$` 
        : ''
    }`
  };

  const newInvoices = [...invoices, invoice];
  setInvoices(newInvoices);
  saveToStorage('invoices', newInvoices);

  // Marquer le paiement comme reçu dans le client
  const updatedClients = clients.map(c => {
    if (c.id === paymentModal.clientId) {
      const paymentField = `${
        paymentModal.paymentNumber === 1 ? 'first' :
        paymentModal.paymentNumber === 2 ? 'second' :
        paymentModal.paymentNumber === 3 ? 'third' : 'fourth'
      }PaymentReceived`;
      
      return { ...c, [paymentField]: true };
    }
    return c;
  });

  setClients(updatedClients);
  saveToStorage('clients', updatedClients);

  // Message de confirmation
  const diffText = paymentModal.customAmount !== undefined && Math.abs(paymentModal.customAmount - paymentModal.amount) > 0.01
    ? `\n\n⚠️ Montant modifié: ${finalAmount.toFixed(2)}$ au lieu de ${paymentModal.amount.toFixed(2)}$`
    : '';

  alert(`✅ Paiement enregistré!\n\nMontant: ${finalAmount.toFixed(2)}$\nMéthode: ${method === 'cheque' ? 'Chèque' : 'Comptant'}${diffText}`);

  // Fermer le modal
  setPaymentModal({ 
    isOpen: false, 
    clientId: null, 
    paymentNumber: null, 
    amount: 0,
    customAmount: undefined 
  });
};
  // FONCTIONS UTILITAIRES
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

  // EXPORT/IMPORT
  const exportData = () => {
    const allData = {
      clients, contracts, invoices, payments,
      exportDate: new Date().toISOString(), version: '3.0-render',
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
          setPayments(paymentsData);

          saveToStorage('clients', clientsData);
          saveToStorage('contracts', importedData.contracts || []);
          saveToStorage('invoices', importedData.invoices || []);
          saveToStorage('payments', paymentsData);
          alert('Données importées avec succès!');
        }
      } catch (error) {
        alert('Erreur lors de l\'import: fichier invalide');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // FONCTIONS DE RECHERCHE ET FILTRAGE
  const getFilteredContracts = () => {
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

  const getAdvancedFilteredContracts = () => {
  let filtered = contracts.filter(contract => 
    showArchived ? contract.archived : !contract.archived
  );

  // Appliquer les filtres de recherche
  if (contractSearchFilters.searchTerm) {
    filtered = filtered.filter(contract => {
      const client = clients.find(c => c.id === contract.clientId);
      return client?.name.toLowerCase().includes(contractSearchFilters.searchTerm.toLowerCase());
    });
  }

  if (contractSearchFilters.type) {
    filtered = filtered.filter(contract => 
      contract.type === contractSearchFilters.type
    );
  }

  if (contractSearchFilters.status) {
    filtered = filtered.filter(contract => 
      contract.status === contractSearchFilters.status
    );
  }

  if (contractSearchFilters.year) {
    filtered = filtered.filter(contract => 
      new Date(contract.startDate).getFullYear() === parseInt(contractSearchFilters.year)
    );
  }

  return filtered;
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
        client.address.toLowerCase().includes(clientSearchFilters.streetName.toLowerCase());

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

   // GÉNÉRATION CONTRAT PDF COMPLET
  const generateContract = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    const client = clients.find(c => c.id === contract.clientId);

    if (!contract || !client) {
      alert('Erreur: Contrat ou client introuvable');
      return;
    }

const paymentStructure = client.paymentStructure || '2';
const numPayments = parseInt(paymentStructure);
const paymentAmount = contract.amount / numPayments;
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
  ${client.phone2 ? `<p style="margin: 8px 0;"><strong>• Téléphone 2 :</strong> ${client.phone2}</p>` : ''}
  ${client.email ? `<p style="margin: 8px 0;"><strong>• Courriel :</strong> ${client.email}</p>` : ''}
</div>        
        <hr style="border: 1px solid #000; margin: 25px 0;">
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #000; font-size: 14px; margin-bottom: 15px; font-weight: bold;">Conditions Générales du Service :</h3>
          <p style="margin-bottom: 15px;">Le présent contrat établit les termes et conditions du service de déneigement fourni par JM Pominville au client susmentionné pour la saison hivernale.</p>
          <p style="margin: 12px 0;"><strong>1. Déclenchement du Service :</strong> Le service de déneigement débutera lorsque l'accumulation de neige atteindra un minimum de cinq (5) centimètres.</p>
          <p style="margin: 12px 0;"><strong>2. Protection de la Propriété :</strong> Il est de la responsabilité exclusive du client de protéger adéquatement ses arbres, arbustes, ainsi que tout autre objet décoratif ou aménagement paysager situé dans la zone de déneigement. JM Pominville déneigement se dégage de toute responsabilité quant aux dommages causés aux arbustes, aménagements paysager ou autres éléments décoratifs qui n'auront pas été adéquatement protégés par le client.</p>
          <p style="margin: 12px 0;"><strong>3. Libération des Aires de Stationnement :</strong> Le client s'engage à libérer les aires de stationnement et d'accès de tout objet mobile(incluant, mais sans s'y limiter, les pelles, rallonges électriques, poubelles ou autres équipements) avant chaque intervention de déneigement. JM Pominville déneigement ne pourra en aucun cas être tenu responsable des dommages causés auxdits objets laissés dans l'aire à déneiger, ni des retards ou limitations dans la prestation du service qui pourraient en découler.</p>
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
    <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
  </div>
` : `
  <p style="margin: 15px 0;">Le paiement s'effectuera en ${paymentStructure} versements :</p>
  
  <!-- 1er versement -->
  <div style="margin: 15px 0;">
    <p style="margin: 8px 0;"><strong>• 1er Versement :</strong></p>
    <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.firstPaymentDate || contract.startDate}</p>
    <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
  </div>
  
  <!-- 2e versement -->
  <div style="margin: 15px 0;">
    <p style="margin: 8px 0;"><strong>• 2e Versement :</strong></p>
    <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.secondPaymentDate || 'À déterminer'}</p>
    <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
  </div>
  
  ${(paymentStructure === '3' || paymentStructure === '4') ? `
    <!-- 3e versement -->
    <div style="margin: 15px 0;">
      <p style="margin: 8px 0;"><strong>• 3e Versement :</strong></p>
      <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.thirdPaymentDate || 'À déterminer'}</p>
      <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
    </div>
  ` : ''}
  
  ${paymentStructure === '4' ? `
    <!-- 4e versement -->
    <div style="margin: 15px 0;">
      <p style="margin: 8px 0;"><strong>• 4e Versement :</strong></p>
      <p style="margin: 5px 0; margin-left: 20px;">• Date : ${client.fourthPaymentDate || 'À déterminer'}</p>
      <p style="margin: 5px 0; margin-left: 20px;">• Montant : ${paymentAmount.toFixed(2)} $</p>
    </div>
  ` : ''}
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
                   style={{ height: '50px', max-width: '150px' }} />

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
  // FONCTIONS GPS ET GÉOLOCALISATION
  const getCurrentPosition = async () => {
    setGpsError(null);
    
    if (!navigator.geolocation) {
      const error = 'Géolocalisation non supportée par ce navigateur';
      setGpsError(error);
      throw new Error(error);
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      const error = 'La géolocalisation nécessite HTTPS. Veuillez accéder au site via https://';
      setGpsError(error);
      throw new Error(error);
    }

    try {
      console.log('Demande de permission géolocalisation...');
      
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
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000
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

  const shareLocationWithClients = async () => {
    let positionToShare = gpsPosition;
    
    if (!positionToShare) {
      alert('Obtenez d\'abord votre position GPS');
      return;
    }
    
    try {
      if (!positionToShare) {
        console.log('Aucune position GPS, tentative d\'obtention...');
        try {
          positionToShare = await getCurrentPosition();
        } catch (gpsError) {
          console.warn('Impossible d\'obtenir le GPS:', gpsError);
          
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

      // Simulation du partage en mode web (sans backend)
      const trackingData = {
        position: positionToShare,
        teamName: 'Équipe JM Pominville',
        lastUpdate: new Date().toISOString(),
        active: true,
        fallbackMode: positionToShare.method === 'fallback'
      };

      console.log('=== SIMULATION PARTAGE POSITION ===');
      console.log('Données qui seraient envoyées:', JSON.stringify(trackingData, null, 2));

      // Simulation d'un token de partage
      const simulatedToken = 'web-' + Date.now();
      const simulatedUrl = `https://votre-app.onrender.com/track/${simulatedToken}`;
      
      setShareToken(simulatedToken);
      setIsLocationShared(true);

      const message = `🚛 Équipe JM Pominville - Suivi en Temps Réel

Bonjour! Notre équipe de déneigement a commencé sa tournée.

📍 Suivez notre progression en temps réel:
${simulatedUrl}

Cette page vous montrera:
- Notre position actuelle
- Les rues en cours de traitement
- L'heure estimée d'arrivée dans votre secteur

${positionToShare.method === 'fallback' ? 
'⚠️ Position approximative utilisée en raison de problèmes GPS.' : 
'Position GPS précise activée.'}

Merci de votre patience!
- Équipe JM Pominville`;

      const clientsWithActiveContracts = clients.filter(client => {
        const contract = contracts.find(c =>
          c.clientId === client.id &&
          c.status === 'actif' &&
          !c.archived
        );
        return contract;
      });

      if (clientsWithActiveContracts.length === 0) {
        alert(`✅ Position partagée avec succès!\n\nLien de suivi: ${simulatedUrl}\n\n⚠️ Aucun client avec contrat actif trouvé pour l'envoi automatique.`);
        return;
      }

      const confirmSend = window.confirm(
        `✅ Position partagée avec succès!\n\nLien de suivi: ${simulatedUrl}\n\nSimuler l'envoi du lien à ${clientsWithActiveContracts.length} clients avec contrat actif?\n\n(Les notifications réelles seront disponibles avec le backend)`
      );

      if (confirmSend) {
        // Simulation de l'envoi
        alert(`📱 Simulation d'envoi de notifications!\n\nClients qui recevraient le message: ${clientsWithActiveContracts.length}\n\n🔗 Lien de suivi: ${simulatedUrl}\n\n💡 Les vraies notifications seront activées avec le backend`);
      }

    } catch (error) {
      console.error('Erreur complète shareLocationWithClients:', error);
      setGpsError(error.message);
      alert('Erreur lors du partage de localisation: ' + error.message);
    }
  };

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
      
      const interval = setInterval(async () => {
        try {
          const newPosition = await getCurrentPosition();
          
          // Simulation de la mise à jour (sans backend réel)
          if (shareToken) {
            console.log('Position mise à jour simulée:', newPosition.address);
            console.log('Token:', shareToken);
            console.log('Nouvelle position:', {
              token: shareToken,
              position: newPosition,
              lastUpdate: new Date().toISOString()
            });
          }
          
          console.log('Position mise à jour:', newPosition.address);
        } catch (error) {
          console.error('Erreur mise à jour position:', error);
        }
      }, 120000); // 2 minutes

      setTrackingInterval(interval);
      alert('Suivi automatique démarré (mise à jour toutes les 2 minutes)\n\n💡 En mode simulation - Les mises à jour réelles nécessitent le backend');

    } catch (error) {
      console.error('Erreur démarrage suivi:', error);
      alert('Erreur lors du démarrage du suivi automatique');
      setIsTrackingActive(false);
    }
  };

  const stopLocationTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    setIsTrackingActive(false);
    setIsLocationShared(false);
    setShareToken(null);
    alert('Suivi automatique arrêté');
    };
// FONCTION POUR EXTRAIRE LE NOM DE RUE
  const extractStreetName = (address) => {
    if (!address || typeof address !== 'string') return 'Adresses non définies';
    
    try {
      const cleanAddress = address.trim();
      const parts = cleanAddress.split(',');
      if (parts.length === 0) return 'Adresses non définies';
      
      let streetPart = parts[0].trim();
      streetPart = streetPart.replace(/^(\d+\s*[-\/\s]?\s*[a-zA-Z]?\s*)/i, '').trim();
      
      if (!streetPart) {
        streetPart = parts[0].trim();
      }
      
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
      
      streetPart = streetPart.replace(/\s+/g, ' ').trim();
      
      streetPart = streetPart.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      return streetPart || 'Adresses non définies';
      
    } catch (error) {
      console.error('Erreur extraction rue pour:', address, error);
      return 'Adresses non définies';
    }
  };

  // FONCTION DE GROUPEMENT PAR RUE
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
      .filter(streetName => streetName !== 'Adresses non définies')
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

  // RENDU DE L'INTERFACE PRINCIPALE
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* En-tête */}
      <header style={{
        background: 'linear-gradient(135deg, #1a4d1a 0%, #2d5a27 100%)',
        color: 'white', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '2em', fontWeight: 'bold' }}>JM Pominville</h1>
              <p style={{ margin: '0', fontSize: '1.1em', opacity: 0.9 }}>Gestion de Déneigement - Version Render</p>
              <div style={{ marginTop: '10px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: isOnline ? '#28a745' : '#dc3545'
                  }}></span>
                  <span style={{ fontSize: '14px' }}>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
                </div>
                <span style={{ fontSize: '14px', opacity: 0.8 }}>
                  Dernière sync: {lastSync}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="file" accept=".json" onChange={importData} 
                style={{display: 'none'}} id="import-file" 
              />
              <label htmlFor="import-file" style={{
                padding: '10px 15px', background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px',
                color: 'white', cursor: 'pointer', fontWeight: 'bold'
              }}>
                Import
              </label>
              <button onClick={exportData} style={{
                padding: '10px 15px', background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px',
                color: 'white', cursor: 'pointer', fontWeight: 'bold'
              }}>
                Export
              </button>
<button 
  onClick={async () => {
    console.log('🔍 Test manuel backend démarré...');
    try {
      const testUrl = `${API_BASE_URL}/api/test`;
      console.log('Test URL exacte:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données:', data);
        setBackendConnected(true);
        alert('✅ Backend connecté avec succès !');
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur:', response.status, errorText);
       
        setBackendConnected(false);
        alert(`❌ Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      setBackendConnected(false);
      alert(`❌ Erreur: ${error.message}`);
    }
  }}
  style={{
    padding: '10px 15px', 
    background: backendConnected ? '#28a745' : '#dc3545',
    color: 'white', 
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer', 
    fontWeight: 'bold',
    marginLeft: '10px'
  }}
>
  {backendConnected ? '✅ Backend OK' : '❌ Test Backend'}
</button>


        </div>
          </div>

          <nav style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {[
              { id: 'dashboard', label: '📊 Tableau de bord' },
              { id: 'clients', label: '👥 Clients' },
              { id: 'contracts', label: '📋 Contrats' },
              { id: 'accounting', label: '💰 Comptabilité' },
              { id: 'payments', label: '💳 Paiements' },
              { id: 'terrain', label: '🚛 Terrain' },
              { id: 'notifications', label: '📱 Notifications' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.2)',
                  color: activeTab === tab.id ? '#1a4d1a' : 'white',
                  border: 'none', borderRadius: '8px 8px 0 0',
                  cursor: 'pointer', fontWeight: 'bold',
                  fontSize: '14px', transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
                {activeTab === 'dashboard' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a4d1a', marginBottom: '25px', fontSize: '1.8em' }}>📊 Tableau de Bord</h2>
            
            {/* Statistiques principales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'linear-gradient(135deg, #28a745, #20c997)', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '5px' }}>{clients.length}</div>
                <div style={{ fontSize: '1.1em' }}>Clients Total</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #007bff, #6f42c1)', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '5px' }}>{contracts.filter(c => !c.archived).length}</div>
                <div style={{ fontSize: '1.1em' }}>Contrats Actifs</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #fd7e14, #e83e8c)', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '5px' }}>{payments.length}</div>
                <div style={{ fontSize: '1.1em' }}>Paiements Reçus</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #20c997, #17a2b8)', padding: '20px', borderRadius: '12px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '5px' }}>
                  {invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0).toFixed(0)}$
                </div>
                <div style={{ fontSize: '1.1em' }}>Revenus Total</div>
              </div>
            </div>

            {/* FEUILLE DE SUIVI IMPRIMABLE */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#1a4d1a', margin: 0 }}>📋 Feuille de Suivi Terrain</h3>
                <button
                  onClick={() => {
                    const printContent = document.getElementById('feuille-suivi').innerHTML;
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Feuille de Suivi - JM Pominville</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { text-align: center; margin-bottom: 30px; color: #1a4d1a; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                            th { background-color: #f5f5f5; font-weight: bold; }
                            .checkbox { width: 20px; height: 20px; border: 2px solid #333; display: inline-block; margin: 0 auto; }
                            .address-col { width: 40%; }
                            .payment-col, .piquet-col { width: 30%; text-align: center; }
                            .date { text-align: right; margin-top: 30px; }
                            @media print { 
                              body { margin: 10px; }
                              .no-print { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          <h1>JM POMINVILLE - FEUILLE DE SUIVI DÉNEIGEMENT</h1>
                          <div class="date">Date: _______________</div>
                          ${printContent}
                          <div style="margin-top: 40px;">
                            <p><strong>Légende:</strong></p>
                            <p>✓ = Complété | ✗ = Non complété | - = Non applicable</p>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }}
                  style={{
                    padding: '10px 20px', background: '#1a4d1a', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  🖨️ Imprimer Feuille
                </button>
              </div>

              <div id="feuille-suivi" style={{ 
                background: 'white', border: '2px solid #ddd', borderRadius: '8px', 
                padding: '20px', fontFamily: 'Arial, sans-serif' 
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ 
                        padding: '12px', border: '1px solid #333', textAlign: 'left',
                        fontWeight: 'bold', fontSize: '14px'
                      }}>
                        ADRESSE (Ordre Alphabétique)
                      </th>
                      <th style={{ 
                        padding: '12px', border: '1px solid #333', textAlign: 'center',
                        fontWeight: 'bold', fontSize: '14px', width: '150px'
                      }}>
                        PAIEMENT REÇU
                      </th>
                      <th style={{ 
                        padding: '12px', border: '1px solid #333', textAlign: 'center',
                        fontWeight: 'bold', fontSize: '14px', width: '150px'
                      }}>
                        PIQUETS INSTALLÉS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients
                      .filter(client => {
                        // Ne montrer que les clients avec contrats actifs
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        return contract;
                      })
                      .sort((a, b) => a.address.toLowerCase().localeCompare(b.address.toLowerCase()))
                      .map(client => {
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        const firstPaymentReceived = isPaymentReceived(client.id, 1);
                        const secondPaymentReceived = isPaymentReceived(client.id, 2);
                        const paymentStructure = client.paymentStructure || '2';
                        
                        // Statut paiement global
                        let paymentStatus = 'Non payé';
                        if (paymentStructure === '1' && firstPaymentReceived) {
                          paymentStatus = 'Payé';
                        } else if (paymentStructure === '2') {
                          if (firstPaymentReceived && secondPaymentReceived) {
                            paymentStatus = 'Payé';
                          } else if (firstPaymentReceived) {
                            paymentStatus = 'Partiel';
                          }
                        }

                        return (
                          <tr key={client.id}>
                            <td style={{ 
                              padding: '10px', border: '1px solid #333',
                              fontSize: '12px', lineHeight: '1.4'
                            }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                                {client.name}
                              </div>
                              <div style={{ color: '#666' }}>
                                {client.address}
                              </div>
                              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                                {client.phone}
                              </div>
                            </td>
                            <td style={{ 
                              padding: '10px', border: '1px solid #333', textAlign: 'center'
                            }}>
                              <div style={{ marginBottom: '8px' }}>
                                <div style={{
                                  width: '20px', height: '20px', border: '2px solid #333',
                                  display: 'inline-block',
                                  background: paymentStatus === 'Payé' ? '#28a745' : 
                                             paymentStatus === 'Partiel' ? '#ffc107' : 'white',
                                  position: 'relative'
                                }}>
                                  {paymentStatus === 'Payé' && (
                                    <span style={{
                                      position: 'absolute', top: '-2px', left: '2px',
                                      color: 'white', fontWeight: 'bold', fontSize: '14px'
                                    }}>✓</span>
                                  )}
                                  {paymentStatus === 'Partiel' && (
                                    <span style={{
                                      position: 'absolute', top: '-2px', left: '4px',
                                      color: '#000', fontWeight: 'bold', fontSize: '12px'
                                    }}>½</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ fontSize: '10px', color: '#666' }}>
                                {contract ? contract.amount.toFixed(0) + '$' : 'N/A'}
                              </div>
                            </td>
                            <td style={{ 
                              padding: '10px', border: '1px solid #333', textAlign: 'center'
                            }}>
                              <div style={{
                                width: '20px', height: '20px', border: '2px solid #333',
                                display: 'inline-block', margin: '0 auto'
                              }}></div>
                              <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                                À cocher
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {/* Section notes */}
                <div style={{ marginTop: '30px', borderTop: '2px solid #333', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>NOTES DE TERRAIN:</h4>
                  <div style={{ 
                    border: '1px solid #333', minHeight: '80px', padding: '10px',
                    background: 'white'
                  }}>
                    {/* Lignes pour écriture manuelle */}
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ 
                        borderBottom: '1px solid #ccc', height: '20px', marginBottom: '5px' 
                      }}></div>
                    ))}
                  </div>
                </div>

                {/* Section signatures */}
                <div style={{ 
                  marginTop: '30px', display: 'flex', justifyContent: 'space-between',
                  borderTop: '1px solid #ccc', paddingTop: '20px'
                }}>
                  <div style={{ width: '45%' }}>
                    <div style={{ marginBottom: '30px', fontSize: '12px', fontWeight: 'bold' }}>
                      ÉQUIPE TERRAIN:
                    </div>
                    <div style={{ borderBottom: '1px solid #333', marginBottom: '10px' }}></div>
                    <div style={{ fontSize: '10px', textAlign: 'center', color: '#666' }}>
                      Signature
                    </div>
                  </div>
                  <div style={{ width: '45%' }}>
                    <div style={{ marginBottom: '30px', fontSize: '12px', fontWeight: 'bold' }}>
                      SUPERVISEUR:
                    </div>
                    <div style={{ borderBottom: '1px solid #333', marginBottom: '10px' }}></div>
                    <div style={{ fontSize: '10px', textAlign: 'center', color: '#666' }}>
                      Signature
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alertes de paiements */}
            {(() => {
              const alerts = getPaymentAlerts();
              if (alerts.length === 0) return null;

              return (
                <div style={{
                  background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '12px',
                  padding: '20px', marginBottom: '30px', borderLeft: '5px solid #fdcb6e'
                }}>
                  <h3 style={{ color: '#856404', marginBottom: '15px' }}>🔔 Alertes de Paiements ({alerts.length})</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {alerts.slice(0, 5).map((alert, index) => (
                      <div key={index} style={{
                        padding: '12px 16px', borderRadius: '8px',
                        background: alert.priority === 'high' ? '#f8d7da' : '#fff3cd',
                        border: `1px solid ${alert.priority === 'high' ? '#f5c6cb' : '#ffeaa7'}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <strong>{alert.client}</strong>
                          <div style={{ fontSize: '14px', color: '#666' }}>{alert.message}</div>
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

            {/* Activité récente */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ color: '#1a4d1a', marginBottom: '15px' }}>📈 Activité Récente</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {payments.slice(-5).reverse().map(payment => {
                  const client = clients.find(c => c.id === payment.clientId);
                  return (
                    <div key={payment.id} style={{
                      background: 'white', padding: '12px', borderRadius: '8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <strong>{client ? client.name : 'Client supprimé'}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {payment.paymentNumber}{payment.paymentNumber === 1 ? 'er' : 'e'} versement - {payment.date}
                        </div>
                      </div>
                      <div style={{ color: '#28a745', fontWeight: 'bold' }}>+{payment.amount.toFixed(2)}$</div>
                    </div>
                  );
                })}
                {payments.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                    Aucune activité récente
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
     
        {/* SECTION CLIENTS */}
              {activeTab === 'clients' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a4d1a', marginBottom: '25px', fontSize: '1.8em' }}>👥 Gestion des Clients</h2>

            {/* Alertes de paiements si présentes */}
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

            {/* Panneau de recherche */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px',
              marginBottom: '20px', border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#495057', marginBottom: '15px' }}>Recherche Avancée</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Recherche générale</label>
                  <input
                    type="text"
                    placeholder="Nom, adresse, téléphone..."
                    value={clientSearchFilters.searchTerm}
                    onChange={(e) => setClientSearchFilters({ ...clientSearchFilters, searchTerm: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type de client</label>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Statut paiement</label>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom de rue</label>
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

{/* Bouton pour ouvrir le modal */}
<button
  onClick={() => setShowAddClientModal(true)}
  style={{
    padding: '15px 30px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
    transition: 'all 0.2s',
    marginBottom: '20px'
  }}
  onMouseEnter={(e) => {
    e.target.style.transform = 'translateY(-2px)';
    e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
  }}
>
  ➕ Ajouter un nouveau client
</button>

{/* Modal d'ajout de client */}
{showAddClientModal && (
  <div 
    onClick={() => setShowAddClientModal(false)}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}
  >
    <div 
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '30px'
      }}
    >
      {/* Header avec bouton fermer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '15px'
      }}>
        <h4 style={{ 
          color: '#1a4d1a',
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          ➕ Ajouter un nouveau client (avec contrat automatique)
        </h4>
        <button
          onClick={() => setShowAddClientModal(false)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '0',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          ×
        </button>
      </div>

      {/* SECTION 1: Informations client */}
      <div style={{ 
        background: '#fff', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        border: '2px solid #1a4d1a'
      }}>
        <h5 style={{ color: '#1a4d1a', marginBottom: '15px' }}>👤 Informations du Client</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom du client *</label>
            <input
              type="text" 
              value={clientForm.name}
              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              placeholder="Ex: Jean Dupont"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Téléphone *</label>
            <input
              type="tel" 
              value={clientForm.phone}
              onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              placeholder="514-555-0123"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Téléphone 2 (optionnel)</label>
            <input
              type="tel" 
              value={clientForm.phone2 || ''}
              onChange={(e) => setClientForm({ ...clientForm, phone2: e.target.value })}
              placeholder="Numéro secondaire"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
            <input
              type="email" 
              value={clientForm.email}
              onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
              placeholder="client@example.com"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type *</label>
            <select
              value={clientForm.type}
              onChange={(e) => setClientForm({ ...clientForm, type: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">Sélectionner...</option>
              <option value="résidentiel">Résidentiel</option>
              <option value="commercial">Commercial</option>
              <option value="industriel">Industriel</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Adresse complète *</label>
          <textarea
            rows="2" 
            value={clientForm.address}
            onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
            placeholder="123 Rue Example, Ville, Province, Code postal"
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>
      </div>

      {/* SECTION 2: Contrat */}
      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        border: '2px solid #ffc107'
      }}>
        <h5 style={{ color: '#856404', marginBottom: '15px' }}>📋 Contrat de Déneigement</h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type de contrat *</label>
            <select
              value={clientForm.contractType}
              onChange={(e) => setClientForm({ ...clientForm, contractType: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">Sélectionner...</option>
              <option value="saisonnier">Saisonnier</option>
              <option value="par-service">Par service</option>
              <option value="mensuel">Mensuel</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Montant total ($) *</label>
            <input
              type="number" 
              min="0" 
              step="0.01" 
              value={clientForm.contractAmount}
              onChange={(e) => setClientForm({ ...clientForm, contractAmount: e.target.value })}
              placeholder="500.00"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de début *</label>
            <input
              type="date" 
              value={clientForm.startDate}
              onChange={(e) => setClientForm({ ...clientForm, startDate: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de fin</label>
            <input
              type="date" 
              value={clientForm.endDate}
              onChange={(e) => setClientForm({ ...clientForm, endDate: e.target.value })}
              placeholder="Auto: 31 mars prochain"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes spéciales</label>
          <textarea
            rows="2" 
            value={clientForm.contractNotes}
            onChange={(e) => setClientForm({ ...clientForm, contractNotes: e.target.value })}
            placeholder="Ex: Accès par l'arrière, attention aux arbustes..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>
      </div>

      {/* SECTION 3: Paiements */}
      <div style={{ 
        background: '#e7f3ff', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px', 
        border: '2px solid #007bff'
      }}>
        <h5 style={{ color: '#004085', marginBottom: '15px' }}>💰 Configuration des Paiements</h5>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          
          {/* Structure de paiement */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Structure de paiement *</label>
            <select
              value={clientForm.paymentStructure}
              onChange={(e) => setClientForm({...clientForm, paymentStructure: e.target.value})}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              required
            >
              <option value="1">1 versement unique</option>
              <option value="2">2 versements</option>
              <option value="3">3 versements</option>
              <option value="4">4 versements</option>
            </select>
          </div>

          {/* Date 1er paiement */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date 1er paiement *</label>
            <input
              type="date"
              value={clientForm.firstPaymentDate}
              onChange={(e) => setClientForm({...clientForm, firstPaymentDate: e.target.value})}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              required
            />
          </div>

          {/* Méthode 1er paiement */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Méthode 1er paiement *</label>
            <select
              value={clientForm.firstPaymentMethod}
              onChange={(e) => setClientForm({...clientForm, firstPaymentMethod: e.target.value})}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              required
            >
              <option value="">Sélectionner...</option>
              <option value="cheque">Chèque</option>
              <option value="comptant">Comptant</option>
            </select>
          </div>

          {/* 2e paiement */}
          {(clientForm.paymentStructure === '2' || clientForm.paymentStructure === '3' || clientForm.paymentStructure === '4') && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date 2e paiement</label>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={clientForm.secondPaymentDate === 'À venir'}
                      onChange={(e) => setClientForm({
                        ...clientForm, 
                        secondPaymentDate: e.target.checked ? 'À venir' : ''
                      })}
                    />
                    <span style={{ fontSize: '14px' }}>📅 Date à déterminer plus tard</span>
                  </label>
                </div>
                {clientForm.secondPaymentDate !== 'À venir' && (
                  <input
                    type="date"
                    value={clientForm.secondPaymentDate || ''}
                    onChange={(e) => setClientForm({...clientForm, secondPaymentDate: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                )}
                {clientForm.secondPaymentDate === 'À venir' && (
                  <div style={{ padding: '10px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', fontSize: '13px', marginTop: '8px' }}>
                    ⏳ Date à déterminer
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Méthode 2e paiement</label>
                <select
                  value={clientForm.secondPaymentMethod || ''}
                  onChange={(e) => setClientForm({...clientForm, secondPaymentMethod: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="">Sélectionner...</option>
                  <option value="cheque">Chèque</option>
                  <option value="comptant">Comptant</option>
                </select>
              </div>
            </>
          )}

          {/* 3e paiement */}
          {(clientForm.paymentStructure === '3' || clientForm.paymentStructure === '4') && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date 3e paiement (optionnel)</label>
                <input
                  type="date"
                  value={clientForm.thirdPaymentDate || ''}
                  onChange={(e) => setClientForm({...clientForm, thirdPaymentDate: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Méthode 3e paiement</label>
                <select
                  value={clientForm.thirdPaymentMethod || ''}
                  onChange={(e) => setClientForm({...clientForm, thirdPaymentMethod: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="">Sélectionner...</option>
                  <option value="cheque">Chèque</option>
                  <option value="comptant">Comptant</option>
                </select>
              </div>
            </>
          )}

          {/* 4e paiement */}
          {clientForm.paymentStructure === '4' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date 4e paiement (optionnel)</label>
                <input
                  type="date"
                  value={clientForm.fourthPaymentDate || ''}
                  onChange={(e) => setClientForm({...clientForm, fourthPaymentDate: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Méthode 4e paiement</label>
                <select
                  value={clientForm.fourthPaymentMethod || ''}
                  onChange={(e) => setClientForm({...clientForm, fourthPaymentMethod: e.target.value})}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="">Sélectionner...</option>
                  <option value="cheque">Chèque</option>
                  <option value="comptant">Comptant</option>
                </select>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button 
          onClick={() => setShowAddClientModal(false)}
          style={{
            padding: '12px 24px', 
            background: '#6c757d', 
            color: 'white',
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          ❌ Annuler
        </button>
        <button 
          onClick={() => {
            addClient();
            setShowAddClientModal(false);
          }} 
          style={{
            padding: '12px 24px', 
            background: '#28a745', 
            color: 'white',
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          ✅ Créer Client + Contrat
        </button>
      </div>

    </div>
  </div>
)}

  {/* ALERTES DE PAIEMENT - Clients sans 2e versement */}
{(() => {
  const clientsWithMissingPayment = getAdvancedFilteredClients().filter(client => {
    if (client.paymentStructure === '1') return false; // Paiement unique, pas de 2e versement
    return !client.secondPaymentDate || client.secondPaymentDate === '';
  });

  if (clientsWithMissingPayment.length > 0) {
    return (
      <div className="payment-warning">
        <strong>⚠️ {clientsWithMissingPayment.length} client(s) n'ont pas encore payé leur 2e versement :</strong>
        <ul>
          {clientsWithMissingPayment.map(client => (
            <li key={client.id}>
              <strong>{client.name}</strong> - {client.address}
              {client.firstPaymentDate && ` (1er versement: ${client.firstPaymentDate})`}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
})()}           
  {/* Liste des clients avec méthodes de paiement */}
            {getAdvancedFilteredClients().length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  background: 'white', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Contact</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Type</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Statut Paiements</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAdvancedFilteredClients()
                      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                      .map(client => {
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        const firstPaymentReceived = isPaymentReceived(client.id, 1);
                        const secondPaymentReceived = isPaymentReceived(client.id, 2);
                        
                        // Récupération des méthodes de paiement
                        const firstPayment = payments.find(p => p.clientId === client.id && p.paymentNumber === 1);
                        const secondPayment = payments.find(p => p.clientId === client.id && p.paymentNumber === 2);

                        return (
                          <tr key={client.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '15px' }}>
                              <div>
                                <strong style={{ color: '#1a4d1a' }}>{client.name}</strong>
                                <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                                  {client.address}
                                </div>
                              </div>
                            </td>
                       
                            <td style={{ padding: '15px' }}>
  <div>
    <div>📞 {client.phone}</div>
    {client.phone2 && <div style={{ fontSize: '12px', color: '#666' }}>📞 {client.phone2}</div>}
    {client.email && <div style={{ fontSize: '12px', color: '#666' }}>📧 {client.email}</div>}
  </div>
</td>
      <td style={{ padding: '15px' }}>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                                fontWeight: 'bold', background: '#e8f5e8', color: '#1a4d1a'
                              }}>
                                {client.type || 'Non défini'}
                              </span>
                            </td>

                         <td style={{ padding: '15px' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <div style={{
      padding: '4px 8px', borderRadius: '8px',
      background: firstPaymentReceived ? '#d4edda' : '#f8d7da',
      fontSize: '11px', textAlign: 'center'
    }}>
      <div>1er: {(client.firstPaymentReceived !== undefined ? client.firstPaymentReceived : (client.firstPaymentDate ? true : false)) ? '✅ Reçu' : '❌ En attente'}</div>      <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>
        {client.firstPaymentMethod === 'cheque' ? '📄 Chèque' : 
         client.firstPaymentMethod === 'comptant' ? '💰 Comptant' : '⚠️ Non défini'}
      </div>
      {client.firstPaymentDate && (
        <div style={{ fontSize: '8px', color: '#666' }}>
          Date: {new Date(client.firstPaymentDate).toLocaleDateString('fr-CA')}
        </div>
      )}
    </div>
    
    {client.paymentStructure === '2' && (
      <div style={{
        padding: '4px 8px', borderRadius: '8px',
        background: secondPaymentReceived ? '#d4edda' : '#f8d7da',
        fontSize: '11px', textAlign: 'center'
      }}>
        <div>2e: {(client.secondPaymentReceived !== undefined ? client.secondPaymentReceived : ((client.paymentStructure === '2' && client.secondPaymentDate && client.secondPaymentDate !== 'À venir') ? true : false)) ? '✅ Reçu' : '❌ En attente'}</div>        <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>
          {client.secondPaymentMethod === 'cheque' ? '📄 Chèque' : 
           client.secondPaymentMethod === 'comptant' ? '💰 Comptant' : '⚠️ Non défini'}
        </div>
        {client.secondPaymentDate && (
          <div style={{ fontSize: '8px', color: '#666' }}>
            Date: {new Date(client.secondPaymentDate).toLocaleDateString('fr-CA')}
          </div>
        )}
      </div>
    )}
  </div>
  {/* 3e paiement - Si 3 ou 4 versements */}
              {(client.paymentStructure === '3' || client.paymentStructure === '4') && client.thirdPaymentDate && (
                <div style={{
                  padding: '4px 8px', 
                  borderRadius: '8px',
                  background: isPaymentReceived(client.id, 3) ? '#d4edda' : '#f8d7da',
                  fontSize: '11px', 
                  textAlign: 'center'
                }}>
                  <div>3e: {isPaymentReceived(client.id, 3) ? '✅ Reçu' : '❌ Non reçu'}</div>
                  <div>
                    {client.thirdPaymentMethod === 'cheque' ? '📄 Chèque' :
                     client.thirdPaymentMethod === 'comptant' ? '💰 Comptant' : '⚠️ Non défini'}
                  </div>
                  {client.thirdPaymentDate && (
                    <div style={{ fontSize: '8px', color: '#666' }}>
                      Date: {new Date(client.thirdPaymentDate).toLocaleDateString('fr-CA')}
                    </div>
                  )}
                </div>
              )}

              {/* 4e paiement - Si 4 versements */}
              {client.paymentStructure === '4' && client.fourthPaymentDate && (
                <div style={{
                  padding: '4px 8px', 
                  borderRadius: '8px',
                  background: isPaymentReceived(client.id, 4) ? '#d4edda' : '#f8d7da',
                  fontSize: '11px', 
                  textAlign: 'center'
                }}>
                  <div>4e: {isPaymentReceived(client.id, 4) ? '✅ Reçu' : '❌ Non reçu'}</div>
                  <div>
                    {client.fourthPaymentMethod === 'cheque' ? '📄 Chèque' :
                                     client.fourthPaymentMethod === 'comptant' ? '💰 Comptant' : '⚠️ Non défini'}
                  </div>
                  {client.fourthPaymentDate && (
                    <div style={{ fontSize: '8px', color: '#666' }}>
                      Date: {new Date(client.fourthPaymentDate).toLocaleDateString('fr-CA')}
                    </div>
                  )}
                </div>
              )}
                </td>

                            <td style={{ padding: '15px' }}>
                              <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
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
                                  onClick={() => startEditClient(client)}
                                  style={{ padding: '5px 10px', fontSize: '12px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  ✏️ Modifier
                                </button>
                                
                                <button
                                  onClick={() => deleteClient(client.id)}
                                  style={{ padding: '5px 10px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
              </div>
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
        {/* SECTION CONTRATS */}
       {activeTab === 'contracts' && (
  <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
    <h2 style={{ color: '#1a4d1a', marginBottom: '25px', fontSize: '1.8em' }}>📋 Consultation des Contrats</h2>

    {/* Message informatif */}
    <div style={{ 
      background: '#e3f2fd', padding: '15px', borderRadius: '12px', 
      marginBottom: '20px', border: '2px solid #2196f3'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '24px' }}>ℹ️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' }}>
            Les contrats sont créés automatiquement avec les clients
          </div>
          <div style={{ fontSize: '13px', color: '#555' }}>
            Pour créer un nouveau contrat, allez dans <strong>"👥 Clients"</strong> → Ajouter un client. 
            Cette section permet de consulter, renouveler et générer les PDF.
          </div>
        </div>
      </div>
    </div>

    {/* Statistiques rapides */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
      <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#155724' }}>
          {contracts.filter(c => !c.archived).length}
        </div>
        <div style={{ fontSize: '13px', color: '#155724' }}>Contrats Actifs</div>
      </div>
      
      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#856404' }}>
          {contracts.filter(c => !c.archived).reduce((sum, c) => sum + c.amount, 0).toFixed(0)}$
        </div>
        <div style={{ fontSize: '13px', color: '#856404' }}>Revenus Prévus</div>
      </div>
      
      <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#721c24' }}>
          {contracts.filter(c => c.archived).length}
        </div>
        <div style={{ fontSize: '13px', color: '#721c24' }}>Contrats Archivés</div>
      </div>
    </div>

    {/* Bouton de renouvellement en masse */}
    <div style={{ 
      background: '#fff3cd', padding: '15px', borderRadius: '12px', 
      marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center',
      border: '2px solid #ffc107'
    }}>
      <div style={{ flex: 1 }}>
        <strong style={{ color: '#856404', fontSize: '15px' }}>🔄 Renouvellement de saison</strong>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
          Créez automatiquement tous les nouveaux contrats pour la prochaine saison d'un seul clic
        </div>
      </div>
      <button
        onClick={renewMultipleContracts}
        style={{
          padding: '12px 20px', background: '#ffc107', color: '#000',
          border: 'none', borderRadius: '8px', cursor: 'pointer', 
          fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        🔄 Renouveler TOUS
      </button>
    </div>

    {/* Boutons Actifs/Archives */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <button
        onClick={() => setShowArchived(false)}
        style={{
          padding: '10px 15px',
          background: !showArchived ? '#1a4d1a' : '#6c757d',
          color: 'white', border: 'none', borderRadius: '8px',
          cursor: 'pointer', fontWeight: 'bold'
        }}
      >
        📋 Contrats Actifs ({contracts.filter(c => !c.archived).length})
      </button>
      <button
        onClick={() => setShowArchived(true)}
        style={{
          padding: '10px 15px',
          background: showArchived ? '#1a4d1a' : '#6c757d',
          color: 'white', border: 'none', borderRadius: '8px',
          cursor: 'pointer', fontWeight: 'bold'
        }}
      >
        📦 Archives ({contracts.filter(c => c.archived).length})
      </button>
    </div>
{/* Boutons de sélection et impression multiple */}
{!showArchived && (
  <div style={{ 
    background: '#f8f9fa', padding: '15px', borderRadius: '12px', 
    marginBottom: '20px', border: '1px solid #dee2e6',
    display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
  }}>
    <div style={{ flex: 1 }}>
      <strong>🖨️ Impression de contrats</strong>
      <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>
        {selectedContracts.length > 0 
          ? `${selectedContracts.length} contrat(s) sélectionné(s)` 
          : 'Sélectionnez des contrats à imprimer'}
      </div>
    </div>
    
    <button
      onClick={() => {
        const activeContracts = getAdvancedFilteredContracts().filter(c => !c.archived);
        if (selectedContracts.length === activeContracts.length) {
          setSelectedContracts([]);
        } else {
          setSelectedContracts(activeContracts.map(c => c.id));
        }
      }}
      style={{
        padding: '8px 16px', background: '#6c757d', color: 'white',
        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
      }}
    >
      {selectedContracts.length === getAdvancedFilteredContracts().filter(c => !c.archived).length 
        ? '❌ Tout désélectionner' 
        : '✅ Tout sélectionner'}
    </button>
    
    <button
      onClick={() => printMultipleContracts()}
      disabled={selectedContracts.length === 0}
      style={{
        padding: '8px 16px', 
        background: selectedContracts.length === 0 ? '#ccc' : '#28a745', 
        color: 'white',
        border: 'none', borderRadius: '6px', 
        cursor: selectedContracts.length === 0 ? 'not-allowed' : 'pointer', 
        fontWeight: 'bold'
      }}
    >
      🖨️ Imprimer sélection ({selectedContracts.length})
    </button>
  </div>
)}

    {/* NOUVELLE SECTION DE RECHERCHE POUR CONTRATS */}
    <div style={{
      background: '#f8f9fa', padding: '20px', borderRadius: '12px',
      marginBottom: '20px', border: '1px solid #dee2e6'
    }}>
      <h4 style={{ color: '#495057', marginBottom: '15px' }}>🔍 Recherche de Contrats</h4>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Nom du client
          </label>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={contractSearchFilters.searchTerm}
            onChange={(e) => setContractSearchFilters({ ...contractSearchFilters, searchTerm: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Type de contrat
          </label>
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
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Statut
          </label>
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
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
            Année
          </label>
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

      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setContractSearchFilters({ searchTerm: '', type: '', status: '', year: '' })}
          style={{
            padding: '8px 16px', background: '#6c757d', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          Réinitialiser
        </button>
        <div style={{ color: '#666', fontSize: '14px' }}>
          Résultats: {getAdvancedFilteredContracts().length} contrat(s) trouvé(s)
        </div>
      </div>
    </div>

            {/* Formulaire de contrat (seulement si pas en mode archivé) */}
            {!showArchived && (
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                <h4 style={{ marginBottom: '15px' }}>Créer un nouveau contrat</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Client</label>
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
                      placeholder="Tapez le nom du client..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />

                    {showClientSuggestions && clientSearch && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #ddd', borderRadius: '8px',
                        maxHeight: '200px', overflowY: 'auto', zIndex: 10,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}>
                        {getAdvancedFilteredClients().map(client => (
                          <div
                            key={client.id} onClick={() => handleClientSelect(client)}
                            style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                          >
                            <strong>{client.name}</strong><br />
                            {client.paymentStructure === '2' && (
  <span className={!client.secondPaymentDate || client.secondPaymentDate === '' ? 'payment-status payment-incomplete' : 'payment-status payment-complete'}>
    {!client.secondPaymentDate || client.secondPaymentDate === '' ? '⚠️ 2e versement manquant' : '✓ Payé'}
  </span>
)}                            <small style={{ color: '#666' }}>{client.address}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type de contrat</label>
                    <select
                      value={contractForm.type}
                      onChange={(e) => setContractForm({ ...contractForm, type: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="saisonnier">Saisonnier</option>
                      <option value="par-service">Par service</option>
                      <option value="mensuel">Mensuel</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de début</label>
                    <input
                      type="date" value={contractForm.startDate}
                      onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de fin</label>
                    <input
                      type="date" value={contractForm.endDate}
                      onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                  </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Montant ($)</label>
                  <input
                    type="number" min="0" step="0.01" value={contractForm.amount}
                    onChange={(e) => setContractForm({ ...contractForm, amount: e.target.value })}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Statut</label>
                  <select
                    value={contractForm.status}
                    onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="actif">Actif</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="terminé">Terminé</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes spéciales</label>
                <textarea
                  rows="3" value={contractForm.notes}
                  onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                  placeholder="Instructions spéciales, accès, etc."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>

              <button onClick={addContract} style={{
                padding: '12px 24px', background: '#007bff', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}>
                Créer Contrat
              </button>
            </div>
            )}

            {/* Liste des contrats */}
            {getAdvancedFilteredContracts().length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  background: 'white', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Type</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Période</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Montant</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Statut</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAdvancedFilteredContracts().map(contract => {
                      const client = clients.find(c => c.id === contract.clientId);
                      return (
                        <tr key={contract.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  {/* ✅ Colonne Checkbox (seulement pour actifs) */}
        {!showArchived && (
          <td style={{ padding: '15px', textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={selectedContracts.includes(contract.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedContracts([...selectedContracts, contract.id]);
                } else {
                  setSelectedContracts(selectedContracts.filter(id => id !== contract.id));
                }
              }}
              style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
            />
          </td>
        )}                          <td style={{ padding: '15px' }}>
                            <strong style={{ color: '#1a4d1a' }}>{client ? client.name : 'Client supprimé'}</strong>
                            {client && <><br /><small style={{ color: '#666' }}>{client.address}</small></>}
                          </td>
                          <td style={{ padding: '15px' }}>{contract.type}</td>
                          <td style={{ padding: '15px' }}>
                            <div>
                              <div>Début: {contract.startDate}</div>
                              <div>Fin: {contract.endDate || 'Non définie'}</div>
                            </div>
                          </td>
                          <td style={{ padding: '15px', fontWeight: 'bold', color: '#28a745' }}>{contract.amount.toFixed(2)} $</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                              background: contract.status === 'actif' ? '#d4edda' : 
                                         contract.status === 'suspendu' ? '#fff3cd' : '#f8d7da',
                              color: contract.status === 'actif' ? '#155724' :
                                    contract.status === 'suspendu' ? '#856404' : '#721c24'
                            }}>
                              {contract.status}
                            </span>
                          </td>
<td style={{ padding: '15px' }}>
  <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
    {!contract.archived && (
      <button
        onClick={() => renewContract(contract.id)}
        style={{
          padding: '5px 10px', fontSize: '12px', background: '#ffc107', 
          color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🔄 Renouveler
      </button>
    )}
    
    <button
      onClick={() => generateContract(contract.id)}
      style={{
        padding: '5px 10px', fontSize: '12px', background: '#17a2b8', color: 'white',
        border: 'none', borderRadius: '4px', cursor: 'pointer'
      }}
    >
      📄 Contrat PDF
    </button>
    
    {!contract.archived && (
      <>
        <button
          onClick={() => startEditContract(contract)}
          style={{
            padding: '5px 10px', fontSize: '12px', background: '#007bff', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}
        >
          ✏️ Modifier
        </button>
        <button
          onClick={() => deleteContract(contract.id)}
          style={{
            padding: '5px 10px', fontSize: '12px', background: '#dc3545', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer'
          }}
        >
          🗑️ Supprimer
        </button>
      </>
    )}
    
    {contract.archived && (
      <span style={{
        padding: '5px 10px', fontSize: '11px', background: '#6c757d', 
        color: 'white', borderRadius: '4px', textAlign: 'center'
      }}>
        📦 Archivé {contract.yearArchived || ''}
      </span>
    )}
  </div>
</td>
  </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* SECTION COMPTABILITÉ */}
        {activeTab === 'accounting' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a4d1a', marginBottom: '25px', fontSize: '1.8em' }}>💰 Comptabilité</h2>

            {/* Formulaire d'ajout de transaction */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
              <h4 style={{ marginBottom: '15px' }}>Ajouter une transaction</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type de transaction</label>
                  <select
                    value={invoiceForm.type}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="revenu">Revenu</option>
                    <option value="depense">Dépense</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date</label>
                  <input
                    type="date" value={invoiceForm.date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Montant ($)</label>
                  <input
                    type="number" min="0" step="0.01" value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                {invoiceForm.type === 'revenu' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Client (pour revenus)</label>
                    <select
                      value={invoiceForm.clientId}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                      <option value="">Sélectionner client...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  rows="3" value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  placeholder="Description de la transaction"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>

              <button onClick={addInvoice} style={{
                padding: '12px 24px', background: '#28a745', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}>
                Ajouter Transaction
              </button>
            </div>

            {/* Liste des transactions */}
            {invoices.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  background: 'white', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Date</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Type</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Description</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Montant</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(invoice => {
                      const client = invoice.clientId ? clients.find(c => c.id === invoice.clientId) : null;
                      return (
                        <tr key={invoice.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                          <td style={{ padding: '15px' }}>{invoice.date}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                              background: invoice.type === 'revenu' ? '#d4edda' : '#f8d7da',
                              color: invoice.type === 'revenu' ? '#155724' : '#721c24'
                            }}>
                              {invoice.type}
                            </span>
                          </td>
                          <td style={{ padding: '15px' }}>{client ? client.name : 'N/A'}</td>
                          <td style={{ padding: '15px' }}>{invoice.description}</td>
                          <td style={{ padding: '15px', fontWeight: 'bold', color: invoice.type === 'revenu' ? '#28a745' : '#dc3545' }}>
                            {invoice.type === 'revenu' ? '+' : '-'}{invoice.amount.toFixed(2)} $
                          </td>
                          <td style={{ padding: '15px' }}>
                            <button
                              onClick={() => deleteInvoice(invoice.id)}
                              style={{
                                padding: '5px 10px', fontSize: '12px', background: '#dc3545', color: 'white',
                                border: 'none', borderRadius: '4px', cursor: 'pointer'
                              }}
                            >
                              🗑️ Supprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Résumé financier */}
            <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '15px', color: '#1a4d1a' }}>Résumé Financier</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#155724', marginBottom: '5px' }}>Total Revenus</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                    {invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)} $
                  </div>
                </div>
                <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#721c24', marginBottom: '5px' }}>Total Dépenses</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                    {invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)} $
                  </div>
                </div>
                <div style={{
                  background: (invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0) - invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0)) >= 0 ? '#d1ecf1' : '#f8d7da',
                  padding: '15px', borderRadius: '8px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '5px', color: (invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0) - invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0)) >= 0 ? '#0c5460' : '#721c24' }}>Bénéfice Net</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: (invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0) - invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0)) >= 0 ? '#0c5460' : '#721c24' }}>
                    {(invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0) - invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0)).toFixed(2)} $
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION PAIEMENTS */}
        {activeTab === 'payments' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a4d1a', marginBottom: '25px', fontSize: '1.8em' }}>💳 Suivi des Paiements</h2>
            
            {/* Résumé financier */}
            <div style={{
              marginBottom: '30px', padding: '20px',
              background: '#f8f9fa', borderRadius: '12px'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#1a4d1a' }}>Résumé Financier Global</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#155724', marginBottom: '5px' }}>Total Revenus</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                    {invoices.filter(inv => inv.type === 'revenu').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)} $
                  </div>
                </div>
                <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#721c24', marginBottom: '5px' }}>Total Dépenses</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                    {invoices.filter(inv => inv.type === 'depense').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)} $
                  </div>
                </div>
                <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: '#1976d2', marginBottom: '5px' }}>Paiements Reçus</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                    {payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)} $
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                    {payments.length} versement{payments.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des paiements */}
            {payments.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  background: 'white', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Client</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Versement</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Montant</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Date Reçue</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Méthode</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 'bold' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(payment => {
                        const client = clients.find(c => c.id === payment.clientId);
                        return (
                          <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '15px' }}>
                              <strong style={{ color: '#1a4d1a' }}>
                                {client ? client.name : 'Client supprimé'}
                              </strong>
                              {client && <><br /><small style={{ color: '#666' }}>{client.address}</small></>}
                            </td>
                            <td style={{ padding: '15px' }}>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                                fontWeight: 'bold', background: '#e3f2fd', color: '#1976d2'
                              }}>
                                {payment.paymentNumber}{payment.paymentNumber === 1 ? 'er' : 'e'} versement
                              </span>
                            </td>
                            <td style={{ padding: '15px', fontWeight: 'bold', color: '#28a745' }}>
                              {payment.amount.toFixed(2)} $
                            </td>
                            <td style={{ padding: '15px' }}>{payment.date}</td>
                            <td style={{ padding: '15px' }}>
                              <span style={{
                                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                background: payment.paymentMethod === 'cheque' ? '#fff3cd' : '#d4edda',
                                color: payment.paymentMethod === 'cheque' ? '#856404' : '#155724'
                              }}>
                                {payment.paymentMethod === 'cheque' ? '📄 Chèque' : '💰 Comptant'}
                              </span>
                            </td>
                            <td style={{ padding: '15px' }}>
                              <button
                                onClick={() => deletePayment(payment.id)}
                                style={{
                                  padding: '5px 10px', fontSize: '12px', background: '#dc3545', color: 'white',
                                  border: 'none', borderRadius: '4px', cursor: 'pointer'
                                }}
                              >
                                🗑️ Supprimer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '40px 20px',
                background: '#f8f9fa', borderRadius: '12px',
                color: '#666', fontSize: '16px'
              }}>
                Aucun paiement enregistré pour le moment.
              </div>
            )}
          </div>
        )}

        {/* SECTION TERRAIN */}
              {activeTab === 'terrain' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a4d1a', marginBottom: '25px', fontSize: '1.8em' }}>🚛 Vue Équipe Terrain</h2>

            {/* Section GPS et Position */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#1a4d1a', marginBottom: '15px' }}>📍 Position GPS</h4>
              
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
                <button
                  onClick={getCurrentPosition}
                  style={{
                    padding: '10px 20px', background: '#007bff', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  📍 Obtenir Position GPS
                </button>
                
                {gpsPosition && (
                  <button
                    onClick={shareLocationWithClientsBackend}
                    style={{
                      padding: '10px 20px', background: '#28a745', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    📱 Partager avec Clients
                  </button>
                )}

                {gpsPosition && !isTrackingActive && (
                  <button
                    onClick={startLocationTracking}
                    style={{
                      padding: '10px 20px', background: '#17a2b8', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    ▶️ Démarrer Suivi
                  </button>
                )}

                {isTrackingActive && (
                  <button
                    onClick={stopLocationTracking}
                    style={{
                      padding: '10px 20px', background: '#dc3545', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    ⏹️ Arrêter Suivi
                  </button>
                )}
              </div>

              {/* Affichage des erreurs GPS */}
              {gpsError && (
                <div style={{
                  background: '#f8d7da', color: '#721c24', padding: '12px',
                  borderRadius: '8px', marginBottom: '15px', fontSize: '14px'
                }}>
                  <strong>Erreur GPS:</strong> {gpsError}
                </div>
              )}

              {/* Affichage de la position GPS */}
              {gpsPosition && (
                <div style={{
                  background: '#d4edda', color: '#155724', padding: '15px',
                  borderRadius: '8px', marginBottom: '15px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Position actuelle:</div>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <div><strong>Adresse:</strong> {gpsPosition.address || 'Adresse non disponible'}</div>
                    <div><strong>Coordonnées:</strong> {gpsPosition.lat.toFixed(6)}, {gpsPosition.lng.toFixed(6)}</div>
                    <div><strong>Précision:</strong> {gpsPosition.accuracy}m</div>
                    <div><strong>Dernière mise à jour:</strong> {gpsPosition.time}</div>
                    {gpsPosition.method && (
                      <div><strong>Méthode:</strong> {gpsPosition.method}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Statut du suivi */}
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                  background: isLocationShared ? '#d4edda' : '#f8d7da',
                  color: isLocationShared ? '#155724' : '#721c24'
                }}>
                  {isLocationShared ? '🟢 Position partagée' : '🔴 Position non partagée'}
                </div>
                
                <div style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                  background: isTrackingActive ? '#d1ecf1' : '#f8f9fa',
                  color: isTrackingActive ? '#0c5460' : '#6c757d'
                }}>
                  {isTrackingActive ? '🔄 Suivi actif' : '⏸️ Suivi arrêté'}
                </div>
              </div>
            </div>

            {/* Section Notifications Groupées */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#1a4d1a', marginBottom: '15px' }}>📱 Notifications Clients</h4>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type de notification:</label>
                <select
                  value={bulkNotificationType}
                  onChange={(e) => setBulkNotificationType(e.target.value)}
                  style={{
                    width: '100%', maxWidth: '300px', padding: '8px 12px',
                    borderRadius: '6px', border: '1px solid #ddd'
                  }}
                >
                  <option value="enroute">🚛 Équipe en route</option>
                  <option value="arrived">📍 Équipe arrivée</option>
                  <option value="completed">✅ Service terminé</option>
                  <option value="custom">✏️ Message personnalisé</option>
                </select>
              </div>

              {bulkNotificationType === 'custom' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message personnalisé:</label>
                  <textarea
                    value={bulkCustomMessage}
                    onChange={(e) => setBulkCustomMessage(e.target.value)}
                    rows="3"
                    placeholder="Tapez votre message personnalisé..."
                    style={{
                      width: '100%', padding: '8px 12px',
                      borderRadius: '6px', border: '1px solid #ddd'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button
                  onClick={() => {
                    const clientsWithContracts = clients.filter(client => {
                      const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                      return contract;
                    });
                    
                    if (clientsWithContracts.length === 0) {
                      alert('Aucun client avec contrat actif trouvé');
                      return;
                    }
                    
                    const confirmMessage = `Envoyer une notification "${bulkNotificationType}" à ${clientsWithContracts.length} clients ?`;
                    if (window.confirm(confirmMessage)) {
                      alert(`Fonctionnalité de notification désactivée dans cette version web. ${clientsWithContracts.length} clients auraient été notifiés.`);
                    }
                  }}
                  disabled={isSendingBulk}
                  style={{
                    padding: '10px 20px', background: isSendingBulk ? '#6c757d' : '#007bff',
                    color: 'white', border: 'none', borderRadius: '8px',
                    cursor: isSendingBulk ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                  }}
                >
                  {isSendingBulk ? '⏳ Envoi...' : '📤 Notifier Tous'}
                </button>
              </div>

              <div style={{
                background: '#fff3cd', padding: '10px', borderRadius: '6px',
                fontSize: '12px', color: '#856404'
              }}>
                💡 Les notifications seront activées lorsque le backend sera intégré
              </div>
            </div>

            {/* Statistiques Terrain */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#e8f5e8', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#1a4d1a', marginBottom: '5px' }}>
                  {contracts.filter(c => !c.archived && c.status === 'actif').length}
                </div>
                <div style={{ color: '#1a4d1a', fontWeight: 'bold' }}>Contrats Actifs</div>
              </div>
              
              <div style={{ background: '#f0f8ff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                  {clients.length}
                </div>
                <div style={{ color: '#007bff', fontWeight: 'bold' }}>Total Clients</div>
              </div>
              
              <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#856404', marginBottom: '5px' }}>
                  {clients.filter(client => {
                    const firstPaid = isPaymentReceived(client.id, 1);
                    const secondPaid = isPaymentReceived(client.id, 2);
                    const paymentStructure = client.paymentStructure || '2';
                    return paymentStructure === '1' ? !firstPaid : !(firstPaid && secondPaid);
                  }).length}
                </div>
                <div style={{ color: '#856404', fontWeight: 'bold' }}>Paiements en Attente</div>
              </div>
              
              <div style={{ background: '#d4edda', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#155724', marginBottom: '5px' }}>
                  {payments.length}
                </div>
                <div style={{ color: '#155724', fontWeight: 'bold' }}>Paiements Reçus</div>
              </div>
            </div>

            {/* Liste des clients avec statut pour terrain */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#1a4d1a', marginBottom: '15px' }}>👥 Clients - Vue Terrain</h4>
              
              {clients.filter(client => {
                const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                return contract;
              }).length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%', borderCollapse: 'collapse',
                    background: 'white', borderRadius: '8px', overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: '#e8f5e8' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>Client</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>Adresse</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>Paiement</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients
                        .filter(client => {
                          const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                          return contract;
                        })
                        .sort((a, b) => a.address.toLowerCase().localeCompare(b.address.toLowerCase()))
                        .map(client => {
                          const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                          const firstPaid = isPaymentReceived(client.id, 1);
                          const secondPaid = isPaymentReceived(client.id, 2);
                          const paymentStructure = client.paymentStructure || '2';
                          
                          let paymentStatus = 'Non payé';
                          let statusColor = '#dc3545';
                          if (paymentStructure === '1' && firstPaid) {
                            paymentStatus = 'Payé';
                            statusColor = '#28a745';
                          } else if (paymentStructure === '2') {
                            if (firstPaid && secondPaid) {
                              paymentStatus = 'Payé';
                              statusColor = '#28a745';
                            } else if (firstPaid) {
                              paymentStatus = 'Partiel';
                              statusColor = '#ffc107';
                            }
                          }

                          return (
                            <tr key={client.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                              <td style={{ padding: '10px', fontSize: '13px' }}>
                                <div style={{ fontWeight: 'bold' }}>{client.name}</div>
                                <div style={{ fontSize: '11px', color: '#666' }}>{client.phone}</div>
                              </td>
                              <td style={{ padding: '10px', fontSize: '12px' }}>{client.address}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 8px', borderRadius: '12px', fontSize: '10px',
                                  fontWeight: 'bold', background: statusColor + '20', color: statusColor
                                }}>
                                  {paymentStatus}
                                </span>
                                <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                                  {contract ? contract.amount.toFixed(0) + '$' : 'N/A'}
                                </div>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button
                                  onClick={() => {
                                    sendNotificationViaBackend(client.id, 'enroute','')
                                  }}
                                  style={{
                                    padding: '4px 8px', background: '#007bff', color: 'white',
                                    border: 'none', borderRadius: '4px', fontSize: '10px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  📱 Notifier
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  Aucun client avec contrat actif
                </div>
              )}
            </div>
          </div>
                
        )}

        {/* SECTION NOTIFICATIONS */}
             {activeTab === 'notifications' && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1a4d1a', marginBottom: '25px', fontSize: '1.8em' }}>📱 Notifications Clients</h2>
            
          {!backendConnected && (
  <div style={{
    background: backendConnected ? '#fff3cd' : '#f8d7da', 
    padding: '15px', borderRadius: '10px',
    marginBottom: '20px', textAlign: 'center', fontWeight: 'bold',
    color: backendConnected ? '#856404' : '#721c24'
  }}>
    {backendConnected ? 
      '🟡 Backend connecté - Fonctionnalités en cours d\'activation' : 
  

    '🔴 Backend disponible'    }
  </div>
)}

            {/* Notifications individuelles rapides */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#1a4d1a', marginBottom: '15px' }}>📤 Notification Rapide</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Client:</label>
                  <select style={{
                    width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd'
                  }}>
                    <option value="">Sélectionner un client...</option>
                    {clients
                      .filter(client => {
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        return contract;
                      })
                      .map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} - {client.address}
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type:</label>
                  <select style={{
                    width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd'
                  }}>
                    <option value="enroute">🚛 En route</option>
                    <option value="arrived">📍 Arrivé</option>
                    <option value="completed">✅ Terminé</option>
                    <option value="custom">✏️ Personnalisé</option>
                  </select>
                </div>
              </div>
              
              <button style={{
                padding: '10px 20px', background: '#007bff', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}>
                📱 Envoyer Notification
              </button>
            </div>

            {/* Section des notifications par rues */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{ color: '#1a4d1a', marginBottom: '15px' }}>🏘️ Notifications par Rues</h4>

              {/* Barre de recherche pour les rues */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  🔍 Rechercher des rues:
                </label>
                <input
                  type="text"
                  value={streetSearchTerm}
                  onChange={(e) => setStreetSearchTerm(e.target.value)}
                  placeholder="Tapez une partie du nom de rue (ex: 'Prin' pour rue Principale)"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '6px', 
                    border: '1px solid #ddd', fontSize: '14px'
                  }}
                />
              </div>

              {/* Type de notification pour envoi groupé */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Type de notification:
                  </label>
                  <select
                    value={bulkNotificationType}
                    onChange={(e) => setBulkNotificationType(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd'
                    }}
                  >
                    <option value="enroute">🚛 Équipe en route</option>
                    <option value="arrived">📍 Équipe arrivée</option>
                    <option value="completed">✅ Service terminé</option>
                    <option value="custom">✏️ Message personnalisé</option>
                  </select>
                </div>
              </div>

              {/* Message personnalisé */}
              {bulkNotificationType === 'custom' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Message personnalisé:
                  </label>
                  <textarea
                    value={bulkCustomMessage}
                    onChange={(e) => setBulkCustomMessage(e.target.value)}
                    rows="3"
                    placeholder="Tapez votre message personnalisé..."
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px', 
                      border: '1px solid #ddd', resize: 'vertical'
                    }}
                  />
                </div>
              )}

              {/* Liste des rues avec sélection multiple */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 'bold' }}>
                    Sélectionner les rues: ({selectedStreets.length} sélectionnée{selectedStreets.length !== 1 ? 's' : ''})
                  </label>
                  <button
                    onClick={() => {
                      const streetGroups = groupClientsByStreet(clients.filter(client => {
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        return contract;
                      }));
                      const filteredStreets = Object.keys(streetGroups).filter(street => 
                        street.toLowerCase().includes(streetSearchTerm.toLowerCase())
                      );
                      
                      if (selectedStreets.length === filteredStreets.length) {
                        setSelectedStreets([]);
                      } else {
                        setSelectedStreets(filteredStreets);
                      }
                    }}
                    style={{
                      padding: '5px 10px', background: '#6c757d', color: 'white',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {(() => {
                      const streetGroups = groupClientsByStreet(clients.filter(client => {
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        return contract;
                      }));
                      const filteredStreets = Object.keys(streetGroups).filter(street => 
                        street.toLowerCase().includes(streetSearchTerm.toLowerCase())
                      );
                      return selectedStreets.length === filteredStreets.length ? 'Désélectionner tout' : 'Sélectionner tout';
                    })()}
                  </button>
                </div>

                {/* Liste des rues filtrées */}
                <div style={{
                  maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd',
                  borderRadius: '6px', background: 'white'
                }}>
                  {(() => {
                    // Groupement des clients par rue
                    const clientsWithContracts = clients.filter(client => {
                      const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                      return contract;
                    });
                    
                    const streetGroups = groupClientsByStreet(clientsWithContracts);
                    
                    // Filtrage selon le terme de recherche
                    const filteredStreets = Object.keys(streetGroups)
                      .filter(street => street.toLowerCase().includes(streetSearchTerm.toLowerCase()))
                      .sort();

                    if (filteredStreets.length === 0) {
                      return (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          {streetSearchTerm ? 
                            `Aucune rue trouvée contenant "${streetSearchTerm}"` :
                            'Aucune rue trouvée avec des clients actifs'
                          }
                        </div>
                      );
                    }

                    return filteredStreets.map(streetName => {
                      const streetClients = streetGroups[streetName] || [];
                      const isSelected = selectedStreets.includes(streetName);
                      
                      return (
                        <div key={streetName} style={{
                          padding: '10px 15px', borderBottom: '1px solid #eee',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          background: isSelected ? '#e3f2fd' : 'white',
                          ':hover': { background: '#f8f9fa' }
                        }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStreets(selectedStreets.filter(s => s !== streetName));
                          } else {
                            setSelectedStreets([...selectedStreets, streetName]);
                          }
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Contrôlé par le onClick du div
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#1a4d1a' }}>
                              {streetName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {streetClients.length} client{streetClients.length !== 1 ? 's' : ''}
                              {streetClients.length > 0 && (
                                <span> - {streetClients.map(c => c.name).join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
  onClick={async () => {
    if (selectedStreets.length === 0) {
      alert('Veuillez sélectionner au moins une rue');
      return;
    }

    const streetGroups = groupClientsByStreet(clients.filter(client => {
      const contract = contracts.find(c => c.clientId === client.id && !c.archived);
      return contract;
    }));

    let clientsToNotify = [];
    selectedStreets.forEach(street => {
      const streetClients = streetGroups[street] || [];
      clientsToNotify = [...clientsToNotify, ...streetClients];
    });

    const confirmMessage = `Envoyer notifications "${bulkNotificationType}" à ${clientsToNotify.length} clients sur ${selectedStreets.length} rue${selectedStreets.length !== 1 ? 's' : ''} ?\n\nRues sélectionnées:\n${selectedStreets.join('\n')}`;

    if (window.confirm(confirmMessage)) {
      setIsSendingBulk(true);
      let successCount = 0;
      let failureCount = 0;

      for (const client of clientsToNotify) {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Pause 2 sec entre chaque
          await sendNotificationViaBackend(client.id, bulkNotificationType, bulkCustomMessage);
          successCount++;
        } catch (error) {
          console.error(`Erreur envoi à ${client.name}:`, error);
          failureCount++;
        }
      }

      setIsSendingBulk(false);
      alert(`📱 Envoi terminé!\n\nSuccès: ${successCount}\nÉchecs: ${failureCount}`);
      setSelectedStreets([]);
    }
  }}
  disabled={isSendingBulk || selectedStreets.length === 0}
  style={{
    padding: '10px 20px',
    background: isSendingBulk || selectedStreets.length === 0 ? '#6c757d' : '#28a745',
    color: 'white', border: 'none', borderRadius: '8px',
    cursor: isSendingBulk || selectedStreets.length === 0 ? 'not-allowed' : 'pointer',
    fontWeight: 'bold'
  }}
>
  {isSendingBulk ? '⏳ Envoi...' : `📤 Envoyer à ${selectedStreets.length} rue${selectedStreets.length !== 1 ? 's' : ''}`}
</button>   
          

                <button
                  onClick={() => setSelectedStreets([])}
                  style={{
                    padding: '10px 20px', background: '#6c757d', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer'
                  }}
                >
                  🗑️ Effacer sélection
                </button>
              </div>
            </div>

            {/* Statistiques des notifications */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px'
            }}>
              <h4 style={{ color: '#1a4d1a', marginBottom: '15px' }}>📊 Statistiques</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#155724' }}>
                    {(() => {
                      const clientsWithContracts = clients.filter(client => {
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        return contract;
                      });
                      return clientsWithContracts.length;
                    })()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#155724' }}>Clients Actifs</div>
                </div>
                
                <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1976d2' }}>
                    {(() => {
                      const clientsWithContracts = clients.filter(client => {
                        const contract = contracts.find(c => c.clientId === client.id && !c.archived);
                        return contract;
                      });
                      const streetGroups = groupClientsByStreet(clientsWithContracts);
                      return Object.keys(streetGroups).length;
                    })()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1976d2' }}>Rues Différentes</div>
                </div>
                
                <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#856404' }}>
                    {selectedStreets.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#856404' }}>Rues Sélectionnées</div>
                </div>
              </div>
            </div>

            {/* Historique des notifications (simulé) */}
            <div style={{
              background: '#f8f9fa', padding: '20px', borderRadius: '12px'
            }}>
              <h4 style={{ color: '#1a4d1a', marginBottom: '15px' }}>📜 Historique des Notifications</h4>
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                L'historique des notifications sera disponible une fois le backend intégré.
                <br />
                <small>Les notifications envoyées et leur statut apparaîtront ici.</small>
              </div>
            </div>
          </div>
        )}
{/* Modal de paiement */}
{paymentModal.isOpen && (
  <div 
    style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      background: 'rgba(0,0,0,0.5)', 
      zIndex: 1000,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '20px'
    }}
  >
    <div 
      style={{
        background: 'white', 
        borderRadius: '12px', 
        padding: '25px',
        width: '100%', 
        maxWidth: '450px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header */}
      <h3 style={{ 
        color: '#1a4d1a', 
        marginBottom: '20px', 
        fontSize: '1.3em',
        textAlign: 'center',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '15px'
      }}>
        💰 Enregistrer le paiement
      </h3>
      
      {/* Montant prévu */}
      <div style={{ 
        background: '#e7f3ff', 
        padding: '12px', 
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #b3d9ff'
      }}>
        <p style={{ margin: '0', fontSize: '14px', color: '#004085' }}>
          <strong>Montant prévu :</strong> {paymentModal.amount.toFixed(2)} $
        </p>
      </div>

      {/* 💰 CHAMP MONTANT MODIFIABLE */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold',
          color: '#495057',
          fontSize: '14px'
        }}>
          Montant réellement reçu *
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={paymentModal.customAmount !== undefined ? paymentModal.customAmount : paymentModal.amount}
          onChange={(e) => setPaymentModal({
            ...paymentModal, 
            customAmount: parseFloat(e.target.value) || 0
          })}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: '2px solid #ced4da',
            borderRadius: '8px',
            textAlign: 'center'
          }}
          onFocus={(e) => e.target.style.borderColor = '#1a4d1a'}
          onBlur={(e) => e.target.style.borderColor = '#ced4da'}
        />
        <small style={{ 
          display: 'block', 
          marginTop: '5px', 
          color: '#6c757d',
          fontSize: '12px'
        }}>
          Modifiez ce montant si le client a payé un montant différent
        </small>
      </div>

      {/* Alerte si montant différent */}
      {paymentModal.customAmount !== undefined && 
       Math.abs(paymentModal.customAmount - paymentModal.amount) > 0.01 && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: '0', fontSize: '13px', color: '#856404' }}>
            ⚠️ <strong>Montant modifié :</strong> Différence de {
              (paymentModal.customAmount - paymentModal.amount).toFixed(2)
            } $ par rapport au montant prévu
          </p>
        </div>
      )}

      {/* Question méthode de paiement */}
      <p style={{ 
        color: '#666', 
        marginBottom: '20px', 
        fontSize: '14px',
        textAlign: 'center'
      }}>
        Comment le paiement a-t-il été reçu ?
      </p>

      {/* Boutons méthode */}
      <div style={{ 
        display: 'grid', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <button
          onClick={() => handlePaymentMethodSelect('cheque')}
          style={{
            padding: '15px 20px',
            border: '2px solid #007bff',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#007bff',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#007bff';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#007bff';
          }}
        >
          📄 Chèque
        </button>
        
        <button
          onClick={() => handlePaymentMethodSelect('comptant')}
          style={{
            padding: '15px 20px',
            border: '2px solid #28a745',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#28a745',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#28a745';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#28a745';
          }}
        >
          💰 Argent Comptant
        </button>
      </div>

      {/* Bouton annuler */}
      <button
        onClick={() => setPaymentModal({ 
          isOpen: false, 
          clientId: null, 
          paymentNumber: null, 
          amount: 0, 
          customAmount: undefined 
        })}
        style={{
          width: '100%',
          padding: '12px',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => e.target.style.background = '#5a6268'}
        onMouseLeave={(e) => e.target.style.background = '#6c757d'}
      >
        ❌ Annuler
      </button>
    </div>
  </div>
)}


     

{/* Modal d'édition client */}
{editingClient && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  }}>
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      padding: '30px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '15px'
      }}>
        <h3 style={{ 
          color: '#1a4d1a', 
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          ✏️ Modifier le client
        </h3>
        <button
          onClick={() => {
            setEditingClient(null);
            setEditClientForm({
              name: '', phone: '', phone2: '', email: '', type: '', address: '',
              paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
              firstPaymentMethod: '', secondPaymentMethod: '',
              thirdPaymentDate: '', thirdPaymentMethod: '',
              fourthPaymentDate: '', fourthPaymentMethod: ''
            });
          }}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '0',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          ×
        </button>
      </div>

      {/* Formulaire en grille */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '25px'
      }}>
        
        {/* Nom du client */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Nom du client *
          </label>
          <input
            type="text" 
            value={editClientForm.name}
            onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a4d1a'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        </div>

        {/* Téléphone */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Téléphone *
          </label>
          <input
            type="tel" 
            value={editClientForm.phone}
            onChange={(e) => setEditClientForm({ ...editClientForm, phone: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a4d1a'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        </div>

        {/* Téléphone 2 */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Téléphone 2 (optionnel)
          </label>
          <input
            type="tel" 
            value={editClientForm.phone2 || ''}
            onChange={(e) => setEditClientForm({ ...editClientForm, phone2: e.target.value })}
            placeholder="Numéro secondaire"
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a4d1a'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Email
          </label>
          <input
            type="email" 
            value={editClientForm.email || ''}
            onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a4d1a'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        </div>

        {/* Adresse */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Adresse *
          </label>
          <input
            type="text" 
            value={editClientForm.address}
            onChange={(e) => setEditClientForm({ ...editClientForm, address: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1a4d1a'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        </div>

        {/* Structure de paiement */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Structure de paiement
          </label>
          <select
            value={editClientForm.paymentStructure || '2'}
            onChange={(e) => setEditClientForm({ ...editClientForm, paymentStructure: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
          >
            <option value="1">1 versement unique</option>
            <option value="2">2 versements</option>
            <option value="3">3 versements</option>
            <option value="4">4 versements</option>
          </select>
        </div>

        {/* Date 1er paiement */}
        {/* Date 1er paiement */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Date 1er paiement
          </label>
          <input
            type="date"
            value={editClientForm.firstPaymentDate || ''}
            onChange={(e) => setEditClientForm({ ...editClientForm, firstPaymentDate: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Méthode 1er paiement */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Méthode 1er paiement
          </label>
          <select
            value={editClientForm.firstPaymentMethod || ''}
            onChange={(e) => setEditClientForm({ ...editClientForm, firstPaymentMethod: e.target.value })}
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
          >
            <option value="">Sélectionner...</option>
            <option value="cheque">Chèque</option>
            <option value="comptant">Comptant</option>
          </select>
        </div>
            {/* 2e paiement - Affiché si 2, 3 ou 4 versements */}
      {(editClientForm.paymentStructure === '2' || editClientForm.paymentStructure === '3' || editClientForm.paymentStructure === '4') && (
        <>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date 2e paiement
            </label>
            <input
              type="date"
              value={editClientForm.secondPaymentDate || ''}
              onChange={(e) => setEditClientForm({ ...editClientForm, secondPaymentDate: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Méthode 2e paiement
            </label>
            <select
              value={editClientForm.secondPaymentMethod || ''}
              onChange={(e) => setEditClientForm({ ...editClientForm, secondPaymentMethod: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">Sélectionner...</option>
              <option value="cheque">Chèque</option>
              <option value="comptant">Comptant</option>
            </select>
          </div>
        </>
      )}

      {/* 3e paiement - Affiché si 3 ou 4 versements */}
      {(editClientForm.paymentStructure === '3' || editClientForm.paymentStructure === '4') && (
        <>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date 3e paiement (optionnel)
            </label>
            <input
              type="date"
              value={editClientForm.thirdPaymentDate || ''}
              onChange={(e) => setEditClientForm({ ...editClientForm, thirdPaymentDate: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Méthode 3e paiement
            </label>
            <select
              value={editClientForm.thirdPaymentMethod || ''}
              onChange={(e) => setEditClientForm({ ...editClientForm, thirdPaymentMethod: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">Sélectionner...</option>
              <option value="cheque">Chèque</option>
              <option value="comptant">Comptant</option>
            </select>
          </div>
        </>
      )}

      {/* 4e paiement - Affiché si 4 versements */}
      {editClientForm.paymentStructure === '4' && (
        <>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Date 4e paiement (optionnel)
            </label>
            <input
              type="date"
              value={editClientForm.fourthPaymentDate || ''}
              onChange={(e) => setEditClientForm({ ...editClientForm, fourthPaymentDate: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Méthode 4e paiement
            </label>
            <select
              value={editClientForm.fourthPaymentMethod || ''}
              onChange={(e) => setEditClientForm({ ...editClientForm, fourthPaymentMethod: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">Sélectionner...</option>
              <option value="cheque">Chèque</option>
              <option value="comptant">Comptant</option>
            </select>
          </div>
        </>
      )}

    </div>

    {/* Boutons d'action */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'flex-end',
        borderTop: '1px solid #e9ecef',
        paddingTop: '20px',
        marginTop: '10px'
      }}>
        <button
          onClick={() => {
            setEditingClient(null);
            setEditClientForm({
              name: '', phone: '', phone2: '', email: '', type: '', address: '',
              paymentStructure: '2', firstPaymentDate: '', secondPaymentDate: '',
              firstPaymentMethod: '', secondPaymentMethod: '',
              thirdPaymentDate: '', thirdPaymentMethod: '',
              fourthPaymentDate: '', fourthPaymentMethod: ''
            });
          }}
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#5a6268'}
          onMouseLeave={(e) => e.target.style.background = '#6c757d'}
        >
          ❌ Annuler
        </button>
        <button
          onClick={saveEditClient}
          style={{
            padding: '12px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#218838'}
          onMouseLeave={(e) => e.target.style.background = '#28a745'}
        >
          💾 Sauvegarder
        </button>
      </div>
    </div>
  </div>
)}
{/* Modal d'édition contrat */}
      {editingContract && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '25px',
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ color: '#1a4d1a', marginBottom: '20px' }}>Modifier le contrat</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type de contrat</label>
                <select
                  value={editContractForm.type}
                  onChange={(e) => setEditContractForm({ ...editContractForm, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="">Sélectionner...</option>
                  <option value="saisonnier">Saisonnier</option>
                  <option value="par-service">Par service</option>
                  <option value="mensuel">Mensuel</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Statut</label>
                <select
                  value={editContractForm.status}
                  onChange={(e) => setEditContractForm({ ...editContractForm, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                >
                  <option value="actif">Actif</option>
                  <option value="suspendu">Suspendu</option>
                  <option value="terminé">Terminé</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de début</label>
                <input
                  type="date" value={editContractForm.startDate}
                  onChange={(e) => setEditContractForm({ ...editContractForm, startDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de fin</label>
                <input
                  type="date" value={editContractForm.endDate}
                  onChange={(e) => setEditContractForm({ ...editContractForm, endDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Montant ($)</label>
              <input
                type="number" min="0" step="0.01" value={editContractForm.amount}
                onChange={(e) => setEditContractForm({ ...editContractForm, amount: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes spéciales</label>
              <textarea
                rows="3" value={editContractForm.notes}
                onChange={(e) => setEditContractForm({ ...editContractForm, notes: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={cancelEditContract} style={{
                padding: '10px 20px', background: '#6c757d', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}>
                Annuler
              </button>
              <button onClick={saveEditContract} style={{
                padding: '10px 20px', background: '#28a745', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
 );
  }
  export default App;
