import { useEffect, useMemo, useState, useRef, type MouseEvent } from "react";
import QRCode from "qrcode";
import Swal from "sweetalert2";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, secondaryAuth, db } from "./firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { initMqttSync, setSyncEnabled, disconnectMqttSync, publishOpenCommand, connectMqtt } from './services/mqttSyncService';
import { 
  subscribeToStations, subscribeToAllDocks, addStation, updateStation, deleteStation as firestoreDeleteStation, addDock, updateDock, deleteDock as firestoreDeleteDock,
  subscribeToBikes, addBike as firestoreAddBike, updateBike as firestoreUpdateBike, deleteBike as firestoreDeleteBike,
  subscribeToTrips, updateTrip, subscribeToTasks, addTask as firestoreAddTask, updateTask as firestoreUpdateTask, deleteTask as firestoreDeleteTask, subscribeToOfficers,
  subscribeToUsers,
  subscribeToOfficerChats,
  sendAdminMessage,
  markChatAsRead,
  subscribeToShiftRequests, getAllOfficersShifts, approveShiftSwap, rejectShiftSwap,
  deleteUserAccount
} from './services/firestoreService';


type Lang = "id" | "en";

type Copy = {
  adminSubtext: string;
  dashboard: string;
  stations: string;
  rentals: string;
  bikes: string;
  tasks: string;
  shifts: string;
  accounts: string;
  logout: string;
  adminRole: string;
  bikesSubtitle: string;
  addBike: string;
  bikeCode: string;
  bikeStatus: string;
  bikeLocation: string;
  bikeBorrower: string;
  bikeDuration: string;
  bikeAction: string;
  bikeShowAll: string;
  bikeInUse: string;
  bikeRepair: string;
  bikeAvailable: string;
  bikeRepairLabel: string;
  bikeTrackedLabel: string;
  bikeModalClose: string;
  bikeModalTrack: string;
  bikeModalMaintenance: string;
  bikeModalLastUpdated: string;
  bikeModalRenter: string;
  bikeModalStartStation: string;
  bikeModalDuration: string;
  bikeModalGpsPoints: string;
  bikeModalCurrentPosition: string;
  bikeModalDistance: string;
  pageTasks: string;
  tasksTitle: string;
  tasksSubtitle: string;
  taskType: string;
  taskDescription: string;
  taskStartStation: string;
  taskTargetStation: string;
  taskUnitCount: string;
  taskStatus: string;
  taskCreatedAt: string;
  taskRedistribution: string;
  taskRepair: string;
  taskReport: string;
  taskInProgress: string;
  taskWaiting: string;
  taskDone: string;
  taskCancelled: string;
  paginationInfoTasks: string;
  previous: string;
  next: string;
  stationsSubtitle: string;
  addStation: string;
  colAddress: string;
  colCoords: string;
  colTotal: string;
  colAvailable: string;
  colOccupied: string;
  colOccupancy: string;
  colActions: string;
  btnAddStation: string;
  formAddStationTitle: string;
  formEditStationTitle: string;
  formStationName: string;
  formAddress: string;
  formLatitude: string;
  formLongitude: string;
  formTotalDocks: string;
  formCoordHint: string;
  stationAdded: string;
  stationUpdated: string;
  stationDeleted: string;
  confirmDeleteStation: string;
  btnAddDock: string;
  dockDetail: string;
  dockNumber: string;
  dockStatus: string;
  dockQr: string;
  formAddDockTitle: string;
  formEditDockTitle: string;
  formDockNumber: string;
  dockAdded: string;
  dockUpdated: string;
  dockDeleted: string;
  confirmDeleteDock: string;
  qrModalTitle: string;
  btnDownloadQr: string;
  statusAvailable: string;
  statusOccupied: string;
  statusBroken: string;
  btnViewQr: string;
  yesDelete: string;
  cancel: string;
  save: string;
  close: string;
  totalDocks: string;
  available: string;
  inUse: string;
  repair: string;
  activeRentals: string;
  todayRentals: string;
  mapTitle: string;
  showStations: string;
  showActiveBikes: string;
  alertText: string;
  alertAction: string;
  tableTitle: string;
  stationName: string;
  address: string;
  actions: string;
  availableCol: string;
  occupiedCol: string;
  occupancyCol: string;
  viewDocks: string;
  dockTitle: string;
  dockClose: string;
  dockAvailable: string;
  dockOccupied: string;
  dockBroken: string;
  rentalsSubtitle: string;
  exportCsv: string;
  filterAll: string;
  filterActive: string;
  filterDone: string;
  filterCancelled: string;
  searchRentals: string;
  showingRentals: string;
  rentalUser: string;
  rentalBike: string;
  rentalStartStation: string;
  rentalEndStation: string;
  rentalStartTime: string;
  rentalDuration: string;
  rentalStatus: string;
  totalToday: string;
  avgDuration: string;
  completedRentals: string;
  activeBadge: string;
  finishedBadge: string;
  cancelledBadge: string;
  col_user: string;
  col_bike: string;
  col_start: string;
  col_end: string;
  col_started: string;
  col_ended: string;
  col_duration: string;
  col_status: string;
  btn_export: string;
  filter_all: string;
  filter_active: string;
  filter_completed: string;
  filter_cancelled: string;
  tab_all: string;
  tab_inuse: string;
  tab_maintenance: string;
  btn_track: string;
  col_location: string;
  col_renter: string;
  status_active: string;
  status_completed: string;
  status_cancelled: string;
  status_available: string;
  status_inuse: string;
  status_maintenance: string;
  active_trip: string;
  renter: string;
  start_station: string;
  duration: string;
  last_update: string;
  mark_maintenance: string;
  auto_refresh: string;
  maintenance_toast: string;
  minutes_suffix: string;
  on_trip: string;
  support: string;
};

type StatCard = {
  label: keyof Pick<
    Copy,
    "available" | "inUse" | "repair" | "activeRentals" | "todayRentals"
  >;
  value: string;
  icon: string;
  tone: "success" | "blue" | "danger";
  spark?: boolean;
};

type StationRow = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  totalDocks: number;
  available: number;
  occupied: number;
  occupancy: number;
  tone: "success" | "warning" | "danger";
};

type StationDock = {
  id: string;
  stationId: string;
  number: string;
  status: "available" | "occupied" | "broken";
  qr: string;
  relayPin?: number;
  sensorPin?: number;
  isActive: boolean;
};

type RentalRow = {
  id?: string;
  initials: string;
  initialsTone: "blue" | "green" | "neutral" | "rose";
  user: string;
  email: string;
  bike: string;
  startStation: string;
  endStation: string;
  startDate: string;
  startTime: string;
  duration: string;
  status: "active" | "done" | "cancelled";
};

type BikeRow = {
  id?: string;
  code: string;
  status: "available" | "active" | "repair";
  location: string;
  borrower: string;
  duration: string;
  trackable: boolean;
  currentStationId?: string | null;
  currentDockId?: string | null;
  officerName?: string | null;
};

type BikeTrackPoint = {
  lat: string;
  lng: string;
};

type TaskRow = {
  kind: "redistribusi" | "perbaikan" | "laporan";
  description: string;
  startStation: string;
  targetStation: string;
  unitCount: number;
  status: "dikerjakan" | "menunggu" | "selesai" | "dibatalkan";
  createdAt: string;
};

const copy: Record<Lang, Copy> = {
  id: {
    adminSubtext: "Admin Fleet Management",
    dashboard: "Dasbor",
    stations: "Stasiun",
    rentals: "Riwayat Sewa",
    bikes: "Manajemen Sepeda",
    tasks: "Tugas Operator",
    support: "Bantuan",
    shifts: "Jadwal Shift",
    accounts: "Manajemen Akun",
    logout: "Keluar",
    adminRole: "Fleet Lead",
    bikesSubtitle: "Overview armada sepeda aktif",
    addBike: "Tambah Sepeda",
    bikeCode: "Kode Sepeda",
    bikeStatus: "Status",
    bikeLocation: "Lokasi",
    bikeBorrower: "Peminjam",
    bikeDuration: "Durasi",
    bikeAction: "Aksi",
    bikeShowAll: "Semua",
    bikeInUse: "Sedang Dipakai",
    bikeRepair: "Perbaikan",
    bikeAvailable: "Tersedia",
    bikeRepairLabel: "Perbaikan",
    bikeTrackedLabel: "Sedang Dipakai",
    bikeModalClose: "Close",
    bikeModalTrack: "Lacak",
    bikeModalMaintenance: "Mark as maintenance",
    bikeModalLastUpdated: "Last updated",
    bikeModalRenter: "Renter",
    bikeModalStartStation: "Start Station",
    bikeModalDuration: "Duration",
    bikeModalGpsPoints: "GPS Points",
    bikeModalCurrentPosition: "Current Position",
    bikeModalDistance: "Est. Distance",
    pageTasks: "Tugas Operator",
    tasksTitle: "Daftar Tugas Operasional",
    tasksSubtitle:
      "Pantau dan kelola aktivitas petugas lapangan untuk redistribusi dan perbaikan unit.",
    taskType: "Jenis Tugas",
    taskDescription: "Deskripsi",
    taskStartStation: "Stasiun Asal",
    taskTargetStation: "Stasiun Tujuan",
    taskUnitCount: "Jumlah Unit",
    taskStatus: "Status",
    taskCreatedAt: "Dibuat Pada",
    taskRedistribution: "Redistribusi",
    taskRepair: "Perbaikan",
    taskReport: "Laporan",
    taskInProgress: "Sedang Dikerjakan",
    taskWaiting: "Menunggu",
    taskDone: "Selesai",
    taskCancelled: "Dibatalkan",
    paginationInfoTasks: "Menampilkan 1 hingga 5 dari 24 data",
    previous: "Sebelumnya",
    next: "Selanjutnya",
    stationsSubtitle: "Kelola daftar stasiun peminjaman sepeda",
    addStation: "Tambah Stasiun",
    colAddress: "Alamat",
    colCoords: "Koordinat",
    colTotal: "Total Dok",
    colAvailable: "Tersedia",
    colOccupied: "Terisi",
    colOccupancy: "Hunian %",
    colActions: "Aksi",
    btnAddStation: "Tambah Stasiun",
    formAddStationTitle: "Tambah Stasiun Baru",
    formEditStationTitle: "Edit Stasiun",
    formStationName: "Nama Stasiun",
    formAddress: "Alamat",
    formLatitude: "Latitude",
    formLongitude: "Longitude",
    formTotalDocks: "Jumlah Dok Awal",
    formCoordHint: "Klik peta untuk isi koordinat otomatis, atau ketik manual.",
    stationAdded: "Stasiun berhasil ditambahkan.",
    stationUpdated: "Stasiun berhasil diperbarui.",
    stationDeleted: "Stasiun berhasil dihapus.",
    confirmDeleteStation:
      "Yakin hapus stasiun ini? Semua dok juga akan dihapus.",
    btnAddDock: "Tambah Dok",
    dockDetail: "Manajemen Dok",
    dockNumber: "Nomor Dok",
    dockStatus: "Status",
    dockQr: "Kode QR",
    formAddDockTitle: "Tambah Dok Baru",
    formEditDockTitle: "Edit Dok",
    formDockNumber: "Nomor Dok (contoh: A1, B3)",
    dockAdded: "Dok ditambahkan. QR otomatis digenerate.",
    dockUpdated: "Dok berhasil diperbarui.",
    dockDeleted: "Dok berhasil dihapus.",
    confirmDeleteDock: "Yakin hapus dok ini?",
    qrModalTitle: "QR Code Dok",
    btnDownloadQr: "Unduh QR",
    statusAvailable: "Tersedia",
    statusOccupied: "Terisi",
    statusBroken: "Rusak",
    btnViewQr: "Lihat QR",
    yesDelete: "Ya, hapus",
    cancel: "Batal",
    save: "Simpan",
    close: "Tutup",
    totalDocks: "Total Dok",
    available: "Sepeda Tersedia",
    inUse: "Sedang Dipakai",
    repair: "Dalam Perbaikan",
    activeRentals: "Sewa Aktif",
    todayRentals: "Sewa Hari Ini",
    mapTitle: "Fleet Map",
    showStations: "Tampilkan Stasiun",
    showActiveBikes: "Tampilkan Sepeda Aktif",
    alertText: "2 tugas operator menunggu tindakan",
    alertAction: "Lihat Tugas",
    tableTitle: "Okupansi Stasiun",
    stationName: "Nama Stasiun",
    address: "Alamat",
    actions: "Aksi",
    availableCol: "Tersedia",
    occupiedCol: "Terisi",
    occupancyCol: "Okupansi (%)",
    viewDocks: "Lihat Dok",
    dockTitle: "Dok Stasiun",
    dockClose: "Tutup",
    dockAvailable: "Tersedia",
    dockOccupied: "Terisi",
    dockBroken: "Rusak",
    rentalsSubtitle:
      "Kelola dan pantau semua transaksi penyewaan sepeda Velocy.",
    exportCsv: "Ekspor CSV",
    filterAll: "Semua",
    filterActive: "Aktif",
    filterDone: "Selesai",
    filterCancelled: "Dibatalkan",
    searchRentals: "Cari pengguna atau ID sepeda...",
    showingRentals: "Menampilkan 1-5 dari 124 data",
    rentalUser: "Pengguna",
    rentalBike: "Sepeda",
    rentalStartStation: "Stasiun Awal",
    rentalEndStation: "Stasiun Akhir",
    rentalStartTime: "Waktu Mulai",
    rentalDuration: "Durasi",
    rentalStatus: "Status",
    totalToday: "Total Sewa Hari Ini",
    avgDuration: "Durasi Rata-rata",
    completedRentals: "Sewa Selesai",
    activeBadge: "Aktif",
    finishedBadge: "Selesai",
    cancelledBadge: "Dibatalkan",
    col_user: "Pengguna",
    col_bike: "Sepeda",
    col_start: "Stasiun Awal",
    col_end: "Stasiun Akhir",
    col_started: "Waktu Mulai",
    col_ended: "Waktu Selesai",
    col_duration: "Durasi",
    col_status: "Status",
    btn_export: "Ekspor CSV",
    filter_all: "Semua",
    filter_active: "Aktif",
    filter_completed: "Selesai",
    filter_cancelled: "Dibatalkan",
    tab_all: "Semua",
    tab_inuse: "Sedang Dipakai",
    tab_maintenance: "Perbaikan",
    btn_track: "Lacak",
    col_location: "Lokasi",
    col_renter: "Peminjam",
    status_active: "Aktif",
    status_completed: "Selesai",
    status_cancelled: "Dibatalkan",
    status_available: "Tersedia",
    status_inuse: "Sedang Dipakai",
    status_maintenance: "Perbaikan",
    active_trip: "Perjalanan aktif",
    renter: "Peminjam",
    start_station: "Stasiun awal",
    duration: "Durasi",
    last_update: "Diperbarui",
    mark_maintenance: "Tandai rusak",
    auto_refresh: "Refresh otomatis tiap 15 detik",
    maintenance_toast: "ditandai perlu perbaikan",
    minutes_suffix: "mnt",
    on_trip: "Sedang dalam perjalanan",
  },
  en: {
    adminSubtext: "Admin Fleet Management",
    dashboard: "Dashboard",
    stations: "Stations",
    rentals: "Rentals History",
    bikes: "Bike Management",
    tasks: "Operator Tasks",
    support: "Support",
    shifts: "Shift Schedule",
    accounts: "Account Management",
    logout: "Log Out",
    adminRole: "Fleet Lead",
    bikesSubtitle: "Overview of active bike fleet",
    addBike: "Add Bike",
    bikeCode: "Bike Code",
    bikeStatus: "Status",
    bikeLocation: "Location",
    bikeBorrower: "Borrower",
    bikeDuration: "Duration",
    bikeAction: "Action",
    bikeShowAll: "All",
    bikeInUse: "In Use",
    bikeRepair: "Repair",
    bikeAvailable: "Available",
    bikeRepairLabel: "Repair",
    bikeTrackedLabel: "In Use",
    bikeModalClose: "Close",
    bikeModalTrack: "Track",
    bikeModalMaintenance: "Mark as maintenance",
    bikeModalLastUpdated: "Last updated",
    bikeModalRenter: "Renter",
    bikeModalStartStation: "Start Station",
    bikeModalDuration: "Duration",
    bikeModalGpsPoints: "GPS Points",
    bikeModalCurrentPosition: "Current Position",
    bikeModalDistance: "Est. Distance",
    pageTasks: "Operator Tasks",
    tasksTitle: "Operational Task List",
    tasksSubtitle:
      "Monitor and manage field staff activities for redistribution and unit repairs.",
    taskType: "Task Type",
    taskDescription: "Description",
    taskStartStation: "Origin Station",
    taskTargetStation: "Target Station",
    taskUnitCount: "Unit Count",
    taskStatus: "Status",
    taskCreatedAt: "Created At",
    taskRedistribution: "Redistribution",
    taskRepair: "Repair",
    taskReport: "Report",
    taskInProgress: "In Progress",
    taskWaiting: "Waiting",
    taskDone: "Done",
    taskCancelled: "Cancelled",
    paginationInfoTasks: "Showing 1 to 5 of 24 records",
    previous: "Previous",
    next: "Next",
    stationsSubtitle: "Manage the list of bike sharing stations",
    addStation: "Add Station",
    colAddress: "Address",
    colCoords: "Coordinates",
    colTotal: "Total Docks",
    colAvailable: "Available",
    colOccupied: "Occupied",
    colOccupancy: "Occupancy %",
    colActions: "Actions",
    btnAddStation: "Add Station",
    formAddStationTitle: "Add New Station",
    formEditStationTitle: "Edit Station",
    formStationName: "Station Name",
    formAddress: "Address",
    formLatitude: "Latitude",
    formLongitude: "Longitude",
    formTotalDocks: "Initial Dock Count",
    formCoordHint: "Click the map to auto-fill coordinates, or type manually.",
    stationAdded: "Station added successfully.",
    stationUpdated: "Station updated successfully.",
    stationDeleted: "Station deleted successfully.",
    confirmDeleteStation:
      "Delete this station? All docks will also be deleted.",
    btnAddDock: "Add Dock",
    dockDetail: "Dock Management",
    dockNumber: "Dock No.",
    dockStatus: "Status",
    dockQr: "QR Code",
    formAddDockTitle: "Add New Dock",
    formEditDockTitle: "Edit Dock",
    formDockNumber: "Dock Number (e.g. A1, B3)",
    dockAdded: "Dock added. QR generated automatically.",
    dockUpdated: "Dock updated successfully.",
    dockDeleted: "Dock deleted successfully.",
    confirmDeleteDock: "Delete this dock?",
    qrModalTitle: "Dock QR Code",
    btnDownloadQr: "Download QR",
    statusAvailable: "Available",
    statusOccupied: "Occupied",
    statusBroken: "Broken",
    btnViewQr: "View QR",
    yesDelete: "Yes, delete",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    totalDocks: "Total Docks",
    available: "Available Bikes",
    inUse: "In Use",
    repair: "Under Repair",
    activeRentals: "Active Rentals",
    todayRentals: "Rentals Today",
    mapTitle: "Fleet Map",
    showStations: "Show Stations",
    showActiveBikes: "Show Active Bikes",
    alertText: "2 operator tasks pending action",
    alertAction: "View Tasks",
    tableTitle: "Station Occupancy",
    stationName: "Station Name",
    address: "Address",
    actions: "Actions",
    availableCol: "Available",
    occupiedCol: "Occupied",
    occupancyCol: "Occupancy (%)",
    viewDocks: "View Docks",
    dockTitle: "Station Docks",
    dockClose: "Close",
    dockAvailable: "Available",
    dockOccupied: "Occupied",
    dockBroken: "Broken",
    rentalsSubtitle: "Manage and monitor all Velocy bike rental transactions.",
    exportCsv: "Export CSV",
    filterAll: "All",
    filterActive: "Active",
    filterDone: "Done",
    filterCancelled: "Cancelled",
    searchRentals: "Search users or bike ID...",
    showingRentals: "Showing 1-5 of 124 data",
    rentalUser: "User",
    rentalBike: "Bike",
    rentalStartStation: "Start Station",
    rentalEndStation: "End Station",
    rentalStartTime: "Start Time",
    rentalDuration: "Duration",
    rentalStatus: "Status",
    totalToday: "Total Rentals Today",
    avgDuration: "Average Duration",
    completedRentals: "Completed Rentals",
    activeBadge: "Active",
    finishedBadge: "Done",
    cancelledBadge: "Cancelled",
    col_user: "User",
    col_bike: "Bike",
    col_start: "Start Station",
    col_end: "End Station",
    col_started: "Started At",
    col_ended: "Ended At",
    col_duration: "Duration",
    col_status: "Status",
    btn_export: "Export CSV",
    filter_all: "All",
    filter_active: "Active",
    filter_completed: "Completed",
    filter_cancelled: "Cancelled",
    tab_all: "All",
    tab_inuse: "In Use",
    tab_maintenance: "Maintenance",
    btn_track: "Track",
    col_location: "Location",
    col_renter: "Renter",
    status_active: "Active",
    status_completed: "Completed",
    status_cancelled: "Cancelled",
    status_available: "Available",
    status_inuse: "In Use",
    status_maintenance: "Maintenance",
    active_trip: "Active trip",
    renter: "Renter",
    start_station: "Start station",
    duration: "Duration",
    last_update: "Last updated",
    mark_maintenance: "Mark as maintenance",
    auto_refresh: "Auto-refresh every 15s",
    maintenance_toast: "marked as maintenance",
    minutes_suffix: "min",
    on_trip: "Currently on trip",
  },
};

const stats: StatCard[] = [
  {
    label: "available",
    value: "3",
    icon: "check_circle",
    tone: "success",
    spark: true,
  },
  { label: "inUse", value: "2", icon: "trending_up", tone: "blue" },
  { label: "repair", value: "1", icon: "build", tone: "danger" },
  { label: "activeRentals", value: "2", icon: "timer", tone: "blue" },
  { label: "todayRentals", value: "4", icon: "calendar_today", tone: "blue" },
];

const initialStations: StationRow[] = [
  {
    id: "1",
    name: "Gedung Rektorat",
    address: "Kawasan Kantor Pusat ITS",
    lat: -7.281824,
    lng: 112.795981,
    totalDocks: 15,
    available: 12,
    occupied: 3,
    occupancy: 20,
    tone: "success",
  },
  {
    id: "2",
    name: "Perpustakaan ITS",
    address: "Kawasan Kampus ITS Sukolilo",
    lat: -7.282991,
    lng: 112.797421,
    totalDocks: 15,
    available: 4,
    occupied: 11,
    occupancy: 73,
    tone: "warning",
  },
  {
    id: "3",
    name: "Gedung Departemen Elektro",
    address: "Jl. Teknik Elektro, ITS",
    lat: -7.284151,
    lng: 112.795001,
    totalDocks: 15,
    available: 1,
    occupied: 14,
    occupancy: 93,
    tone: "danger",
  },
  {
    id: "4",
    name: "Asrama Mahasiswa",
    address: "Sisi Timur Kampus ITS",
    lat: -7.286101,
    lng: 112.798221,
    totalDocks: 12,
    available: 10,
    occupied: 2,
    occupancy: 17,
    tone: "success",
  },
];

function buildDockSet(
  stationId: string,
  availableCount: number,
  occupiedCount: number,
  brokenCount = 0,
) {
  const docks: StationDock[] = [];
  let nextId = 1;

  const addDock = (status: StationDock["status"], prefix: string) => {
    const suffix = docks.length + 1;
    const number = `${prefix}${suffix}`;
    docks.push({
      id: String(nextId++),
      stationId,
      number,
      status,
      qr: `VELOCY-ST${stationId}-${number}`,
      isActive: true,
    });
  };

  for (let index = 0; index < availableCount; index += 1)
    addDock("available", "A");
  for (let index = 0; index < occupiedCount; index += 1)
    addDock("occupied", "B");
  for (let index = 0; index < brokenCount; index += 1) addDock("broken", "C");

  return docks;
}

const initialStationDocks: Record<number, StationDock[]> = {
  "1": buildDockSet("1", 12, 3, 0),
  "2": buildDockSet("2", 4, 11, 0),
  "3": buildDockSet("3", 1, 13, 1),
  "4": buildDockSet("4", 10, 2, 0),
};

const tripsState: RentalRow[] = [
  {
    initials: "AR",
    initialsTone: "blue",
    user: "Adit Raharjo",
    email: "adit.raharjo@email.com",
    bike: "VLC-082",
    startStation: "Stasiun Teknik Informatika",
    endStation: "- Perjalanan -",
    startDate: "14 Okt 2023",
    startTime: "08:15 WIB",
    duration: "24 m",
    status: "active",
  },
  {
    initials: "SN",
    initialsTone: "green",
    user: "Siti Nurhaliza",
    email: "siti.nur@email.com",
    bike: "VLC-145",
    startStation: "Stasiun Senayan",
    endStation: "Stasiun Kantin Pusat",
    startDate: "14 Okt 2023",
    startTime: "07:30 WIB",
    duration: "15 m",
    status: "done",
  },
  {
    initials: "BW",
    initialsTone: "neutral",
    user: "Bambang Wijaya",
    email: "b.wijaya@email.com",
    bike: "VLC-012",
    startStation: "Stasiun Rektorat",
    endStation: "Stasiun Rektorat",
    startDate: "13 Okt 2023",
    startTime: "18:45 WIB",
    duration: "2 m",
    status: "cancelled",
  },
  {
    initials: "DP",
    initialsTone: "rose",
    user: "Diana Putri",
    email: "diana.p@email.com",
    bike: "VLC-209",
    startStation: "Stasiun Pusat Robotika",
    endStation: "Stasiun Perpustakaan Pusat",
    startDate: "13 Okt 2023",
    startTime: "16:20 WIB",
    duration: "35 m",
    status: "done",
  },
  {
    initials: "FK",
    initialsTone: "blue",
    user: "Faisal Karim",
    email: "faisal.k@email.com",
    bike: "VLC-055",
    startStation: "Stasiun Rektorat",
    endStation: "- Perjalanan -",
    startDate: "13 Okt 2023",
    startTime: "12:10 WIB",
    duration: "12 m",
    status: "active",
  },
];

const bikeRows: BikeRow[] = [
  {
    code: "VLY-001",
    status: "available",
    location: "Stasiun Perpustakaan Pusat (A1)",
    borrower: "-",
    duration: "-",
    trackable: false,
  },
  {
    code: "VLY-002",
    status: "active",
    location: "Sedang dalam perjalanan",
    borrower: "Rafi Aulia",
    duration: "14:07",
    trackable: true,
  },
  {
    code: "VLY-003",
    status: "active",
    location: "Sedang dalam perjalanan",
    borrower: "Dinda Pratiwi",
    duration: "05:12",
    trackable: true,
  },
  {
    code: "VLY-004",
    status: "available",
    location: "Stasiun Rektorat (B2)",
    borrower: "-",
    duration: "-",
    trackable: false,
  },
  {
    code: "VLY-005",
    status: "repair",
    location: "-",
    borrower: "-",
    duration: "-",
    trackable: false,
  },
  {
    code: "VLY-006",
    status: "available",
    location: "Stasiun Teknik Informatika (A3)",
    borrower: "-",
    duration: "-",
    trackable: false,
  },
];

const bikeTrackRoute: BikeTrackPoint[] = [
  { lat: "-7.2798", lng: "112.7930" },
  { lat: "-7.2799", lng: "112.7935" },
  { lat: "-7.2800", lng: "112.7940" },
  { lat: "-7.2801", lng: "112.7945" },
  { lat: "-7.280120", lng: "112.795000" },
];

const tasksState: TaskRow[] = [
  {
    kind: "redistribusi",
    description: "Pindah unit untuk rush hour pagi",
    startStation: "Stasiun Teknik Informatika",
    targetStation: "Stasiun Pusat Robotika",
    unitCount: 15,
    status: "dikerjakan",
    createdAt: "12 Okt 2023, 05:30",
  },
  {
    kind: "perbaikan",
    description: "Ganti kampas rem sepeda V-042",
    startStation: "Stasiun Perpustakaan Pusat",
    targetStation: "N/A (Di Tempat)",
    unitCount: 1,
    status: "menunggu",
    createdAt: "12 Okt 2023, 08:15",
  },
  {
    kind: "redistribusi",
    description: "Penarikan unit berlebih malam hari",
    startStation: "Stasiun Kantin Pusat",
    targetStation: "Stasiun Rektorat",
    unitCount: 8,
    status: "selesai",
    createdAt: "11 Okt 2023, 22:00",
  },
  {
    kind: "laporan",
    description: "Cek laporan vandalisme stasiun",
    startStation: "Stasiun Teknik Informatika",
    targetStation: "N/A",
    unitCount: 0,
    status: "dibatalkan",
    createdAt: "11 Okt 2023, 14:20",
  },
  {
    kind: "perbaikan",
    description: "Tambal ban belakang V-112",
    startStation: "Stasiun Rektorat",
    targetStation: "N/A (Di Tempat)",
    unitCount: 1,
    status: "selesai",
    createdAt: "10 Okt 2023, 09:00",
  },
];

const navItems = [
  { icon: "dashboard", key: "dashboard" },
  { icon: "location_on", key: "stations" },
  { icon: "history", key: "rentals" },
  { icon: "pedal_bike", key: "bikes" },
  { icon: "engineering", key: "tasks" },
  { icon: "calendar_month", key: "shifts" },
  { icon: "manage_accounts", key: "accounts" },
  { icon: "support_agent", key: "support" },
] as const;

interface TrackMapProps {
  route: [number, number][];
  stations?: StationRow[];
}

function DashboardMap({ stations, bikes, showStations, showBikes }: { stations: StationRow[], bikes: BikeRow[], showStations: boolean, showBikes: boolean }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!L || typeof L.map !== "function") return;

    if (!mapRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: [-7.282, 112.795],
          zoom: 15,
          zoomControl: true,
          attributionControl: false,
        });
        mapRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        layerGroupRef.current = L.layerGroup().addTo(map);

        // Fix grey map issue due to container resize
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 500);
      } catch (e) {
        console.error("DashboardMap init error:", e);
      }
    }

    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (showStations) {
      stations.forEach((s) => {
        if (!s.lat || !s.lng) return;

        // Group available bikes for this station
        const stationBikes = bikes.filter(b => b.status === 'available' && b.currentStationId === s.id);
        
        let popupContent = `<b>${s.name}</b>`;
        if (stationBikes.length > 0) {
          popupContent += `<br/><br/><b>🚲 Sepeda Tersedia (${stationBikes.length}):</b><br/>`;
          popupContent += stationBikes.map(b => `- Sepeda ${b.code}`).join('<br/>');
        } else {
          popupContent += `<br/><br/><i>Tidak ada sepeda tersedia</i>`;
        }

        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="width: 14px; height: 14px; background-color: #10B981; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker([Number(s.lat), Number(s.lng)], { icon }).bindPopup(popupContent).addTo(layerGroup);
      });
    }

    if (showBikes) {
      bikes.forEach((b) => {
        // ONLY plot 'active' bikes separately
        if (b.status === 'active') {
          const codeSum = b.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const lat = -7.282 + (((codeSum % 100) / 100) - 0.5) * 0.01;
          const lng = 112.795 + ((((codeSum * 7) % 100) / 100) - 0.5) * 0.01;

          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="width: 12px; height: 12px; background-color: #1960a6; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([lat, lng], { icon }).bindPopup(`Sepeda ${b.code} (Sedang Dipakai)`).addTo(layerGroup);
        }
      });
    }
  }, [stations, bikes, showStations, showBikes]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (e) {}
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "350px", borderRadius: "12px", zIndex: 1 }} />;
}


function TasksMap({ officers }: { officers: any[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!L || typeof L.map !== "function") return;

    if (!mapRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: [-7.284, 112.796],
          zoom: 15,
          zoomControl: false,
        });
        mapRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        layerGroupRef.current = L.layerGroup().addTo(map);

        setTimeout(() => map.invalidateSize(), 100);
      } catch (e) {
        console.error("TasksMap init error:", e);
      }
    }

    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    officers.forEach(officer => {
      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      L.marker([officer.lat || 0, officer.lng || 0], { icon: customIcon })
        .bindPopup(`<strong>${officer.name || "Petugas"}</strong><br/>Status: ${officer.status || "Online"}<br/>ID: ${officer.id}`)
        .addTo(layerGroup);
    });
  }, [officers]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (e) {}
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "350px", borderRadius: "12px", zIndex: 1 }} />;
}

function TrackMap({ route, stations = [] }: TrackMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const startIcon = useMemo(() => {
    return L ? L.divIcon({
      className: "custom-div-icon",
      html: `<div style="width: 12px; height: 12px; background-color: #10B981; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }) : null;
  }, []);

  const currentIcon = useMemo(() => {
    return L ? L.divIcon({
      className: "custom-div-icon",
      html: `<div style="width: 14px; height: 14px; background-color: #1960a6; border-radius: 50%; border: 2px solid white; animation: pulse-dot 2s infinite;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    }) : null;
  }, []);

  const stationIcon = useMemo(() => {
    return L ? L.divIcon({
      className: "custom-div-icon",
      html: `<div style="width: 12px; height: 12px; background-color: #94a3b8; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    }) : null;
  }, []);

  useEffect(() => {
    try {
      if (!mapContainerRef.current || !L) return;

      const initialCenter = route.length > 0 ? route[route.length - 1] : [-7.282, 112.795];
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: initialCenter as L.LatLngExpression,
        zoom: 15,
      });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      if (stationIcon) {
        stations.forEach((st) => {
          if (st.lat && st.lng) {
            L.marker([parseFloat(st.lat), parseFloat(st.lng)], { icon: stationIcon })
              .addTo(map)
              .bindPopup(`<div style="font-size: 11px; font-weight: 500;">${st.name}</div>`);
          }
        });
      }

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 400);
    } catch (e: any) {
      console.error("Leaflet initialization failed:", e);
      setMapError(e.message || "Failed to initialize Leaflet Map");
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error("Failed to remove map instance:", e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      const map = mapRef.current;
      if (!map || route.length === 0 || !startIcon || !currentIcon) return;

      if (!polylineRef.current) {
        startMarkerRef.current = L.marker(route[0], { icon: startIcon }).addTo(map);
        polylineRef.current = L.polyline(route, { color: "#1960a6", weight: 3, dashArray: "6,4", opacity: 0.8 }).addTo(map);
        currentMarkerRef.current = L.marker(route[route.length - 1], { icon: currentIcon }).addTo(map);
        map.fitBounds(polylineRef.current.getBounds(), { padding: [30, 30] });
      } else {
        polylineRef.current.setLatLngs(route);
        const lastPoint = route[route.length - 1];
        if (currentMarkerRef.current) {
          currentMarkerRef.current.setLatLng(lastPoint);
        }
        map.panTo(lastPoint, { animate: true, duration: 1 });
      }
    } catch (e) {
      console.error("Leaflet dynamic update failed:", e);
    }
  }, [route, startIcon, currentIcon]);

  if (mapError) {
    return (
      <div style={{ padding: 20, color: "red", fontSize: 13, background: "#fff0f0", height: "100%", overflow: "auto" }}>
        <strong>Map Error:</strong>
        <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{mapError}</pre>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="leaflet-map-container" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}


interface StationFormMapProps {
  lat: string;
  lng: string;
  onMapClick: (lat: string, lng: string) => void;
}

function StationFormMap({ lat, lng, onMapClick }: StationFormMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default ITS campus coordinate if empty
    const initLat = lat ? parseFloat(lat) : -7.282;
    const initLng = lng ? parseFloat(lng) : 112.795;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initLat, initLng], 15);
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="color: #dc2626;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (lat && lng) {
      markerRef.current = L.marker([initLat, initLng], { icon: pinIcon }).addTo(map);
    }

    map.on('click', (e) => {
      onMapClick(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker when lat/lng change from outside
  useEffect(() => {
    if (mapRef.current && lat && lng) {
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      if (!isNaN(numLat) && !isNaN(numLng)) {
        if (!markerRef.current) {
          const pinIcon = L.divIcon({
            className: "custom-div-icon",
            html: `<div style="color: #dc2626;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });
          markerRef.current = L.marker([numLat, numLng], { icon: pinIcon }).addTo(mapRef.current);
        } else {
          markerRef.current.setLatLng([numLat, numLng]);
        }
        mapRef.current.setView([numLat, numLng]);
      }
    }
  }, [lat, lng]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "250px" }} />;
}

function CustomSelect({ value, onChange, options, placeholder }: {
  value: string,
  onChange: (val: string) => void,
  options: {value: string, label: string}[],
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="custom-select-wrapper" ref={selectRef}>
      <div 
        className={`form-control custom-select-control ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? '' : 'placeholder-text'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`material-symbols-outlined select-icon ${isOpen ? 'rotated' : ''}`}>
          expand_more
        </span>
      </div>
      <div className={`custom-select-dropdown ${isOpen ? 'open' : ''}`}>
        <div 
          className={`custom-select-option ${value === "" ? 'selected' : ''}`}
          onClick={() => { onChange(""); setIsOpen(false); }}
        >
          {placeholder}
        </div>
        {options.map(opt => (
          <div
            key={opt.value}
            className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
            onClick={() => { onChange(opt.value); setIsOpen(false); }}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Email atau kata sandi salah.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)' }}>
      <div className="modal-card" style={{ width: '400px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--primary)', color: 'white', borderRadius: '12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>pedal_bike</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-dark)', margin: 0 }}>Velocy Admin</h2>
        </div>
        
        {error && <div style={{ padding: '12px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@velocy.com"
              required
            />
          </div>
          <div>
            <label className="form-label">Kata Sandi</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center' }} disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}


function AccountsView({ users, officers, onToast }: { users: any[], officers: any[], onToast: (msg: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'officer'>('officer');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create user using secondary app so we don't logout current admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = userCredential.user.uid;
      
      // Save metadata to Firestore using primary app (which is authenticated as admin)
      if (role === 'admin') {
        await setDoc(doc(db, 'users', uid), {
          displayName: name,
          email: email,
          role: 'admin',
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, 'officers', uid), {
          name: name,
          email: email,
          isActive: true,
          status: 'offline',
          createdAt: serverTimestamp()
        });
      }
      
      setName('');
      setEmail('');
      setPassword('');
      onToast(`Akun ${name} berhasil dibuat sebagai ${role === 'admin' ? 'Admin' : 'Petugas'}`);
    } catch (err: any) {
      console.error(err);
      onToast(`Gagal membuat akun: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Combine users and officers for list and remove duplicates (if a user exists in both collections)
  const accountMap = new Map<string, any>();

  // Tambahkan users biasa (termasuk admin)
  users.forEach(u => {
    const role = (u.role === 'admin' || u.email === 'admin@velocy.com') ? 'admin' : 'user';
    accountMap.set(u.id, { id: u.id, name: u.displayName || u.email, email: u.email, role: role });
  });

  // Tambahkan/timpa dengan officers
  officers.forEach(o => {
    const existing = accountMap.get(o.id);
    // Jika sudah ada dan dia admin, jangan diturunkan ke officer. Tapi kalau user, naikkan jadi officer.
    if (!existing || existing.role !== 'admin') {
      accountMap.set(o.id, { 
        id: o.id, 
        name: o.name || existing?.name || o.email, 
        email: o.email || existing?.email, 
        role: 'officer' 
      });
    }
  });

  const allAccounts = Array.from(accountMap.values());

  return (
    <div className="content">
      <section className="stations-hero">
        <div>
          <h1>Manajemen Akun</h1>
          <p>Daftarkan akun Admin atau Petugas baru untuk mendapatkan akses ke aplikasi.</p>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '24px' }}>
        {/* Formulir Pendaftaran */}
        <section className="panel" style={{ alignSelf: 'start' }}>
          <div className="panel-header">
            <h3>Daftar Akun Baru</h3>
          </div>
          <form onSubmit={handleRegister} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Nama Lengkap</label>
              <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="Mis: Budi Santoso" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Alamat Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required placeholder="budi@velocy.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Kata Sandi</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimal 6 karakter" minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Peran (Role)</label>
              <select className="form-control" value={role} onChange={e => setRole(e.target.value as any)}>
                <option value="officer">Petugas (Aplikasi Mobile)</option>
                <option value="admin">Admin (Dashboard Web)</option>
              </select>
            </div>
            <button type="submit" className="primary-action" disabled={loading} style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
              {loading ? "Memproses..." : "Buat Akun"}
            </button>
          </form>
        </section>

        {/* Daftar Akun */}
        <section className="panel table-panel">
          <div className="panel-header table-header">
            <h3>Daftar Pengguna Terdaftar</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Peran</th>
                  <th>ID Unik</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {allAccounts.map(acc => (
                  <tr key={acc.id}>
                    <td style={{ fontWeight: 600 }}>{acc.name}</td>
                    <td>{acc.email}</td>
                    <td>
                      <span className="status-badge" style={
                        acc.role === 'admin' ? { backgroundColor: '#e0e7ff', color: '#4f46e5' } :
                        acc.role === 'user' ? { backgroundColor: '#f3f4f6', color: '#4b5563' } :
                        { backgroundColor: '#ecfdf5', color: '#10b981' }
                      }>
                        {acc.role === 'admin' ? 'Admin' : acc.role === 'user' ? 'Pengguna' : 'Petugas'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{acc.id}</td>
                    <td>
                      <button 
                        className="action-btn-delete" 
                        title="Hapus Akun"
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                        onClick={async () => {
                          const res = await Swal.fire({
                            title: `Hapus akun ${acc.name}?`,
                            text: 'Akun akan dihapus permanen dari sistem.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#ef4444',
                            cancelButtonColor: '#6b7280',
                            confirmButtonText: 'Ya, hapus!',
                            cancelButtonText: 'Batal'
                          });
                          if (res.isConfirmed) {
                            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
                            try {
                              await deleteUserAccount(acc.id, acc.role);
                              Swal.fire('Berhasil!', `Akun ${acc.name} dihapus.`, 'success');
                            } catch (e) {
                              Swal.fire('Gagal!', 'Tidak dapat menghapus akun.', 'error');
                            }
                          }
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function SupportChatView({ officerId }: { officerId: string }) {
  const [chats, setChats] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToOfficerChats(officerId, (data) => setChats(data));
    return () => unsub();
  }, [officerId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {chats.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            Belum ada riwayat pesan.
          </div>
        ) : (
          chats.map(chat => {
            const isAdmin = chat.senderRole === 'admin';
            return (
              <div key={chat.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', marginBottom: '16px', width: '100%' }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: isAdmin ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  background: isAdmin ? 'var(--primary)' : 'var(--surface)',
                  color: isAdmin ? 'white' : 'var(--text-main)',
                  border: isAdmin ? 'none' : '1px solid var(--border)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', lineHeight: 1.5 }}>{chat.message}</p>
                  <small style={{ fontSize: '11px', color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', display: 'block', textAlign: isAdmin ? 'right' : 'left' }}>
                    {chat.timestamp ? new Date(chat.timestamp.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </small>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!msg.trim()) return;
          const text = msg;
          setMsg('');
          await sendAdminMessage(officerId, text);
        }} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text" 
            value={msg} 
            onChange={(e) => setMsg(e.target.value)} 
            placeholder="Ketik pesan untuk petugas..." 
            style={{ 
              flex: 1, 
              padding: '14px 20px', 
              borderRadius: '24px', 
              border: '1px solid var(--border)', 
              background: 'var(--bg)', 
              color: 'var(--text-main)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button type="submit" disabled={!msg.trim()} className="primary-action" style={{ borderRadius: '24px', padding: '0 24px', height: '48px', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setIsAuthLoading(false);
    });
    return unsub;
  }, []);



  const [lang, setLang] = useState<Lang>("id");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("velocy-theme");
    return (saved as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("velocy-theme", theme);
  }, [theme]);

  const [activePage, setActivePage] = useState<
    "dashboard" | "stations" | "rentals" | "bikes" | "tasks" | "shifts" | "accounts" | "support"
  >("dashboard");
  const [showStationsOnDashboard, setShowStationsOnDashboard] = useState(true);
  const [showActiveBikesOnDashboard, setShowActiveBikesOnDashboard] =
    useState(true);
  const [dashboardToast, setDashboardToast] = useState<string | null>(null);
  const [stationRows, setStationRows] = useState<StationRow[]>([]);
  const [stationDocks, setStationDocks] =
    useState<Record<string, StationDock[]>>({});

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  // MQTT Auto-Sync Effect
  useEffect(() => {
    if (isSyncing) {
      initMqttSync(Object.values(stationDocks).flat(), stationRows, (msg: string) => {
        setSyncLogs(prev => [...prev, '[' + new Date().toLocaleTimeString() + '] ' + msg]);
      });
      setSyncEnabled(true, Object.values(stationDocks).flat(), stationRows);
    } else {
      setSyncEnabled(false, Object.values(stationDocks).flat(), stationRows);
    }
  }, [isSyncing, stationDocks, stationRows]);

  // Clean up on unmount
  useEffect(() => {
    return () => disconnectMqttSync();
  }, []);



  const [stationModal, setStationModal] = useState<{
    mode: "add" | "edit";
    stationId: string | null;
  } | null>(null);
  const [stationForm, setStationForm] = useState({
    name: "",
    address: "",
    lat: "",
    lng: "",
    totalDocks: "0",
  });

  // Firebase Data Subscriptions


  useEffect(() => {
    if (!adminUser) return;

    const unsubStations = subscribeToStations((stations) => {
      setStationRows(stations);
    });
    
    const unsubDocks = subscribeToAllDocks((docks) => {
      const grouped: Record<string, StationDock[]> = {};
      docks.forEach(d => {
        if (!grouped[d.stationId]) grouped[d.stationId] = [];
        grouped[d.stationId].push(d);
      });
      setStationDocks(grouped);
    });

    const unsubBikes = subscribeToBikes((bikesData) => {
      setRawBikes(bikesData);
    });

    const unsubTrips = subscribeToTrips((tripsData) => {
      setRawTrips(tripsData);
    });

    const unsubUsers = subscribeToUsers((usersData) => {
      console.log("Fetched users length:", usersData.length);
      console.log("Fetched users:", usersData);
      setUsersState(usersData);
    });

    const unsubOfficers = subscribeToOfficers((officersData) => {
      setOfficersState(officersData);
    });
    const unsubTasks = subscribeToTasks((tasksData) => {
      const mapped = tasksData.map((t: any) => {
        let createdAt = '-';
        if (t.createdAt) {
          createdAt = t.createdAt.toDate().toLocaleString('id-ID');
        }
        return {
          id: t.id,
          title: t.title || '-',
          location: t.location || '-',
          priority: t.priority || 'low',
          status: t.status || 'pending',
          assignedTo: t.assignedTo || null,
          createdAt: createdAt
        };
      });
      setTasksState(mapped);
    }, (newTask) => {
      // Notification will now be handled in the bell dropdown
    });
    
    return () => {
      unsubStations();
      unsubDocks();
      unsubBikes();
      unsubTrips();
      unsubUsers();
      unsubTasks();
      unsubOfficers();
    };
  }, [adminUser]);

  const [dockStationId, setDockStationId] = useState<string | null>(null);
  const [activeChatOfficerId, setActiveChatOfficerId] = useState<string | null>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [dockModal, setDockModal] = useState<{
    stationId: string;
    dockId: string | null;
    mode: "add" | "edit";
  } | null>(null);
  const [dockForm, setDockForm] = useState({
    number: "",
    status: "available" as StationDock["status"],
    relayPin: 0,
    sensorPin: 0,
  });
  const [dockQrPreview, setDockQrPreview] = useState("");
    const [bikeModal, setBikeModal] = useState<{show: boolean}>({show: false});
  const [bikeForm, setBikeForm] = useState({ code: '', stationId: '', dockId: '', status: 'available' });
  const [qrModal, setQrModal] = useState<{
    stationId: string;
dockId: string;
  } | null>(null);
  const [forceEndModal, setForceEndModal] = useState<{tripId: string, bikeCode: string} | null>(null);
  const [forceEndForm, setForceEndForm] = useState({stationId: '', dockId: ''});
  const [selectedBike, setSelectedBike] = useState<BikeRow | null>(null);
  const t = copy[lang];

  const [tripsState, setTripsState] = useState<RentalRow[]>([]);

  const [rawTrips, setRawTrips] = useState<any[]>([]);
  const [rawBikes, setRawBikes] = useState<any[]>([]);
  const [usersState, setUsersState] = useState<any[]>([]);

  useEffect(() => {
    (window as any).velocyTrips = rawTrips;
  }, [rawTrips]);

  useEffect(() => {
    const mapped = rawBikes.map((b: any) => {
      const isTracker = b.status === 'in_use';
      let borrower = b.borrower || '-';
      let duration = b.duration || '-';
      
      if (isTracker) {
        // find active trip
        const trip = rawTrips.find(t => (t.bikeCode === b.code || t.bikeId === b.code) && t.status === 'active');
        if (trip) {
           const u = usersState.find(u => u.id === trip.userId);
           if (u) {
             borrower = u.displayName || u.email || 'Pengguna';
           }
           if (trip.startedAt) {
             const startMs = trip.startedAt.toMillis ? trip.startedAt.toMillis() : trip.startedAt;
             const diffSec = Math.floor((now - startMs) / 1000);
             const h = Math.floor(diffSec / 3600);
             const m = Math.floor((diffSec % 3600) / 60);
             const s = diffSec % 60;
             if (h > 0) duration = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
             else duration = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
           }
        }
      }

      let loc = b.location || 'Unknown';
      if (b.status === 'in_transit') {
        loc = b.officerName ? `Dibawa petugas ${b.officerName}` : 'Sedang dibawa petugas';
      } else if (!b.currentStationId && b.status !== 'in_use') {
        loc = 'Di Gudang';
      }

      return {
        code: b.code,
        status: b.status === 'in_use' ? 'active' : b.status === 'maintenance' ? 'repair' : 'available',
        location: loc,
        borrower: borrower,
        duration: duration,
        trackable: b.trackable ?? false,
        currentDockId: b.currentDockId || null,
        currentStationId: b.currentStationId || null,
        officerName: b.officerName || null
      };
    }) as BikeRow[];
    setBikesState(mapped);
  }, [rawBikes, rawTrips, usersState, now]);

  const [shiftRequestsState, setShiftRequestsState] = useState<any[]>([]);
  const [allShiftsState, setAllShiftsState] = useState<any[]>([]);
  const [isShiftsLoading, setIsShiftsLoading] = useState(false);
  
  // Calendar states
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    const mapped = rawTrips.map((t: any) => {
      let startDate = '-';
      let startTime = '-';
      if (t.startedAt) {
        const d = t.startedAt.toDate();
        startDate = d.toLocaleDateString('id-ID');
        startTime = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }

      let durStr = '-';
      if (t.startedAt && t.completedAt) {
        const diffMs = t.completedAt.toMillis() - t.startedAt.toMillis();
        const diffMins = Math.floor(diffMs / 60000);
        durStr = `${diffMins} mnt`;
      } else if (t.durationMinutes) {
        durStr = `${t.durationMinutes} mnt`;
      } else if (t.status === 'active' && t.startedAt) {
        const diffMs = now - t.startedAt.toMillis();
        const diffMins = Math.floor(diffMs / 60000);
        durStr = `${diffMins} mnt`;
      }

      const u = usersState.find(u => u.id === t.userId);
      const userName = u?.displayName || t.userId || 'Unknown';
      
      let initials = 'U';
      if (userName && typeof userName === 'string') initials = userName.substring(0, 2).toUpperCase();

      let status = 'active';
      if (t.status === 'completed') status = 'done';
      if (t.status === 'cancelled') status = 'cancelled';

      return {
        id: t.id,
        initials: initials,
        initialsTone: 'blue',
        user: userName,
        email: u?.email || '-',
        bike: t.bikeCode || '-',
        startStation: t.originStationName || '-',
        endStation: t.destinationStationName || t.actualReturnStationName || '-',
        startDate: startDate,
        startTime: startTime,
        duration: durStr,
        status: status
      };
    }) as RentalRow[];
    setTripsState(mapped);
  }, [rawTrips, usersState, now]);

  // Rentals state (React-driven)
  const [rentalsFilter, setRentalsFilter] = useState<
    "all" | "active" | "done" | "cancelled"
  >("all");
  const [rentalsPage, setRentalsPage] = useState(1);
    const [assignTaskModal, setAssignTaskModal] = useState<{show: boolean}>({show: false});
  const [taskForm, setTaskForm] = useState({ title: '', location: '', priority: 'low', assignedTo: '' });
  const [tasksState, setTasksState] = useState<any[]>([]);
  const [officersState, setOfficersState] = useState<any[]>([]);
  const RENTALS_PER_PAGE = 5;

  useEffect(() => {
    if (activePage === 'support' && activeChatOfficerId) {
      const activeOfficer = officersState.find(o => o.id === activeChatOfficerId);
      if (activeOfficer?.hasUnreadAdmin) {
        markChatAsRead(activeChatOfficerId);
      }
    }
  }, [activePage, activeChatOfficerId, officersState]);

  const todayStr = new Date().toLocaleDateString('id-ID');
  const rentalsToday = tripsState.filter(t => t.startDate === todayStr).length;
  const completedRentals = tripsState.filter(t => t.status === 'done').length;
  const validDurations = tripsState
    .filter(t => t.duration && t.duration !== '-' && t.duration.includes('mnt'))
    .map(t => parseInt(t.duration.replace(/\\D/g, '')))
    .filter(n => !isNaN(n));
  const avgDuration = validDurations.length > 0 
    ? (validDurations.reduce((a, b) => a + b, 0) / validDurations.length).toFixed(1) + ' m' 
    : '0 m';

  function exportRentalsCsv() {
    const filtered =
      rentalsFilter === "all"
        ? tripsState
        : tripsState.filter((r) =>
          rentalsFilter === "done"
            ? r.status === "done"
            : r.status === rentalsFilter,
        );
    const headers = [
      "ID",
      "Pengguna",
      "Email",
      "Sepeda",
      "Stasiun Awal",
      "Stasiun Akhir",
      "Waktu Mulai",
      "Waktu Selesai",
      "Durasi (menit)",
      "Status",
    ];
    const rows = filtered.map((r, idx) =>
      [
        idx + 1,
        r.user,
        r.email,
        r.bike,
        r.startStation,
        r.endStation || "-",
        `${r.startDate} ${r.startTime}`,
        r.status === "done" ? r.duration || "-" : "-",
        r.duration || "-",
        r.status,
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `velocy-sewa-${Date.now()}.csv`;
    a.click();
    setDashboardToast(
      lang === "id" ? "CSV berhasil diunduh." : "CSV downloaded.",
    );
  }

  // Bikes state (React-driven), use local state so we can update durations
  const [bikesState, setBikesState] = useState<BikeRow[]>([]);
  const [bikesTab, setBikesTab] = useState<"all" | "in_use" | "maintenance">(
    "all",
  );
  const bikeIntervalsRef = useRef<number[]>([]);

  useEffect(() => {
    // interval logic removed, we now use global `now` state
  }, [activePage, bikesTab]);

  function incrementDurationString(current: string) {
    // current like 'MM:SS' or 'HH:MM:SS'
    const parts = current.split(":").map((p) => Number(p));
    let secs = 0;
    if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) secs = parts[0] * 60 + parts[1];
    else secs = Number(current) || 0;
    secs++;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // Bike tracking modal state (React)
  const [trackBike, setTrackBike] = useState<BikeRow | null>(null);
  const [trackRouteState, setTrackRouteState] = useState<[number, number][]>(
    [],
  );
  const trackTimerRef = useRef<number | null>(null);
  const trackRefreshRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trackBike) return;
    const tTrip = window.velocyTrips?.find((t: any) => (t.bikeCode === trackBike.code || t.bikeId === trackBike.code) && t.status === "active");
    let initialRoute: [number, number][] = [];
    
    if (tTrip) {
      const startStation = stationRows.find(s => s.id === tTrip.originStationId || s.name === tTrip.originStationName);
      if (startStation && startStation.lat && startStation.lng) {
        initialRoute.push([parseFloat(startStation.lat), parseFloat(startStation.lng)]);
      }
      if (tTrip.currentLat && tTrip.currentLng) {
        initialRoute.push([tTrip.currentLat, tTrip.currentLng]);
      }
    } else {
      initialRoute = bikeTrackRoute.map(
        (p) => [parseFloat(p.lat), parseFloat(p.lng)] as [number, number],
      );
    }
    
    setTrackRouteState(initialRoute);
    // timer to increment displayed duration in bikesState
    trackTimerRef.current = window.setInterval(() => {
      setBikesState((prev) =>
        prev.map((p) =>
          p.code === trackBike.code
            ? { ...p, duration: incrementDurationString(p.duration || "00:00") }
            : p,
        ),
      );
    }, 1000) as unknown as number;
    // Sync real location from trips if available
    trackRefreshRef.current = window.setInterval(() => {
      setTrackRouteState((prev) => {
        // Find if we have a real trip with this bike
        const tTrip = window.velocyTrips?.find((t: any) => (t.bikeCode === trackBike.code || t.bikeId === trackBike.code) && t.status === "active");
        if (tTrip && tTrip.currentLat && tTrip.currentLng) {
          const newPt: [number, number] = [tTrip.currentLat, tTrip.currentLng];
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            if (last[0] === newPt[0] && last[1] === newPt[1]) return prev;
          }
          return [...prev, newPt];
        }

        // Fallback simulation
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const newPtFallback: [number, number] = [
          last[0] + (Math.random() - 0.5) * 0.0004,
          last[1] + (Math.random() - 0.5) * 0.0004,
        ];
        return [...prev, newPtFallback];
      });
    }, 5000) as unknown as number;

    return () => {
      if (trackTimerRef.current) clearInterval(trackTimerRef.current);
      if (trackRefreshRef.current) clearInterval(trackRefreshRef.current);
      trackTimerRef.current = null;
      trackRefreshRef.current = null;
    };
  }, [trackBike]);

  function closeTrackModal() {
    setTrackBike(null);
    setTrackRouteState([]);
  }

  function markBikeMaintenance(code: string) {
    setBikesState((prev) =>
      prev.map((b) => (b.code === code ? { ...b, status: "repair" } : b)),
    );
    setDashboardToast(
      lang === "id"
        ? `${code} ditandai untuk perbaikan`
        : `${code} marked for maintenance`,
    );
    closeTrackModal();
  }

  const stationViewRows = useMemo(
    () =>
      stationRows.map((station) => {
        const allDocks = stationDocks[station.id] ?? [];
        const docks = allDocks.filter((dock) => dock.isActive);
        const occupied = docks.filter(
          (dock) => dock.status === "occupied",
        ).length;
        const available = Math.max(docks.length - occupied, 0);
        const occupancy =
          docks.length > 0 ? Math.round((occupied / docks.length) * 100) : 0;
        const tone =
          occupancy >= 80 ? "danger" : occupancy >= 50 ? "warning" : "success";

        return {
          ...station,
          totalDocks: docks.length,
          available,
          occupied,
          occupancy,
          tone,
        };
      }),
    [stationRows, stationDocks],
  );

  useEffect(() => {
    if (!dashboardToast) {
      return;
    }

    const timer = window.setTimeout(() => setDashboardToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [dashboardToast]);

  useEffect(() => {
    const handler = (ev: any) => {
      const detail = ev?.detail;
      if (detail && detail.msg) setDashboardToast(detail.msg);
    };
    window.addEventListener("app-toast", handler as EventListener);

    if (activePage === "rentals") {
      setRentalsPage(1);
      setRentalsFilter("all");
    }

    if (activePage === "bikes") {
      setBikesTab("all");
    }

    return () =>
      window.removeEventListener("app-toast", handler as EventListener);
  }, [activePage]);

  useEffect(() => {
    let qrText = "";

    if (dockModal) {
      qrText = dockForm.number.trim()
        ? `VELOCY-ST${dockModal.stationId}-${dockForm.number.trim().toUpperCase()}`
        : "";
    } else if (qrModal) {
      const dock = (stationDocks[qrModal.stationId] ?? []).find(
        (item) => item.id === qrModal.dockId,
      );
      qrText = dock?.qr ?? "";
    }

    if (!qrText) {
      setDockQrPreview("");
      return;
    }
    QRCode.toDataURL(qrText, { width: 220, margin: 1 })
      .then((dataUrl) => setDockQrPreview(dataUrl))
      .catch(() => setDockQrPreview(""));
  }, [dockModal, dockForm.number, qrModal, stationDocks]);

  useEffect(() => {
    const unsub = subscribeToShiftRequests(setShiftRequestsState);
    return () => unsub();
  }, []);

  useEffect(() => {
    // Collect all officers from both collections to fetch their shifts
    const combinedOfficers = new Map<string, any>();
    
    usersState.forEach((u: any) => {
      if (u.role === 'officer') combinedOfficers.set(u.id, u);
    });
    officersState.forEach((o: any) => {
      combinedOfficers.set(o.id, o);
    });

    const officerUsers = Array.from(combinedOfficers.values());
    if (officerUsers.length > 0) {
      setIsShiftsLoading(true);
      getAllOfficersShifts(officerUsers).then(shifts => {
        setAllShiftsState(shifts);
        setIsShiftsLoading(false);
      });
    } else {
      setAllShiftsState([]);
    }
  }, [usersState, officersState]);

  function openStationModal(
    mode: "add" | "edit",
    stationId: string | null = null,
  ) {
    const station = stationId
      ? (stationRows.find((item) => item.id === stationId) ?? null)
      : null;

    setStationForm({
      name: station?.name ?? "",
      address: station?.address ?? "",
      lat: station ? String(station.lat) : "",
      lng: station ? String(station.lng) : "",
      totalDocks: station
        ? String((stationDocks[station.id] ?? []).length)
        : "0",
    });
    setStationModal({ mode, stationId });
  }

  function showDashboardToast(message: string) {
    setDashboardToast(message);
  }

  function handleNotificationClick() {
    showDashboardToast(
      lang === "id"
        ? "Belum ada notifikasi baru."
        : "No new notifications yet.",
    );
  }

  function handleViewTasksClick() {
    setActivePage("tasks");
  }

  function handleStationMapClick(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = Math.max(
      0,
      Math.min(bounds.width, event.clientX - bounds.left),
    );
    const offsetY = Math.max(
      0,
      Math.min(bounds.height, event.clientY - bounds.top),
    );

    const lat = -7.2885 + (offsetY / bounds.height) * 0.0105;
    const lng = 112.793 + (offsetX / bounds.width) * 0.0075;

    setStationForm((currentForm) => ({
      ...currentForm,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  }

  async function saveStation() {
    const name = stationForm.name.trim();
    const address = stationForm.address.trim();
    const lat = Number.parseFloat(stationForm.lat);
    const lng = Number.parseFloat(stationForm.lng);
    const targetStationId = stationModal?.stationId ?? null;

    if (!name || !address || Number.isNaN(lat) || Number.isNaN(lng)) {
      return;
    }

    if (stationModal?.mode === "add") {
      await addStation({ name, address, lat, lng });
      showDashboardToast(copy[lang].stationAdded);
    } else if (targetStationId) {
      await updateStation(targetStationId, { name, address, lat, lng });
      showDashboardToast(copy[lang].stationUpdated);
    }

    setStationModal(null);
  }

  async function deleteStation(stationId: string) {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: copy[lang].confirmDeleteStation,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#5d6b64',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;
    await firestoreDeleteStation(stationId);
    setStationModal(null);
  }

  function openDockModal(stationId: string) {
    setDockStationId(stationId);
  }

  const [bikeEditMode, setBikeEditMode] = useState<{ isEdit: boolean, oldDockId?: string }>({ isEdit: false });

  async function saveBike() {
    const code = bikeForm.code.trim();
    const stationId = bikeForm.stationId;
    const dockId = bikeForm.dockId;

    if (!code) {
      alert("Harap isi ID Sepeda");
      return;
    }

    try {
      const { doc, updateDoc, getDoc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');

      if (bikeEditMode.isEdit) {
        // Edit mode
        if (bikeEditMode.oldDockId && bikeEditMode.oldDockId !== dockId) {
          // Clear old dock
          const oldDockRef = doc(db, 'docks', bikeEditMode.oldDockId);
          await updateDoc(oldDockRef, {
            currentBikeCode: null,
            status: 'available'
          }).catch(e => console.warn('Old dock not found, ignoring.'));
        }
        // Update bike
        const bikeRef = doc(db, 'bikes', code);
        await updateDoc(bikeRef, {
          currentStationId: stationId || null,
          currentDockId: dockId || null,
          status: bikeForm.status
        });
        if (dockId) {
          const newDockRef = doc(db, 'docks', dockId);
          await updateDoc(newDockRef, {
            currentBikeCode: code,
            status: 'occupied'
          });
        }
        showDashboardToast("Sepeda berhasil diperbarui");
      } else {
        // Create mode
        await firestoreAddBike(code, dockId || null);
        if (dockId) {
          const ref = doc(db, 'docks', dockId);
          await updateDoc(ref, {
            currentBikeCode: code,
            status: 'occupied'
          });
        }
        showDashboardToast("Sepeda berhasil ditambahkan");
      }

      setBikeModal({show: false});
      setBikeForm({ code: '', stationId: '', dockId: '', status: 'available' });
      setBikeEditMode({ isEdit: false });
    } catch (e: any) {
      console.error(e);
      alert("Gagal menyimpan sepeda: " + e.message);
    }
  }

  async function handleDeleteBike(bikeId: string, currentDockId: string | null) {
    const result = await Swal.fire({
      title: `Hapus sepeda ${bikeId}?`,
      text: 'Data sepeda akan dihapus permanen dari sistem.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      
      if (currentDockId) {
        const dockRef = doc(db, 'docks', currentDockId);
        await updateDoc(dockRef, {
          currentBikeCode: null,
          status: 'available'
        }).catch(e => console.warn('Dock not found, ignoring.'));
      }
      
      await firestoreDeleteBike(bikeId);
      showDashboardToast("Sepeda berhasil dihapus");
    } catch (e: any) {
      console.error(e);
      alert("Gagal menghapus sepeda: " + e.message);
    }
  }

  function openDockEditModal(stationId: string, dockId: string | null) {
    const dock =
      dockId !== null
        ? ((stationDocks[stationId] ?? []).find((item) => item.id === dockId) ??
          null)
        : null;

    setDockForm({
      number: dock?.number ?? "",
      status: dock?.status ?? "available",
      relayPin: dock?.relayPin ?? 0,
      sensorPin: dock?.sensorPin ?? 0,
    });
    setDockModal({ stationId, dockId, mode: dockId === null ? "add" : "edit" });
  }

  async function saveDock() {
    const number = dockForm.number.trim().toUpperCase();
    const relayPin = parseInt(dockForm.relayPin as any) || 0;
    const sensorPin = parseInt(dockForm.sensorPin as any) || 0;
    if (!number || !dockModal) {
      return;
    }

    if (dockModal.mode === "add") {
      const station = stationRows.find(s => s.id === dockModal.stationId);
      await addDock(dockModal.stationId, station?.name || 'Unknown', number, relayPin, sensorPin);
      showDashboardToast(copy[lang].dockAdded);
    } else if (dockModal.dockId) {
      await updateDock(dockModal.dockId, { number, status: dockForm.status as any, relayPin, sensorPin });
      showDashboardToast(copy[lang].dockUpdated);
    }

    setDockModal(null);
  }

  async function deleteDock(stationId: string, dockId: string) {
    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: lang === "id" ? "Yakin hapus dok ini?" : "Delete this dock?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#5d6b64',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;
    // Actually delete from Firestore instead of just hiding it from local state
    await firestoreDeleteDock(dockId);
  }

  function openQrModal(stationId: string, dockId: string) {
    setQrModal({ stationId, dockId });
  }

  function downloadQr() {
    const dock = qrModal
      ? (stationDocks[qrModal.stationId] ?? []).find(
        (item) => item.id === qrModal.dockId,
      )
      : null;
    if (!dock || !dockQrPreview) {
      return;
    }

    const link = document.createElement("a");
    link.href = dockQrPreview;
    link.download = `${dock.number}.png`;
    link.click();
  }

  const mapMarkers = useMemo(
    () => [
      { top: "27%", left: "30%", tone: "marker-blue", label: "" },
      { top: "34%", left: "50%", tone: "marker-green", label: "12" },
      { top: "40%", left: "58%", tone: "marker-blue", label: "" },
      { top: "46%", left: "66%", tone: "marker-orange", label: "4" },
      { top: "56%", left: "48%", tone: "marker-red", label: "1" },
    ],
    [],
  );

  const bikeTrackMarkers = useMemo(
    () => [
      { left: "18%", top: "24%", rotation: "-24deg" },
      { left: "26%", top: "18%", rotation: "12deg" },
      { left: "32%", top: "42%", rotation: "8deg" },
      { left: "38%", top: "28%", rotation: "30deg" },
      { left: "45%", top: "20%", rotation: "-18deg" },
      { left: "50%", top: "36%", rotation: "6deg" },
      { left: "56%", top: "26%", rotation: "-12deg" },
      { left: "60%", top: "44%", rotation: "16deg" },
      { left: "67%", top: "32%", rotation: "-26deg" },
      { left: "72%", top: "52%", rotation: "18deg" },
      { left: "78%", top: "38%", rotation: "-8deg" },
    ],
    [],
  );

const dashboardStats = useMemo(() => {
    const available = bikesState.filter(b => b.status === 'available').length;
    const inUse = bikesState.filter(b => b.status === 'active').length;
    const repair = bikesState.filter(b => b.status === 'repair').length;
    const activeRentals = tripsState.filter(t => t.status === 'active').length;
    
    const todayStr = new Date().toLocaleDateString('id-ID');
    const todayRentals = tripsState.filter(t => t.startDate === todayStr).length;

    return [
      { label: "available", value: String(available), icon: "check_circle", tone: "success", spark: true },
      { label: "inUse", value: String(inUse), icon: "trending_up", tone: "blue" },
      { label: "repair", value: String(repair), icon: "build", tone: "danger" },
      { label: "activeRentals", value: String(activeRentals), icon: "timer", tone: "blue" },
      { label: "todayRentals", value: String(todayRentals), icon: "calendar_today", tone: "blue" },
    ] as StatCard[];
  }, [bikesState, tripsState]);

  if (isAuthLoading) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>Memuat sesi...</div>;
  if (!adminUser) return <AdminLogin />;

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const calendarDays: any[] = [];
    
    for (let i = 0; i < firstDayIndex; i++) {
      calendarDays.push(null);
    }
    
    for (let i = 1; i <= days; i++) {
      calendarDays.push(new Date(year, month, i));
    }
    
    const remaining = (7 - (calendarDays.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      calendarDays.push(null);
    }
    
    return calendarDays;
  };

  const getShiftsForDate = (date: Date) => {
    return allShiftsState.filter(s => {
      if (!s.date || !s.date.toDate) return false;
      const sDate = s.date.toDate();
      return sDate.getFullYear() === date.getFullYear() &&
             sDate.getMonth() === date.getMonth() &&
             sDate.getDate() === date.getDate();
    });
  };

  const nextMonth = () => {
    setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCalendarCurrentDate(new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth() - 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const calendarDays = getDaysInMonth(calendarCurrentDate);
  const selectedDateShifts = calendarSelectedDate ? getShiftsForDate(calendarSelectedDate) : [];
  // --- End Calendar Logic ---

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span className="material-symbols-outlined">pedal_bike</span>
          </div>
          <div>
            <h1>Velocy</h1>
            <p>{t.adminSubtext}</p>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const active = item.key === activePage;
            const unreadCount = item.key === 'support' 
              ? officersState.filter(o => o.hasUnreadAdmin).length 
              : 0;
            return (
              <a
                key={item.key}
                className={`nav-item${active ? " active" : ""}`}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (
                    item.key === "dashboard" ||
                    item.key === "stations" ||
                    item.key === "rentals" ||
                    item.key === "bikes" ||
                    item.key === "tasks" ||
                    item.key === "support" ||
                    item.key === "shifts" ||
                    item.key === "accounts"
                  ) {
                    setActivePage(item.key);
                  }
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{t[item.key]}</span>
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    minWidth: '20px',
                    height: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '999px',
                    background: active ? 'rgba(255,255,255,0.25)' : '#ef4444',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '0 6px',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <a
            className="nav-item logout"
            href="#"
            onClick={async (event) => {
              event.preventDefault();
              await signOut(auth);
            }}
          >
            <span className="material-symbols-outlined">logout</span>
            <span>{t.logout}</span>
          </a>
        </div>
      </aside>

      <div className="main-pane">
        <header className="topbar">
          <h2>
            {activePage === "dashboard"
              ? t.dashboard
              : activePage === "stations"
                ? t.stations
                : activePage === "rentals"
                  ? t.rentals
                  : activePage === "bikes"
                    ? t.bikes
                    : activePage === "support"
                      ? t.support
                      : activePage === "shifts"
                        ? t.shifts
                        : activePage === "accounts"
                          ? t.accounts
                          : t.pageTasks}
          </h2>
          <div className="topbar-actions">
            <div className="lang-toggle">
              <button className={`lang-btn${lang === "id" ? " active" : ""}`} onClick={() => setLang("id")}>ID</button>
              <button className={`lang-btn${lang === "en" ? " active" : ""}`} onClick={() => setLang("en")}>EN</button>
            </div>
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              title={theme === "light" ? "Beralih ke Dark Mode" : "Beralih ke Light Mode"}
            >
              <span className="material-symbols-outlined">
                {theme === "light" ? "dark_mode" : "light_mode"}
              </span>
            </button>
            <div style={{ position: 'relative' }}>
              <button className="icon-button" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <span className="material-symbols-outlined">notifications</span>
                {(officersState.filter(o => o.hasUnreadAdmin).length + tasksState.filter(t => t.status === 'pending').length) > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '999px',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 800,
                    border: '2px solid var(--bg)',
                  }}>
                    {officersState.filter(o => o.hasUnreadAdmin).length + tasksState.filter(t => t.status === 'pending').length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px',
                  width: '320px',
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  zIndex: 50
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Notifikasi</h3>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {(() => {
                      const chatNotifs = officersState.filter(o => o.hasUnreadAdmin).map(o => ({ type: 'chat', id: o.id, data: o }));
                      const taskNotifs = tasksState.filter(t => t.status === 'pending').map(t => ({ type: 'task', id: t.id, data: t }));
                      const allNotifs = [...taskNotifs, ...chatNotifs];

                      if (allNotifs.length === 0) {
                        return (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            Tidak ada notifikasi baru
                          </div>
                        );
                      }

                      return allNotifs.map(notif => {
                        if (notif.type === 'chat') {
                          const officer = notif.data;
                          const displayName = officer.name || usersState.find(u => u.id === officer.id)?.displayName || '';
                          const finalName = displayName.includes('@') ? displayName.split('@')[0] : displayName || `Petugas (${officer.id.substring(0, 5)})`;
                          
                          return (
                            <div 
                              key={`chat-${notif.id}`}
                              onClick={() => {
                                setActivePage('support');
                                setActiveChatOfficerId(officer.id);
                                setShowNotifDropdown(false);
                              }}
                              style={{ padding: '16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', gap: '12px', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', 
                                background: 'var(--primary-light)', color: 'var(--primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  Pesan dari <strong>{finalName}</strong>
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {officer.lastMessage}
                                </p>
                              </div>
                            </div>
                          );
                        } else {
                          const task = notif.data;
                          return (
                            <div 
                              key={`task-${notif.id}`}
                              onClick={() => {
                                setActivePage('tasks');
                                setShowNotifDropdown(false);
                              }}
                              style={{ padding: '16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', gap: '12px', transition: 'background 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', 
                                background: '#fef3c7', color: '#d97706',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>build</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  <strong>Tugas Baru</strong>
                                </p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {task.title}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
            <button className="icon-button">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="profile">
              <div className="profile-copy">
                <strong>Admin Velocy</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main>
          {activePage === "dashboard" ? (
            <div className="content">
              <>
                <section className="stats-grid" aria-label="Dashboard summary">
                  {dashboardStats.map((stat) => (
                    <article className="stat-card" key={stat.label}>
                      <div className="stat-head">
                        <span
                          className={`material-symbols-outlined tone-${stat.tone}`}
                        >
                          {stat.icon}
                        </span>
                        {stat.spark ? (
                          <div className="sparkline" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                          </div>
                        ) : null}
                      </div>
                      <div className={`stat-value tone-${stat.tone}`}>
                        {stat.value}
                      </div>
                      <div className="stat-label">{t[stat.label]}</div>
                    </article>
                  ))}
                </section>

                <section className="panel fleet-panel">
                  <div className="panel-header">
                    <h3>{t.mapTitle}</h3>
                    <div className="toggle-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={showStationsOnDashboard}
                          onChange={(event) =>
                            setShowStationsOnDashboard(event.target.checked)
                          }
                        />
                        <span>{t.showStations}</span>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={showActiveBikesOnDashboard}
                          onChange={(event) =>
                            setShowActiveBikesOnDashboard(event.target.checked)
                          }
                        />
                        <span>{t.showActiveBikes}</span>
                      </label>
                    </div>
                  </div>

                  <div className="map-stage" aria-label="Fleet map preview" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <DashboardMap stations={stationRows} bikes={bikesState} showStations={showStationsOnDashboard} showBikes={showActiveBikesOnDashboard} />
                    </div>

                    <div className="map-caption">
                      <span className="warning-icon">⚠</span>
                      <span>{t.alertText}</span>
                      <a
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handleViewTasksClick();
                        }}
                      >
                        {t.alertAction}
                        <span className="material-symbols-outlined">
                          chevron_right
                        </span>
                      </a>
                    </div>
                  </div>
                </section>

                <section className="panel table-panel">
                  <div className="panel-header table-header">
                    <h3>{t.tableTitle}</h3>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.stationName}</th>
                          <th className="center">{t.availableCol}</th>
                          <th className="center">{t.occupiedCol}</th>
                          <th>{t.occupancyCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stationViewRows.slice(0, 3).map((station) => (
                          <tr key={station.name}>
                            <td className="station-name">{station.name}</td>
                            <td className="center">{station.available}</td>
                            <td className="center">{station.occupied}</td>
                            <td>
                              <div className="progress-cell">
                                <div className="progress-track">
                                  <div
                                    className={`progress-fill ${station.tone}`}
                                    style={{ width: `${station.occupancy}%` }}
                                  />
                                </div>
                                <span>{station.occupancy}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            </div>
          ) : activePage === "stations" ? (
            <div className="content">
              <>
                <section className="stations-hero">
                  <div>
                    <h1>{t.stations}</h1>
                    <p>{t.stationsSubtitle}</p>
                  </div>
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => openStationModal("add")}
                  >
                    <span className="material-symbols-outlined">add</span>
                    <span>{t.btnAddStation}</span>
                  </button>
                </section>

                <section className="panel stations-table-panel">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.stationName}</th>
                          <th>{t.colAddress}</th>
                          <th>{t.colCoords}</th>
                          <th className="center">{t.colTotal}</th>
                          <th className="center">{t.colAvailable}</th>
                          <th className="center">{t.colOccupied}</th>
                          <th>{t.colOccupancy}</th>
                          <th className="actions-col">{t.colActions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stationViewRows.map((station) => (
                          <tr key={station.id}>
                            <td className="station-name">{station.name}</td>
                            <td className="station-address">{station.address}</td>
                            <td className="station-address station-coords">
                              {station.lat.toFixed(6)}, {station.lng.toFixed(6)}
                            </td>
                            <td className="center">{station.totalDocks}</td>
                            <td className="center available-cell">
                              {station.available}
                            </td>
                            <td className="center">{station.occupied}</td>
                            <td>
                              <div className="progress-cell">
                                <div className="progress-track">
                                  <div
                                    className={`progress-fill ${station.tone}`}
                                    style={{ width: `${station.occupancy}%` }}
                                  />
                                </div>
                                <span>{station.occupancy}%</span>
                              </div>
                            </td>
                            <td className="actions-col">
                              <div className="station-actions">
                                <button
                                  className="outline-action"
                                  type="button"
                                  onClick={() => openDockModal(station.id)}
                                >
                                  {t.viewDocks}
                                </button>
                                <button
                                  className="outline-action"
                                  type="button"
                                  onClick={() =>
                                    openStationModal("edit", station.id)
                                  }
                                >
                                  Edit
                                </button>
                                <button
                                  className="outline-action station-delete-action"
                                  type="button"
                                  onClick={() => deleteStation(station.id)}
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            </div>
          ) : activePage === "rentals" ? (
            <div className="content">
              <>
                {(() => {
                  const filtered =
                    rentalsFilter === "all"
                      ? tripsState
                      : tripsState.filter((r) =>
                        rentalsFilter === "done"
                          ? r.status === "done"
                          : r.status === rentalsFilter,
                      );
                  const totalPages = Math.max(
                    1,
                    Math.ceil(filtered.length / RENTALS_PER_PAGE),
                  );
                  const paginated = filtered.slice(
                    (rentalsPage - 1) * RENTALS_PER_PAGE,
                    rentalsPage * RENTALS_PER_PAGE,
                  );

                  return (
                    <>
                      {/* Header */}
                      <section className="rentals-hero">
                        <div>
                          <h1>{t.rentals}</h1>
                          <p>{t.rentalsSubtitle}</p>
                        </div>
                        <button className="export-action" onClick={exportRentalsCsv}>
                          <span className="material-symbols-outlined">download</span>
                          {t.exportCsv}
                        </button>
                      </section>

                      {/* Summary Bento Grid */}
                      <div className="rentals-summary-grid">
                        <div className="summary-card summary-card-primary">
                          <p>{t.totalToday}</p>
                          <div className="summary-row">
                            <strong>{rentalsToday.toLocaleString()}</strong>
                            <span className="summary-chip">
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>
                              0%
                            </span>
                          </div>
                        </div>
                        <div className="summary-card">
                          <p>{t.avgDuration}</p>
                          <div className="summary-row">
                            <strong>{avgDuration}</strong>
                            <span className="material-symbols-outlined summary-icon">timer</span>
                          </div>
                        </div>
                        <div className="summary-card">
                          <p>{t.completedRentals}</p>
                          <div className="summary-row">
                            <strong>{completedRentals.toLocaleString()}</strong>
                            <div className="summary-bar"><div /></div>
                          </div>
                        </div>
                      </div>

                      {/* Main Table Panel */}
                      <section className="panel rentals-panel">
                        {/* Tab bar */}
                        <div className="rental-tabs">
                          {(["all", "active", "done", "cancelled"] as const).map((f) => {
                            const label =
                              f === "all" ? t.filterAll :
                                f === "active" ? t.filterActive :
                                  f === "done" ? t.filterDone : t.filterCancelled;
                            return (
                              <button
                                key={f}
                                className={`rental-tab${rentalsFilter === f ? " active" : ""}`}
                                onClick={() => { setRentalsFilter(f); setRentalsPage(1); }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Toolbar */}
                        <div className="rental-toolbar">
                          <div className="search-box">
                            <span className="material-symbols-outlined">search</span>
                            <input type="text" placeholder={t.searchRentals} />
                          </div>
                          <div className="rental-toolbar-meta">
                            <span>
                              {(rentalsPage - 1) * RENTALS_PER_PAGE + 1}–
                              {Math.min(rentalsPage * RENTALS_PER_PAGE, filtered.length)}{" "}
                              / {filtered.length}
                            </span>
                            <div className="pagination-mini">
                              <button
                                disabled={rentalsPage <= 1}
                                onClick={() => setRentalsPage(Math.max(1, rentalsPage - 1))}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                              </button>
                              <button
                                disabled={rentalsPage >= totalPages}
                                onClick={() => setRentalsPage(Math.min(totalPages, rentalsPage + 1))}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Table */}
                        <div className="table-wrap rentals-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>{t.col_user}</th>
                                <th>{t.col_bike}</th>
                                <th>{t.col_start}</th>
                                <th>{t.col_end}</th>
                                <th>{t.col_started}</th>
                                <th>{t.col_duration}</th>
                                <th style={{ textAlign: "center" }}>{t.col_status}</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {paginated.length === 0 ? (
                                <tr>
                                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                                    {(t as any).no_data ?? "No data"}
                                  </td>
                                </tr>
                              ) : (
                                paginated.map((r, idx) => {
                                  const statusLabel =
                                    r.status === "active" ? t.status_active :
                                      r.status === "done" ? t.status_completed : t.status_cancelled;
                                  return (
                                    <tr key={`${r.user}-${r.bike}-${idx}`}>
                                      <td>
                                        <div className="rental-user-cell">
                                          <div className={`avatar-dot ${r.initialsTone}`}>{r.initials}</div>
                                          <div>
                                            <p className="rental-name">{r.user}</p>
                                            <p className="rental-email">{r.email}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <span className="rental-bike">{r.bike}</span>
                                      </td>
                                      <td className="rental-time">
                                        <span>{r.startStation}</span>
                                      </td>
                                      <td>
                                        {r.status === "active"
                                          ? <span className="rental-end-muted">— {t.on_trip} —</span>
                                          : <span>{r.endStation}</span>
                                        }
                                      </td>
                                      <td className="rental-time">
                                        <span>{r.startDate}</span>
                                        <span>{r.startTime}</span>
                                      </td>
                                      <td>
                                        <span className="rental-duration">{r.duration || "—"}</span>
                                      </td>
                                      <td style={{ textAlign: "center" }}>
                                        <span className={`status-pill ${r.status}`}>{statusLabel}</span>
                                      </td>
                                      <td>
                                        {r.status === "active" ? (
                                          <button
                                            className="outline-action"
                                            style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '11px', padding: '4px 8px' }}
                                            onClick={() => {
                                              setForceEndModal({tripId: r.id || '', bikeCode: r.bike});
                                            }}
                                          >
                                            Hentikan Paksa
                                          </button>
                                        ) : (
                                          <button className="more-action">
                                            <span className="material-symbols-outlined">more_vert</span>
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Footer pagination */}
                        <div className="rental-footer">
                          <span>
                            {lang === "id"
                              ? `Menampilkan ${paginated.length} dari ${filtered.length} riwayat sewa`
                              : `Showing ${paginated.length} of ${filtered.length} rental records`}
                          </span>
                          <nav className="pagination-pages">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                              <button
                                key={pg}
                                className={`page-btn${pg === rentalsPage ? " active" : ""}`}
                                onClick={() => setRentalsPage(pg)}
                              >
                                {pg}
                              </button>
                            ))}
                          </nav>
                        </div>
                      </section>
                    </>
                  );
                })()}
              </>
            </div>
          ) : activePage === "bikes" ? (

            <div className="content">
              <>
                <section className="bike-hero">
                  <div>
                    <h1>Manajemen Sepeda</h1>
                    <p>{t.bikesSubtitle}</p>
                  </div>
                  <button
                    className="primary-action bike-add-action"
                    type="button"
                    onClick={() => {
                      setBikeEditMode({ isEdit: false });
                      setBikeForm({ code: '', stationId: '', dockId: '', status: 'available' });
                      setBikeModal({show:true});
                    }}
                  >
                    <span className="material-symbols-outlined">add</span>
                    <span>{t.addBike}</span>
                  </button>
                </section>

                <section className="bike-tabs">
                  <button
                    className={`bike-tab ${bikesTab === "all" ? "active" : ""}`}
                    type="button"
                    onClick={() => setBikesTab("all")}
                  >
                    {t.bikeShowAll}
                  </button>
                  <button
                    className={`bike-tab ${bikesTab === "in_use" ? "active" : ""}`}
                    type="button"
                    onClick={() => setBikesTab("in_use")}
                  >
                    {t.bikeInUse}
                  </button>
                  <button
                    className={`bike-tab ${bikesTab === "maintenance" ? "active" : ""}`}
                    type="button"
                    onClick={() => setBikesTab("maintenance")}
                  >
                    {t.bikeRepair}
                  </button>
                </section>

                <section className="panel bike-table-panel">
                  <div className="table-wrap bike-table-wrap">
                    {(() => {
                      const effectiveTab =
                        bikesTab === "in_use" ? "active" : bikesTab;
                      const filtered =
                        effectiveTab === "all"
                          ? bikesState
                          : bikesState.filter((b) => b.status === effectiveTab);
                      return (
                        <table>
                          <thead>
                            <tr>
                              <th>{t.col_bike}</th>
                              <th>{t.col_status}</th>
                              <th>{t.col_location}</th>
                              <th>{t.col_renter}</th>
                              <th>{t.col_duration}</th>
                              <th style={{ textAlign: "right" }}>{t.colActions}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  style={{
                                    textAlign: "center",
                                    padding: 40,
                                    color: "var(--muted)",
                                  }}
                                >
                                  {(t as any).no_data ?? "No data"}
                                </td>
                              </tr>
                            ) : (
                              filtered.map((b) => {
                                const statusBadge =
                                  b.status === "available" ? (
                                    <span className="bike-status available">
                                      <span className="bike-status-dot" />
                                      {t.status_available}
                                    </span>
                                  ) : b.status === "active" ? (
                                    <span className="bike-status active">
                                      <span className="bike-status-dot pulse-dot" />
                                      {t.status_inuse}
                                    </span>
                                  ) : (
                                    <span className="bike-status repair">
                                      <span className="bike-status-dot" />
                                      {t.status_maintenance}
                                    </span>
                                  );

                                return (
                                  <tr key={b.code} className={b.status === "active" ? "bike-row-active" : ""}>
                                    <td>
                                      <span className="bike-code">{b.code}</span>
                                    </td>
                                    <td>{statusBadge}</td>
                                    <td>
                                      {b.status === "active" ? (
                                        <span className="bike-location-italic">{t.on_trip}</span>
                                      ) : (
                                        <span className="bike-location-text">
                                          {b.currentStationId 
                                            ? (stationRows.find(s => s.id === b.currentStationId)?.name || b.location)
                                            : (b.location && b.location !== "-" ? b.location : "—")}
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {b.borrower && b.borrower !== "-"
                                        ? b.borrower
                                        : <span className="bike-duration-muted">—</span>
                                      }
                                    </td>
                                    <td>
                                      {b.status === "active" ? (
                                        <span className="bike-duration-active">{b.duration}</span>
                                      ) : (
                                        <span className="bike-duration-muted">—</span>
                                      )}
                                    </td>
                                    <td>
                                      <div className="bike-actions">
                                        {b.status === "active" && (
                                          <button
                                            className="track-action"
                                            onClick={() => setTrackBike(b)}
                                          >
                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>explore</span>
                                            Lacak
                                          </button>
                                        )}
                                        <button 
                                          className="outline-action" 
                                          style={{ padding: '6px 12px', fontSize: 13, gap: 4 }}
                                          onClick={() => {
                                            setBikeEditMode({ isEdit: true, oldDockId: b.currentDockId || undefined });
                                            // Handle status mapping: the local status string in table is 'active' or 'repair', but we want to store the actual DB value in form.
                                            // b.status is already the DB value because it hasn't been mapped in the `b` object itself (it's mapped in `statusBadge` variable). Wait, in line 1899, it IS mapped!
                                            // Let's use the mapped status? No, wait. We need the real DB status!
                                            // Let's map it back for the form:
                                            let dbStatus = b.status === 'active' ? 'in_use' : b.status === 'repair' ? 'maintenance' : 'available';
                                            setBikeForm({ code: b.code, stationId: b.currentStationId || '', dockId: b.currentDockId || '', status: dbStatus });
                                            setBikeModal({show: true});
                                          }}
                                        >
                                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                                          Edit
                                        </button>
                                        <button 
                                          className="outline-action" 
                                          style={{ padding: '6px 12px', fontSize: 13, gap: 4, color: '#ef4444', borderColor: '#ef4444' }}
                                          onClick={() => handleDeleteBike(b.code, b.currentDockId || null)}
                                        >
                                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                          Hapus
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>

                  <div className="bike-footer">
                    <span>
                      {lang === "id"
                        ? `Menampilkan 1-${bikesState.filter(b => bikesTab === "all" ? true : b.status === (bikesTab === "in_use" ? "active" : bikesTab)).length} dari ${bikesState.length} sepeda`
                        : `Showing 1-${bikesState.filter(b => bikesTab === "all" ? true : b.status === (bikesTab === "in_use" ? "active" : bikesTab)).length} of ${bikesState.length} bikes`}
                    </span>
                    <nav className="bike-pagination" aria-label="Bike pagination">
                      <button type="button" disabled>
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button className="active" type="button">1</button>
                      <button type="button">2</button>
                      <button type="button">3</button>
                      <span>...</span>
                      <button type="button">
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </nav>
                  </div>
                </section>
              </>
            </div>
                    ) : activePage === "shifts" ? (
            <div className="content">
              <section className="stations-hero">
                <div>
                  <h1>Jadwal Shift & Swap Requests</h1>
                  <p>Pantau seluruh jadwal shift aktif petugas dan kelola permohonan pertukaran shift secara real-time.</p>
                </div>
              </section>

              {/* Swap Requests */}
              <section className="panel table-panel" style={{ marginTop: '24px' }}>
                <div className="panel-header table-header">
                  <h3>Permohonan Ganti Shift (Pending)</h3>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Petugas</th>
                        <th>Alasan</th>
                        <th>Jadwal Diminta</th>
                        <th>Tgl Pengajuan</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftRequestsState.filter(r => r.status === 'pending').length === 0 ? (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>Tidak ada permohonan tertunda</td></tr>
                      ) : (
                        shiftRequestsState.filter(r => r.status === 'pending').map(req => {
                          const officer = usersState.find(u => u.id === req.officerId) || officersState.find(o => o.id === req.officerId);
                          return (
                            <tr key={req.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{officer ? (officer.displayName || officer.name || officer.email || 'Unknown') : req.officerId}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {req.officerId}</div>
                              </td>
                              <td>{req.reason}</td>
                              <td>
                                <span className="status-badge active" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                  {req.requestedShift}
                                </span>
                              </td>
                              <td>{req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString('id-ID') : 'N/A'}</td>
                              <td>
                                <span className="status-badge" style={{ backgroundColor: '#fff7ed', color: '#ea580c', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '24px', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.1)' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: 'spin 4s linear infinite' }}>hourglass_empty</span>
                                  Menunggu
                                </span>
                                <style>
                                  {`
                                    @keyframes spin { 100% { transform: rotate(360deg); } }
                                    .action-btn-approve {
                                      background-color: #ecfdf5; color: #10b981; border: 1px solid #10b981;
                                      display: flex; align-items: center; justify-content: center;
                                      width: 38px; height: 38px; border-radius: 50%; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
                                    }
                                    .action-btn-approve:hover {
                                      background-color: #10b981; color: white; transform: translateY(-2px) scale(1.05);
                                      box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
                                    }
                                    .action-btn-reject {
                                      background-color: #fef2f2; color: #ef4444; border: 1px solid #ef4444;
                                      display: flex; align-items: center; justify-content: center;
                                      width: 38px; height: 38px; border-radius: 50%; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
                                    }
                                    .action-btn-reject:hover {
                                      background-color: #ef4444; color: white; transform: translateY(-2px) scale(1.05);
                                      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
                                    }
                                  `}
                                </style>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                  <button 
                                    className="action-btn-approve" 
                                    title="Setujui"
                                    onClick={() => {
                                      approveShiftSwap(req.id, req.officerId, req.shiftId, req.requestedShift);
                                      setDashboardToast('Permohonan berhasil disetujui');
                                      setTimeout(() => setDashboardToast(null), 3000);
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
                                  </button>
                                  <button 
                                    className="action-btn-reject" 
                                    title="Tolak"
                                    onClick={() => {
                                      rejectShiftSwap(req.id, req.officerId, req.shiftId);
                                      setDashboardToast('Permohonan ditolak');
                                      setTimeout(() => setDashboardToast(null), 3000);
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Full Schedule Calendar */}
              <section className="calendar-container" style={{ marginTop: '24px' }}>
                <div className="calendar-header-controls">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="calendar-nav-btn" onClick={prevMonth}>
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <h3 className="calendar-title">
                      {calendarCurrentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button className="calendar-nav-btn" onClick={nextMonth}>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                    {isShiftsLoading && <span style={{ color: 'var(--primary)', marginLeft: '12px', fontSize: '13px' }}>Memuat...</span>}
                  </div>
                </div>

                <div className="calendar-grid-header">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                    <div key={d} className="calendar-day-name">{d}</div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {calendarDays.map((date, idx) => {
                    if (!date) {
                      return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;
                    }

                    const shifts = getShiftsForDate(date);
                    const isSelected = calendarSelectedDate && isSameDay(calendarSelectedDate, date);
                    const isToday = isSameDay(new Date(), date);
                    const isPast = date < new Date(new Date().setHours(0,0,0,0));

                    return (
                      <div 
                        key={idx} 
                        className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                        style={{ opacity: isPast ? 0.6 : 1 }}
                        onClick={() => setCalendarSelectedDate(date)}
                      >
                        <div className="calendar-date-number">
                          {date.getDate()}
                        </div>
                        <div className="calendar-indicators">
                          {shifts.length > 0 && (
                            <div className="shift-indicator pagi" style={{ justifyContent: 'center' }}>
                              <span>{shifts.length} Petugas</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Shift Details Side Panel / Bottom Card */}
              {calendarSelectedDate && (
                <section className="shift-detail-card">
                  <div className="shift-detail-header">
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                      Jadwal pada {calendarSelectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '24px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {selectedDateShifts.length} Bertugas
                    </div>
                  </div>
                  
                  {selectedDateShifts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.2, marginBottom: '16px', display: 'block' }}>event_busy</span>
                      Tidak ada petugas yang dijadwalkan pada hari ini.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {selectedDateShifts.map((shift, idx) => (
                        <div key={idx} style={{ padding: '16px', background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--outline)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600 }}>
                            {shift.officerName ? shift.officerName.substring(0, 1).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                              {shift.officerName}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className={`status-badge ${shift.shiftName === 'Libur' ? 'cancelled' : 'active'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                                {shift.shiftName}
                              </span>
                              {shift.swapStatus && shift.swapStatus !== 'pending' && (
                                <span className={`status-badge active`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                                  SWAP: {shift.swapStatus.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
) : activePage === "accounts" ? (
            <AccountsView users={usersState} officers={officersState} onToast={(msg) => { setDashboardToast(msg); setTimeout(() => setDashboardToast(null), 3000); }} />
          ) : activePage === "tasks" ? (
            <div className="content">
              <>
                <section className="stations-hero">
                  <div>
                    <h1>{t.tasksTitle}</h1>
                    <p>Pantau lokasi petugas dan kelola tugas di lapangan secara real-time.</p>
                  </div>
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => setAssignTaskModal({show: true})}
                  >
                    <span className="material-symbols-outlined">add_task</span>
                    <span>Assign Task</span>
                  </button>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', padding: '0 24px' }}>
                  {/* Map Panel */}
                  <div className="panel" style={{ height: '500px', padding: '0', overflow: 'hidden' }}>
                    <TasksMap officers={officersState} />
                  </div>

                  {/* Tasks Table Panel */}
                  <div className="panel tasks-panel" style={{ margin: 0 }}>
                    <div className="table-wrap tasks-table-wrap" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Tugas</th>
                            <th>Lokasi</th>
                            <th>Prioritas</th>
                            <th>Status</th>
                            <th>Petugas</th>
                            <th>Waktu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasksState.length === 0 && (
                            <tr><td colSpan={6} style={{textAlign:'center'}}>Belum ada tugas.</td></tr>
                          )}
                          {tasksState.map((task: any) => (
                            <tr key={task.id}>
                              <td className="task-description-cell">
                                <strong>{task.title}</strong>
                              </td>
                              <td className="task-station-cell">{task.location}</td>
                              <td>
                                <span className={`task-pill ${task.priority === 'high' ? 'perbaikan' : task.priority === 'medium' ? 'redistribusi' : 'laporan'}`}>
                                  {task.priority.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <span className={`task-status-pill ${task.status === 'completed' ? 'selesai' : task.status === 'in_progress' ? 'dikerjakan' : 'menunggu'}`}>
                                  <span className="task-status-dot" />
                                  {task.status.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                {task.assignedTo 
                                  ? (() => {
                                      const fullName = usersState.find(u => u.id === task.assignedTo)?.displayName || officersState.find(o => o.id === task.assignedTo)?.name || "Officer";
                                      return fullName.includes('@') ? fullName.split('@')[0] : fullName;
                                    })()
                                  : "Unassigned"}
                              </td>
                              <td className="task-created-cell">{task.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            </div>
          ) : (
            <div className="content" style={{ height: 'calc(100vh - 72px)', padding: '24px 32px' }}>
              <div style={{
                display: 'flex', 
                background: 'var(--surface)', 
                borderRadius: '16px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                height: '100%'
              }}>
                {/* Left sidebar for officers */}
                <div style={{ width: '320px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Daftar Petugas</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Pilih petugas untuk membalas pesan</p>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {officersState.map(officer => {
                      const displayName = officer.name || usersState.find(u => u.id === officer.id)?.displayName || '';
                      const finalName = displayName.includes('@') ? displayName.split('@')[0] : displayName || `Petugas (${officer.id.substring(0, 5)})`;
                      
                      return (
                        <div 
                          key={officer.id} 
                          onClick={() => {
                            setActiveChatOfficerId(officer.id);
                            if (officer.hasUnreadAdmin) {
                              markChatAsRead(officer.id);
                            }
                          }}
                          style={{ 
                            padding: '16px 24px', 
                            cursor: 'pointer', 
                            borderBottom: '1px solid var(--border)',
                            background: activeChatOfficerId === officer.id ? 'var(--bg)' : 'transparent',
                            transition: 'background 0.2s',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ 
                            width: '40px', height: '40px', borderRadius: '50%', 
                            background: 'var(--primary-light)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: '14px', flexShrink: 0
                          }}>
                            {finalName.substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)', fontSize: '14px' }}>
                                {finalName}
                              </strong>
                              {officer.hasUnreadAdmin && (
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                              )}
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {officer.lastMessage || 'Belum ada pesan'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Chat view area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
                  {activeChatOfficerId ? (
                    <SupportChatView officerId={activeChatOfficerId} />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>forum</span>
                      <p style={{ margin: 0 }}>Pilih petugas di samping untuk memulai obrolan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
</main>
      </div>


      {stationModal
        ? (() => {
          const station =
            stationModal.stationId !== null
              ? (stationRows.find(
                (item) => item.id === stationModal.stationId,
              ) ?? null)
              : null;
          const latValue = Number.parseFloat(stationForm.lat);
          const lngValue = Number.parseFloat(stationForm.lng);
          const hasCoords =
            !Number.isNaN(latValue) && !Number.isNaN(lngValue);

          const mapLatMin = -7.2885;
          const mapLatMax = -7.279;
          const mapLngMin = 112.793;
          const mapLngMax = 112.8005;
          const markerTop = hasCoords
            ? `${((mapLatMax - latValue) / (mapLatMax - mapLatMin)) * 100}%`
            : "50%";
          const markerLeft = hasCoords
            ? `${((lngValue - mapLngMin) / (mapLngMax - mapLngMin)) * 100}%`
            : "50%";

          return (
            <div
              className="modal-backdrop modal-active"
              role="presentation"
              onClick={() => setStationModal(null)}
            >
              <div
                className="modal-card station-modal-card"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <h3>
                      {stationModal.mode === "add"
                        ? t.formAddStationTitle
                        : t.formEditStationTitle}
                    </h3>
                    <p>{station?.name ?? t.stations}</p>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setStationModal(null)}
                    aria-label={t.close}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="station-modal-body">
                  <div className="station-form-grid">
                    <label className="station-field">
                      <span>{t.formStationName} *</span>
                      <input
                        value={stationForm.name}
                        onChange={(event) =>
                          setStationForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        type="text"
                      />
                    </label>
                    <label className="station-field station-field-wide">
                      <span>{t.formAddress}</span>
                      <input
                        value={stationForm.address}
                        onChange={(event) =>
                          setStationForm((current) => ({
                            ...current,
                            address: event.target.value,
                          }))
                        }
                        type="text"
                      />
                    </label>
                    <label className="station-field">
                      <span>{t.formLatitude} *</span>
                      <input
                        value={stationForm.lat}
                        onChange={(event) =>
                          setStationForm((current) => ({
                            ...current,
                            lat: event.target.value,
                          }))
                        }
                        type="number"
                        step="0.000001"
                      />
                    </label>
                    <label className="station-field">
                      <span>{t.formLongitude} *</span>
                      <input
                        value={stationForm.lng}
                        onChange={(event) =>
                          setStationForm((current) => ({
                            ...current,
                            lng: event.target.value,
                          }))
                        }
                        type="number"
                        step="0.000001"
                      />
                    </label>
                    {stationModal.mode === "add" ? (
                      <label className="station-field station-field-wide">
                        <span>{t.formTotalDocks}</span>
                        <input
                          value={stationForm.totalDocks}
                          onChange={(event) =>
                            setStationForm((current) => ({
                              ...current,
                              totalDocks: event.target.value,
                            }))
                          }
                          type="number"
                          min="0"
                        />
                      </label>
                    ) : null}
                    <p className="station-hint station-field-wide">
                      {t.formCoordHint}
                    </p>
                  </div>

                  <div className="relative h-48 sm:h-64 w-full rounded-lg border border-[#BEC9C3] overflow-hidden">
                    <StationFormMap 
                      lat={stationForm.lat} 
                      lng={stationForm.lng} 
                      onMapClick={(newLat, newLng) => setStationForm((prev) => ({ ...prev, lat: newLat, lng: newLng }))} 
                    />
                    <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1.5 rounded shadow-sm border border-[#BEC9C3] backdrop-blur-sm z-[400] pointer-events-none">
                      <p className="text-[11px] font-medium font-mono text-[#3F4944] m-0">
                        {stationForm.lat || "-"} , {stationForm.lng || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="outline-action"
                    type="button"
                    onClick={() => setStationModal(null)}
                  >
                    {t.cancel}
                  </button>
                  <button
                    className="primary-action"
                    type="button"
                    onClick={saveStation}
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
        : null}

      {trackBike ? (
        <div
          className="modal-backdrop modal-active"
          role="presentation"
          onClick={() => closeTrackModal()}
        >
          <div
            className="bike-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bike-modal-header">
              <div className="bike-modal-head-left">
                <span className="material-symbols-outlined bike-modal-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pedal_bike
                </span>
                <h3>{trackBike.code}</h3>
                <div className="bike-modal-pill">
                  <div className="bike-modal-pill-dot"></div>
                  <span className="bike-modal-pill-text">{t.active_trip}</span>
                </div>
              </div>
              <div className="bike-modal-updated">
                <span className="material-symbols-outlined">update</span>
                <span>
                  {t.last_update}: {new Date().toTimeString().split(' ')[0]}
                </span>
              </div>
            </div>

            <div className="bike-modal-body">
              {/* Left: Map Column */}
              <div className="bike-map-panel">
                <TrackMap route={trackRouteState} stations={stationRows} />
              </div>

              {/* Right: Info Panel Column */}
              <div className="bike-info-panel">
                <div className="bike-info-section">
                  <p className="bike-info-label">{t.renter}</p>
                  <div className="bike-info-value-row">
                    <span className="material-symbols-outlined">person</span>
                    <p>{
                      (() => {
                        const trip = window.velocyTrips?.find((t: any) => (t.bikeCode === trackBike.code || t.bikeId === trackBike.code) && t.status === "active");
                        if (trip) {
                          const u = usersState.find(u => u.id === trip.userId);
                          if (u) return u.displayName || u.email || 'Pengguna';
                        }
                        return bikesState.find((b) => b.code === trackBike.code)?.borrower || trackBike.borrower || "—";
                      })()
                    }</p>
                  </div>
                </div>

                <div className="bike-info-section">
                  <p className="bike-info-label">{t.start_station}</p>
                  <div className="bike-info-value-row">
                    <span className="material-symbols-outlined">location_on</span>
                    <p>{
                      (() => {
                        const trip = window.velocyTrips?.find((t: any) => (t.bikeCode === trackBike.code || t.bikeId === trackBike.code) && t.status === "active");
                        return trip?.originStationName || "—";
                      })()
                    }</p>
                  </div>
                </div>

                <div className="bike-duration-box">
                  <p className="bike-info-label">{t.duration}</p>
                  <p className="bike-duration-value">
                    {bikesState.find((b) => b.code === trackBike.code)?.duration || "00:00:00"}
                  </p>
                </div>

                <div className="bike-stats-group">
                  <div className="bike-stat-row">
                    <span className="bike-stat-label">{t.bikeModalGpsPoints}</span>
                    <span className="bike-stat-value">
                      <div className="bike-stat-value-dot"></div>
                      {trackRouteState.length}
                    </span>
                  </div>

                  <div className="bike-stat-column">
                    <span className="bike-stat-label">{t.bikeModalCurrentPosition}</span>
                    <span className="bike-stat-value">
                      {trackRouteState.length > 0
                        ? `${trackRouteState[trackRouteState.length - 1][0].toFixed(6)}, ${trackRouteState[trackRouteState.length - 1][1].toFixed(6)}`
                        : "—"}
                    </span>
                  </div>

                  <div className="bike-stat-row">
                    <span className="bike-stat-label">{t.bikeModalDistance}</span>
                    <span className="bike-stat-value">
                      {(1.0 + trackRouteState.length * 0.01).toFixed(1)} km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bike-modal-footer">
              <div className="bike-footer-left">
                <span className="material-symbols-outlined">sync</span>
                <span>{t.auto_refresh}</span>
              </div>
              <div className="bike-footer-actions">
                <button
                  className="btn-close-modal"
                  type="button"
                  onClick={() => closeTrackModal()}
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {dockStationId !== null
        ? (() => {
          const station =
            stationViewRows.find((item) => item.id === dockStationId) ?? null;
          const docks = stationDocks[dockStationId] ?? [];

          return (
            <div
              className="modal-backdrop modal-active"
              role="presentation"
              onClick={() => setDockStationId(null)}
            >
              <div
                className="modal-card docks-modal"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <h3>{t.dockDetail}</h3>
                    <p>{station?.name ?? "-"}</p>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setDockStationId(null)}
                    aria-label={t.close}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div style={{ padding: '0 22px 16px' }}>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#166534' }}>Auto-Discovery</h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#15803d' }}>
                          Aktifkan sinkronisasi lalu nyalakan ESP32 stasiun ini untuk menambahkan dock otomatis.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSyncing(!isSyncing);
                          if (!isSyncing) setSyncLogs([]);
                        }}
                        style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: isSyncing ? '#fee2e2' : '#10b981',
                          color: isSyncing ? '#991b1b' : '#ffffff',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isSyncing ? 'Berhenti' : 'Mulai'}
                      </button>
                    </div>
                    {isSyncing && (
                      <div style={{ marginTop: '0.75rem', backgroundColor: '#022c22', color: '#4ade80', padding: '0.75rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', maxHeight: '120px', overflowY: 'auto' }}>
                        {syncLogs.length === 0 ? (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Menunggu alat terkoneksi...</div>
                        ) : (
                          syncLogs.map((log, i) => <div key={i}>{log}</div>)
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="docks-grid docks-grid-scroll">
                  {docks.map((dock) => (
                    <div className={`dock-card${!dock.isActive ? ' dock-inactive' : ''}`} key={dock.id}>
                      <div className="dock-card-top">
                        <div className="dock-icon">
                          <span className="material-symbols-outlined">
                            {dock.isActive ? 'dock' : 'power_off'}
                          </span>
                        </div>
                        <span className={`dock-badge ${!dock.isActive ? 'broken' : dock.status}`}>
                          {!dock.isActive
                            ? (lang === "id" ? "Nonaktif" : "Inactive")
                            : dock.status === "available"
                              ? t.statusAvailable
                              : dock.status === "occupied"
                                ? t.statusOccupied
                                : t.statusBroken}
                        </span>
                      </div>
                      <p className="dock-label">{t.dockNumber}</p>
                      <strong style={{fontSize: '1.25rem'}}>{dock.number}</strong>
                      <div style={{marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px'}}>
                        <p className="dock-qr-text" style={{margin: 0, fontSize: '0.72rem', color: '#64748b'}}>
                          <span className="material-symbols-outlined" style={{fontSize: '14px', verticalAlign: 'middle', marginRight: '4px'}}>memory</span>
                          Sensor Pin: <strong>{dock.sensorPin ?? '-'}</strong>
                        </p>
                        {(dock.relayPin ?? 0) > 0 && (
                          <p className="dock-qr-text" style={{margin: 0, fontSize: '0.72rem', color: '#64748b'}}>
                            <span className="material-symbols-outlined" style={{fontSize: '14px', verticalAlign: 'middle', marginRight: '4px'}}>electrical_services</span>
                            Relay Pin: <strong>{dock.relayPin}</strong>
                          </p>
                        )}
                      </div>
                      <div className="dock-card-actions" style={{marginTop: '10px'}}>
                        <button
                          className="outline-action"
                          type="button"
                          style={{ borderColor: '#ef4444', color: '#ef4444' }}
                          title={lang === "id" ? "Buka paksa dock (Force Unlock)" : "Force Unlock this dock"}
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: 'Buka Paksa Dok?',
                              text: lang === "id" ? "Apakah Anda yakin ingin membuka paksa dock ini selama 5 detik?" : "Are you sure you want to force unlock this dock for 5 seconds?",
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              cancelButtonColor: '#5d6b64',
                              confirmButtonText: lang === "id" ? 'Ya, Buka' : 'Yes, Unlock',
                              cancelButtonText: lang === "id" ? 'Batal' : 'Cancel'
                            });
                            if (result.isConfirmed) {
                              publishOpenCommand(dockStationId, dock.relayPin ?? 0, 5);
                            }
                          }}
                        >
                          <span className="material-symbols-outlined" style={{fontSize: '15px', verticalAlign: 'middle', marginRight: '3px'}}>lock_open</span>
                          {lang === "id" ? "Buka Paksa" : "Force Unlock"}
                        </button>
                        <button
                          className={`outline-action${dock.isActive ? ' dock-toggle-active' : ' dock-toggle-inactive'}`}
                          type="button"
                          title={dock.isActive ? (lang === "id" ? "Nonaktifkan dock ini" : "Deactivate this dock") : (lang === "id" ? "Aktifkan dock ini" : "Activate this dock")}
                          onClick={() => {
                            updateDock(dock.id, { isActive: !dock.isActive });
                          }}
                        >
                          <span className="material-symbols-outlined" style={{fontSize: '15px', verticalAlign: 'middle', marginRight: '3px'}}>{dock.isActive ? 'toggle_on' : 'toggle_off'}</span>
                          {dock.isActive ? (lang === "id" ? "Aktif" : "Active") : (lang === "id" ? "Nonaktif" : "Inactive")}
                        </button>
                        <button
                          className="outline-action"
                          type="button"
                          onClick={() => openQrModal(dockStationId, dock.id)}
                        >
                          {t.btnViewQr}
                        </button>
                        <button
                          className="outline-action"
                          type="button"
                          onClick={() =>
                            openDockEditModal(dockStationId, dock.id)
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="outline-action"
                          type="button"
                          onClick={() => deleteDock(dockStationId, dock.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-footer">
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => openDockEditModal(dockStationId, null)}
                  >
                    {t.btnAddDock}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
        : null}

      {dockModal
        ? (() => {
          const station =
            stationRows.find((item) => item.id === dockModal.stationId) ??
            null;

          return (
            <div
              className="modal-backdrop modal-active"
              role="presentation"
              onClick={() => setDockModal(null)}
            >
              <div
                className="modal-card dock-edit-modal"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <h3>
                      {dockModal.mode === "add"
                        ? t.formAddDockTitle
                        : t.formEditDockTitle}
                    </h3>
                    <p>{station?.name ?? "-"}</p>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setDockModal(null)}
                    aria-label={t.close}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="dock-edit-body">
                  <label className="station-field station-field-wide">
                    <span>{t.dockNumber} *</span>
                    <input
                      value={dockForm.number}
                      onChange={(event) =>
                        setDockForm((current) => ({
                          ...current,
                          number: event.target.value.toUpperCase(),
                        }))
                      }
                      type="text"
                      placeholder={t.formDockNumber}
                    />
                  </label>
                  <label className="station-field station-field-wide">
                    <span>{t.dockStatus}</span>
                    <select
                      value={dockForm.status}
                      onChange={(event) =>
                        setDockForm((current) => ({
                          ...current,
                          status: event.target.value as StationDock["status"],
                        }))
                      }
                    >
                      <option value="available">{t.statusAvailable}</option>
                      <option value="occupied">{t.statusOccupied}</option>
                      <option value="broken">{t.statusBroken}</option>
                    </select>
                  </label>

                  <div className="dock-qr-preview">
                    {dockQrPreview ? (
                      <img src={dockQrPreview} alt={t.qrModalTitle} />
                    ) : (
                      <div className="dock-qr-placeholder">QR</div>
                    )}
                    <p>
                      {dockForm.number
                        ? `VELOCY-ST${dockModal.stationId}-${dockForm.number}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="outline-action"
                    type="button"
                    onClick={() => setDockModal(null)}
                  >
                    {t.cancel}
                  </button>
                  <button
                    className="primary-action"
                    type="button"
                    onClick={saveDock}
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
        : null}

      {assignTaskModal.show && (
        <div className="modal-backdrop modal-active" role="presentation" onClick={() => setAssignTaskModal({show: false})}>
          <div className="modal-card" style={{ width: 'min(500px, 100%)' }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Assign New Task</h3>
                <p>Berikan tugas kepada petugas di lapangan</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setAssignTaskModal({show: false})} aria-label="Close modal">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await firestoreAddTask({
                title: taskForm.title,
                location: taskForm.location,
                priority: taskForm.priority,
                status: 'pending',
                assignedTo: taskForm.assignedTo || null,
              });
              setAssignTaskModal({show: false});
              setTaskForm({ title: '', location: '', priority: 'low', assignedTo: '' });
              setDashboardToast("Task assigned successfully");
              setTimeout(() => setDashboardToast(null), 3000);
            }}>
              <div style={{ padding: '20px 22px 22px' }}>
                <div className="station-form-grid">
                  <label className="station-field station-field-wide">
                    <span>Judul Tugas</span>
                    <input type="text" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="Contoh: Perbaikan sepeda #123" />
                  </label>
                  <label className="station-field station-field-wide">
                    <span>Lokasi Stasiun</span>
                    <CustomSelect 
                      value={taskForm.location}
                      onChange={val => setTaskForm({...taskForm, location: val})}
                      options={stationRows.map(st => ({ value: st.name, label: st.name }))}
                      placeholder="Pilih stasiun..."
                    />
                  </label>
                  <label className="station-field">
                    <span>Prioritas</span>
                    <CustomSelect 
                      value={taskForm.priority}
                      onChange={val => setTaskForm({...taskForm, priority: val as any})}
                      options={[
                        { value: "low", label: "Low" },
                        { value: "medium", label: "Medium" },
                        { value: "high", label: "High" }
                      ]}
                      placeholder="Pilih prioritas..."
                    />
                  </label>
                  <label className="station-field">
                    <span>Tugaskan Kepada</span>
                    <CustomSelect 
                      value={taskForm.assignedTo}
                      onChange={val => setTaskForm({...taskForm, assignedTo: val})}
                      options={officersState.map(o => {
                        const fullName = usersState.find(u => u.id === o.id)?.displayName || o.name || o.id;
                        const shortName = fullName.includes('@') ? fullName.split('@')[0] : fullName;
                        return { value: o.id, label: `${shortName} - ${o.status || 'Online'}` };
                      })}
                      placeholder="Pilih petugas..."
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="outline-action" onClick={() => setAssignTaskModal({show: false})}>Batal</button>
                <button type="submit" className="primary-action">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal
        ? (() => {
          const dock =
            (stationDocks[qrModal.stationId] ?? []).find(
              (item) => item.id === qrModal.dockId,
            ) ?? null;
          const station =
            stationRows.find((item) => item.id === qrModal.stationId) ?? null;

          

  return (
            <div
              className="modal-backdrop modal-active"
              role="presentation"
              onClick={() => setQrModal(null)}
            >
              <div
                className="modal-card qr-modal-card"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="modal-header">
                  <div>
                    <h3>{t.qrModalTitle}</h3>
                    <p>
                      {station?.name ?? "-"} · {dock?.number ?? "-"}
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setQrModal(null)}
                    aria-label={t.close}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="qr-modal-body">
                  {dockQrPreview ? (
                    <img src={dockQrPreview} alt={t.qrModalTitle} />
                  ) : (
                    <div className="dock-qr-placeholder">QR</div>
                  )}
                  <p>{dock?.qr ?? "-"}</p>
                </div>

                <div className="modal-footer">
                  <button
                    className="outline-action"
                    type="button"
                    onClick={() => setQrModal(null)}
                  >
                    {t.close}
                  </button>
                  <button
                    className="primary-action"
                    type="button"
                    onClick={downloadQr}
                  >
                    {t.btnDownloadQr}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
        : null}

        {bikeModal.show && (
          <div
            className="modal-backdrop modal-active"
            role="presentation"
            onClick={() => setBikeModal({show: false})}
          >
            <div
              className="modal-card"
              role="dialog"
              aria-modal="true"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>{bikeEditMode.isEdit ? 'Edit Sepeda' : 'Tambah Sepeda'}</h3>
                  <p>{bikeEditMode.isEdit ? 'Pindahkan atau ubah data sepeda' : 'Tambahkan sepeda baru ke stasiun dan dok'}</p>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setBikeModal({show: false})}
                  aria-label={t.close}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="bikeCode">ID Sepeda (contoh: B001)</label>
                  <input
                    id="bikeCode"
                    className="form-control"
                    type="text"
                    value={bikeForm.code}
                    onChange={(e) =>
                      setBikeForm({ ...bikeForm, code: e.target.value })
                    }
                    placeholder="B001"
                  />
                </div>

                <div className="form-group">
                  <label>Stasiun</label>
                  <CustomSelect
                    value={bikeForm.stationId}
                    onChange={(val) => setBikeForm({ ...bikeForm, stationId: val, dockId: '' })}
                    placeholder="Pilih Stasiun (Opsional)"
                    options={[
                      { value: '', label: '-- Belum Ditempatkan --' },
                      ...stationRows.map((s) => ({ value: s.id, label: s.name }))
                    ]}
                  />
                </div>

                {bikeForm.stationId && (
                  <div className="form-group">
                    <label>Dok Tujuan</label>
                    <CustomSelect
                      value={bikeForm.dockId}
                      onChange={(val) => setBikeForm({ ...bikeForm, dockId: val })}
                      placeholder="Pilih Dok"
                      options={(stationDocks[bikeForm.stationId] || []).map((d) => ({
                        value: d.id,
                        label: `${d.number} ${d.status === 'occupied' ? '(Terisi)' : ''}`.trim()
                      }))}
                    />
                  </div>
                )}
                
                {/* Status Field for Editing */}
                <div className="form-group">
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#4b5563' }}>Status Sepeda</label>
                  <select
                    value={bikeForm.status}
                    onChange={(e) => setBikeForm({ ...bikeForm, status: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: 'Inter',
                      borderRadius: 12, border: '1px solid #d1d5db', outline: 'none', backgroundColor: 'white'
                    }}
                  >
                    <option value="available">{t.status_available}</option>
                    <option value="in_use">{t.status_inuse}</option>
                    <option value="maintenance">{t.status_maintenance}</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="outline-action"
                  type="button"
                  onClick={() => setBikeModal({show: false})}
                >
                  Batal
                </button>
                <button
                  className="primary-action"
                  type="button"
                  onClick={saveBike}
                  disabled={!bikeForm.code}
                >
                  Simpan Sepeda
                </button>
              </div>
            </div>
          </div>
        )}

      {/* FORCE END MODAL */}
      {forceEndModal && (
        <div className="modal-backdrop modal-active">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Hentikan Paksa Sesi</h2>
              <button className="close-btn" onClick={() => {
                setForceEndModal(null);
                setForceEndForm({stationId: '', dockId: ''});
              }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{marginBottom: '16px', fontSize: '14px', color: '#666'}}>
                Pilih stasiun dan dok kosong untuk mengembalikan sepeda {forceEndModal.bikeCode}.
              </p>
              <div className="form-group">
                <label>Stasiun Tujuan</label>
                <CustomSelect
                  value={forceEndForm.stationId}
                  onChange={(val) => setForceEndForm({...forceEndForm, stationId: val, dockId: ''})}
                  placeholder="-- Pilih Stasiun --"
                  options={stationRows.map((s) => ({ value: s.id, label: s.name }))}
                />
              </div>

              {forceEndForm.stationId && (
                <div className="form-group">
                  <label>Dok Kosong</label>
                  <CustomSelect
                    value={forceEndForm.dockId}
                    onChange={(val) => setForceEndForm({...forceEndForm, dockId: val})}
                    placeholder="-- Pilih Dok --"
                    options={(stationDocks[forceEndForm.stationId] || [])
                      .filter((d) => d.status === 'available' && d.isActive)
                      .map((d) => ({ value: d.id, label: `Dok ${d.number}` }))}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="outline-action"
                type="button"
                onClick={() => {
                  setForceEndModal(null);
                  setForceEndForm({stationId: '', dockId: ''});
                }}
              >
                Batal
              </button>
              <button
                className="primary-action"
                style={{backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white'}}
                type="button"
                disabled={!forceEndForm.stationId || !forceEndForm.dockId}
                onClick={async () => {
                  try {
                    const selStation = stationRows.find(s => s.id === forceEndForm.stationId);
                    await updateTrip(forceEndModal.tripId, {
                      status: 'cancelled',
                      actualReturnStationName: selStation ? selStation.name : 'Force Ended by Admin',
                      completedAt: new Date(),
                      returnDockId: forceEndForm.dockId
                    });
                    if (forceEndModal.bikeCode && forceEndModal.bikeCode !== '-') {
                      await firestoreUpdateBike(forceEndModal.bikeCode, {
                        status: 'available',
                        location: 'Tersedia',
                        currentStationId: forceEndForm.stationId,
                        currentDockId: forceEndForm.dockId
                      });
                    }
                    await updateDock(forceEndForm.dockId, {
                      status: 'occupied',
                      currentBikeCode: forceEndModal.bikeCode
                    });
                    setForceEndModal(null);
                    setForceEndForm({stationId: '', dockId: ''});
                  } catch (e) {
                    console.error("Force End Error", e);
                  }
                }}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {dashboardToast ? (
        <div className="dashboard-toast" role="status" aria-live="polite">
          <span className="material-symbols-outlined">notifications</span>
          <span>{dashboardToast}</span>
        </div>
      ) : null}
    </div>
  );
}


  // Rentals state (React-driven)
