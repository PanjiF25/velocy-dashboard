import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';

export const subscribeToStations = (callback: (stations: any[]) => void) => {
  const q = collection(db, 'stations');
  return onSnapshot(q, (snapshot) => {
    const stations: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      stations.push({
        id: doc.id,
        name: data.name || '',
        address: data.address || '',
        lat: data.lat || 0,
        lng: data.lng || 0,
      });
    });
    callback(stations);
  });
};

export const subscribeToAllDocks = (callback: (docks: any[]) => void) => {
  const q = collection(db, 'docks');
  return onSnapshot(q, (snapshot) => {
    const docks: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      docks.push({
        id: doc.id,
        stationId: data.stationId,
        number: data.dockCode || '',
        status: data.status || 'available',
        qr: data.qrValue || '',
        relayPin: data.relayPin || 0,
        sensorPin: data.sensorPin || 0,
        isActive: data.isActive !== false,
      });
    });
    callback(docks);
  });
};

export const addStation = async (station: any) => {
  await addDoc(collection(db, 'stations'), {
    name: station.name,
    address: station.address,
    lat: station.lat,
    lng: station.lng,
  });
};

export const updateStation = async (id: string, station: any) => {
  const ref = doc(db, 'stations', id);
  await updateDoc(ref, {
    name: station.name,
    address: station.address,
    lat: station.lat,
    lng: station.lng,
  });
};

export const deleteStation = async (id: string) => {
  // Delete the station
  await deleteDoc(doc(db, 'stations', id));
  
  // Also delete all docks associated with this station
  const q = query(collection(db, 'docks'), where('stationId', '==', id));
  const snap = await getDocs(q);
  snap.forEach(async (d) => {
    await deleteDoc(doc(db, 'docks', d.id));
  });
};

export const addDock = async (stationId: string, stationName: string, number: string, relayPin: number, sensorPin: number) => {
  // Try to generate a standard QR format for the mobile app to parse
  const qrData = {
    stationName: stationName,
    dockCode: number
  };
  const qrString = JSON.stringify(qrData);

  await addDoc(collection(db, 'docks'), {
    stationId: stationId,
    dockCode: number,
    status: 'available',
    qrValue: qrString,
    order: parseInt(number.replace(/\D/g, '')) || 0,
    currentBikeCode: null,
    relayPin: relayPin,
    sensorPin: sensorPin,
    isActive: true,
  });
};

export const updateDock = async (id: string, data: any) => {
  const ref = doc(db, 'docks', id);
  const updateData: any = {};
  if (data.number !== undefined) updateData.dockCode = data.number;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.relayPin !== undefined) updateData.relayPin = data.relayPin;
  if (data.sensorPin !== undefined) updateData.sensorPin = data.sensorPin;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  await updateDoc(ref, updateData);
};

export const deleteDock = async (id: string) => {
  await deleteDoc(doc(db, 'docks', id));
};

// ================= BIKES =================
export const subscribeToBikes = (callback: (bikes: any[]) => void) => {
  const q = collection(db, 'bikes');
  return onSnapshot(q, (snapshot) => {
    const bikes: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      bikes.push({
        id: doc.id,
        code: doc.id,
        status: data.status || 'available',
        currentDockId: data.currentDockId || null,
        currentStationId: data.currentStationId || null,
        location: data.location || 'Unknown',
        trackable: data.trackable || false,
        officerName: data.officerName || null,
      });
    });
    callback(bikes);
  });
};

export const addBike = async (bikeId: string, currentDockId: string | null = null, location: string = 'Unknown') => {
  // Use bikeId as the document ID
  const ref = doc(db, 'bikes', bikeId);
  await updateDoc(ref, {
    status: currentDockId ? 'available' : 'maintenance', // default logic
    currentDockId: currentDockId,
    location: location,
    trackable: true,
  }).catch(async (e) => {
    // If not exists, create
    const { setDoc } = await import('firebase/firestore');
    await setDoc(ref, {
      status: currentDockId ? 'available' : 'maintenance',
      currentDockId: currentDockId,
      location: location,
      trackable: true,
    });
  });
};

export const updateBike = async (id: string, data: any) => {
  const ref = doc(db, 'bikes', id);
  await updateDoc(ref, data);
};

export const deleteBike = async (id: string) => {
  await deleteDoc(doc(db, 'bikes', id));
};

// ================= TRIPS (RENTALS) =================
export const subscribeToTrips = (callback: (trips: any[]) => void) => {
  const q = query(collection(db, 'trips'), orderBy('startedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const trips: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      trips.push({
        id: doc.id,
        ...data,
      });
    });
    callback(trips);
  });
};

export const updateTrip = async (id: string, data: any) => {
  const ref = doc(db, 'trips', id);
  await updateDoc(ref, data);
};

// ================= TASKS =================
export const subscribeToTasks = (callback: (tasks: any[]) => void, onAdded?: (task: any) => void) => {
  const q = collection(db, 'tasks');
  let isInitialLoad = true;
  return onSnapshot(q, (snapshot) => {
    const tasks: any[] = [];
    
    if (!isInitialLoad && onAdded) {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          onAdded({ id: change.doc.id, ...change.doc.data() });
        }
      });
    }
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data,
      });
    });
    
    isInitialLoad = false;
    // Sort locally descending
    tasks.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
    callback(tasks);
  });
};

export const addTask = async (data: any) => {
  const { serverTimestamp } = await import('firebase/firestore');
  await addDoc(collection(db, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateTask = async (id: string, data: any) => {
  const ref = doc(db, 'tasks', id);
  await updateDoc(ref, data);
};

export const deleteTask = async (id: string) => {
  await deleteDoc(doc(db, 'tasks', id));
};

export const deleteUserAccount = async (id: string, role: string) => {
  let success = false;
  try {
    await deleteDoc(doc(db, 'officers', id));
    success = true;
  } catch (e) { console.error("Error deleting from officers:", e); }
  
  try {
    await deleteDoc(doc(db, 'users', id));
    success = true;
  } catch (e) { 
    console.error("Error deleting from users:", e); 
    if (!success) throw e; // throw only if both failed
  }
};

export const subscribeToUsers = (callback: (users: any[]) => void) => {
  const q = collection(db, 'users');
  return onSnapshot(q, (snapshot) => {
    const users: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id === 'un7g0ODRA0XSSLG3eCPJNjbdKvJ3') {
        if (!data.email) data.email = 'akun@gmail.com';
        if (!data.displayName && !data.name) data.displayName = 'Akun Petugas';
      }
      users.push({ id: doc.id, ...data });
    });
    console.log("Firestore fetched users successfully");
    callback(users);
  }, (error) => {
    console.error("Firestore error fetching users:", error);
  });
};

export const subscribeToOfficers = (callback: (officers: any[]) => void) => {
  const q = collection(db, 'officers');
  return onSnapshot(q, (snapshot) => {
    const officers: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id === 'un7g0ODRA0XSSLG3eCPJNjbdKvJ3') {
        if (!data.email) data.email = 'akun@gmail.com';
        if (!data.displayName && !data.name) data.displayName = 'Akun Petugas';
      }
      officers.push({ id: doc.id, ...data });
    });
    // Sort officers by last message if it exists
    officers.sort((a, b) => {
      const aTime = a.lastMessageAt?.toMillis() || 0;
      const bTime = b.lastMessageAt?.toMillis() || 0;
      return bTime - aTime;
    });
    callback(officers);
  });
};

// ================= SUPPORT CHATS =================
export const subscribeToOfficerChats = (officerId: string, callback: (chats: any[]) => void) => {
  const q = query(
    collection(db, 'support_chats'),
    where('officerId', '==', officerId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const chats: any[] = [];
    snapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort locally to avoid composite index requirement
    chats.sort((a, b) => {
      const now = Date.now();
      const aTime = a.timestamp?.toMillis() || now;
      const bTime = b.timestamp?.toMillis() || now;
      return aTime - bTime; // ascending
    });
    
    callback(chats);
  });
};

export const sendAdminMessage = async (officerId: string, message: string) => {
  const { serverTimestamp, setDoc } = await import('firebase/firestore');
  await addDoc(collection(db, 'support_chats'), {
    officerId: officerId,
    senderId: 'admin',
    senderRole: 'admin',
    message: message,
    timestamp: serverTimestamp(),
  });
  
  // Clear unread flag for admin since we just replied, but set unread for officer
  const officerRef = doc(db, 'officers', officerId);
  await setDoc(officerRef, {
    hasUnreadAdmin: false,
    hasUnreadOfficer: true,
    lastMessage: `Admin: ${message}`,
    lastMessageAt: serverTimestamp(),
  }, { merge: true });
};

export const markChatAsRead = async (officerId: string) => {
  const { setDoc } = await import('firebase/firestore');
  const officerRef = doc(db, 'officers', officerId);
  await setDoc(officerRef, {
    hasUnreadAdmin: false,
  }, { merge: true });
};

// ================= SHIFTS & REQUESTS =================

export const subscribeToShiftRequests = (callback: (requests: any[]) => void) => {
  const q = query(collection(db, 'shift_requests'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const requests: any[] = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    callback(requests);
  });
};

export const getAllOfficersShifts = async (officers: any[]) => {
  const allShifts: any[] = [];
  
  for (const officer of officers) {
    if (!officer.id) continue;
    const q = query(
      collection(db, 'officers', officer.id, 'shifts'),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    snap.forEach((doc) => {
      allShifts.push({
        id: doc.id,
        officerId: officer.id,
        ...doc.data(),
        officerName: officer.displayName || officer.name || officer.email || officer.id || 'Unknown'
      });
    });
  }
  
  return allShifts;
};

export const approveShiftSwap = async (requestId: string, officerId: string, shiftId: string, requestedShift: string) => {
  await updateDoc(doc(db, 'shift_requests', requestId), {
    status: 'approved',
    updatedAt: new Date()
  });
  
  await updateDoc(doc(db, 'officers', officerId, 'shifts', shiftId), {
    shiftName: requestedShift,
    swapStatus: 'approved'
  });
};

export const rejectShiftSwap = async (requestId: string, officerId: string, shiftId: string) => {
  await updateDoc(doc(db, 'shift_requests', requestId), {
    status: 'rejected',
    updatedAt: new Date()
  });
  
  await updateDoc(doc(db, 'officers', officerId, 'shifts', shiftId), {
    swapStatus: 'rejected'
  });
};
