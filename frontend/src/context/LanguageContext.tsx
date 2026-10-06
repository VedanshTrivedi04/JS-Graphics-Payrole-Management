"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Common
    appName: "Identix PayFlow",
    tagline: "Cloud Biometric Attendance, Hourly Wages & Payroll Engine",
    subTagline: "Zero-LAN Biometric Attendance & Hourly Payroll",
    liveConnected: "Live Connected",
    connectingDb: "Connecting to Neon Database...",
    cloudAdms: "Cloud ADMS",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    refresh: "Refresh",
    download: "Download",
    loading: "Loading...",
    success: "Success",
    error: "Error",
    actions: "Actions",
    status: "Status",
    date: "Date",
    amount: "Amount",
    welcome: "Welcome",
    namaste: "Namaste",

    // Auth & Login
    accountLogin: "Account Login",
    loginWithBiometric: "Login with Phone Fingerprint",
    biometricScanning: "Scanning Sensor...",
    welcomeBack: "Welcome back",
    unlinkBiometric: "Unlink Fingerprint",
    orEnterPassword: "Or enter password below",
    identifierLabel: "Username / Mobile Number / Email",
    identifierPlaceholder: "admin or 9876543210 or email",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    enableBiometricLabel: "Enable phone fingerprint login on this device",
    signInWithPassword: "Sign In with Password",
    authenticating: "Authenticating...",
    quickDemoLogins: "Quick One-Click Demo Logins",
    shopOwner: "Shop Owner",
    staffRamesh: "Staff (Ramesh)",
    zeroLanPush: "Zero-LAN Push",
    fingerprintLogin: "Fingerprint Login",
    pdfSlipEngine: "PDF Slip Engine",
    invalidCredentials: "Invalid credentials. Please verify your username, phone, or email.",
    biometricFailed: "Fingerprint verification failed. You can sign in using your password.",

    // Navbar & Roles
    shopOwnerRole: "Shop Owner",
    staffRole: "Staff",
    logout: "Logout",
    toggleTheme: "Toggle Theme",
    languageToggle: "हिंदी / English",

    // Navigation Tabs
    tabOverview: "Overview & Live Feed",
    tabStaff: "Staff & Rates",
    tabAdvances: "Advances & Extra Pay",
    tabPayroll: "Payroll & PDF Reports",
    tabDevice: "Biometric Hardware",
    tabMyToday: "Today's Clock",
    tabMyHistory: "Attendance History",
    tabMyEarnings: "Salary & Advances",
    testSimulatorBtn: "Punch Simulator",

    // Admin Overview
    kpiPresentToday: "Present Today",
    kpiPresentSub: "Staff currently in store / total",
    kpiHoursToday: "Hours Logged Today",
    kpiHoursSub: "Sum of active working hours",
    kpiWageToday: "Est. Day's Wage",
    kpiWageSub: "Per-hour rate applied today",
    kpiAdvancesMonth: "Total Advances Given",
    kpiAdvancesSub: "Deductions for this month",
    hoursLoggedChartTitle: "Today's Logged Working Hours & Earnings",
    livePunchesTitle: "Real-time Biometric Punches Feed",
    noPunchesCaptured: "No punches captured yet. Punch your finger on the Identix terminal!",
    deviceSn: "SN",
    pin: "PIN",
    punchIn: "IN",
    punchOut: "OUT",
    liveBadge: "Live",

    // Admin Staff Management
    staffManagementTitle: "Employee Directory & Hourly Wage Rates",
    staffManagementSub: "Configure hourly compensation, biometric PINs, and mobile app access",
    addNewStaffBtn: "Add New Staff Member",
    colStaffMember: "Staff Member",
    colBiometricPin: "Biometric PIN",
    colHourlyRate: "Hourly Rate",
    colRole: "System Role",
    colAppLogin: "App Login Phone",
    colActions: "Actions",
    activeStaffBadge: "Active",
    inactiveStaffBadge: "Inactive",
    deleteStaffConfirm: "Are you sure you want to remove this staff member?",

    // Admin Advances & Extra Pay
    advancesManagementTitle: "Mid-Month Advances & Deductions Ledger",
    advancesManagementSub: "Track cash/UPI payouts given in advance. Automatically deducted from monthly salary.",
    recordAdvanceBtn: "Record Cash / UPI Advance",
    colStaff: "Staff",
    colDate: "Date",
    colAmount: "Amount",
    colMode: "Mode",
    colReasonNotes: "Reason & Notes",
    colDeduction: "Type",
    deleteAdvanceConfirm: "Delete this advance record?",

    // Admin Payroll & Reports
    payrollTitle: "Payroll Summary & Instant PDF Statement Generator",
    payrollSub: "Select any custom date range to calculate gross earnings, advance deductions, and net payouts.",
    dateRangeLabel: "Date Range:",
    fromDateLabel: "From Date",
    toDateLabel: "To Date",
    calcPayrollBtn: "Calculate Payroll",
    customRateOverrideLabel: "Override Rate (₹/hr optional)",
    exportCsvBtn: "Export Spreadsheet (CSV)",
    kpiTotalHours: "Total Hours Logged",
    kpiGrossSalary: "Gross Salary Accrued",
    kpiAdvancesDeducted: "Advances Deducted",
    kpiNetPayable: "Final Net Payable",
    payoutDistributionTitle: "Payout Distribution",
    payrollTableTitle: "Staff Payroll & Deduction Statement",
    colDaysPresent: "Days Present",
    colGrossSalary: "Gross Salary",
    colAdvanceCut: "Advance Cut",
    colNetTakeHome: "Net Take-Home",
    pdfSlipBtn: "PDF Slip",
    markPaidBtn: "Mark Paid",
    markPaidSuccess: "Payment recorded successfully",

    // Admin Biometric Hardware Tab
    hardwareTitle: "Identix Biometric Terminal & Cloud Push Config",
    hardwareSub: "Device communicates directly over HTTP Cloud ADMS without requiring any local office LAN",
    launchHardwareSim: "Launch Hardware Simulator",
    physicalProfileTitle: "Physical Device Hardware Profile",
    deviceModel: "Device Model",
    serialNumber: "Serial Number (SN)",
    platformKernel: "Platform & Kernel",
    pushServiceVersion: "Push Service Version",
    protocolSupport: "Protocol Support",
    admsCloudEnabled: "ADMS Cloud Push Enabled",
    onDeviceSetupTitle: "On-Device Menu Setup Instructions",
    onDeviceSetupSub: "To link your physical machine to this cloud backend, enter the on-screen machine settings:",
    serverMode: "Server Mode",
    enableDomainName: "Enable Domain Name",
    serverAddress: "Server Address",
    serverPort: "Server Port",
    enableProxyServer: "Enable Proxy Server",

    // Employee Dashboard
    namasteGreeting: "Namaste",
    staffPinLabel: "Staff PIN",
    hourlyRateLabel: "Hourly Rate",
    downloadMonthPayslip: "Download My Month Payslip (PDF)",
    empTodayHours: "Today's Hours",
    empTodayEarning: "Today's Earning",
    empMonthTakeHome: "This Month Take-Home",
    empTodayStatusTitle: "Today's Biometric Attendance Status",
    punchInArrival: "Punch In (Arrival)",
    punchOutDeparture: "Punch Out (Departure)",
    loggedHours: "Logged Hours",
    todayAccumulation: "Today's Accumulation",
    noPunchTodayMsg: "You haven't punched your fingerprint today. Scan your finger on the shop machine to begin your shift.",
    empAdvancesTitle: "Mid-Month Cash / UPI Advances Taken",
    empAdvancesSub: "These amounts are deducted from your final monthly salary payout.",
    deductionBadge: "Deduction",
    empHistoryTitle: "My Recent Attendance & Hours History",
    colInTime: "In-Time",
    colOutTime: "Out-Time",
    colHoursWorked: "Hours Worked",
    colEarned: "Earned (₹)",
    noHistoryFound: "No historical attendance found yet.",

    // Staff Period Selection & Payslip
    selectPeriod: "Select Period:",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    twoMonthsAgo: "2 Months Ago",
    customRange: "Custom Range",
    applyPeriodFilter: "Show Statement",
    periodSummaryTitle: "Selected Period Salary & Hours Summary",
    daysPresentCount: "Days Worked",
    totalHoursCount: "Total Hours Logged",
    grossEarnedAmount: "Gross Earnings",
    advanceCutAmount: "Advance Cut",
    netTakeHomeAmount: "Net Payable (Take-Home)",
    downloadPeriodPdfBtn: "Download Period Payslip (PDF)",
    dayByDayTitle: "Daily Attendance & Shift Timings (When In / When Out)",
    inTimeLabel: "Arrival (In Time)",
    outTimeLabel: "Departure (Out Time)",
    hoursWorkedLabel: "Hours Worked",
    dayEarningsLabel: "Day's Earning (₹)",
    statusLabel: "Status",
    activeNowBadge: "Active Shift Now",
    noRecordsForPeriod: "No attendance records found for this selected date range.",

    // Modals
    addStaffTitle: "Add New Staff Member",
    editStaffTitle: "Edit Staff Details",
    recordAdvanceTitle: "Record Cash / UPI Advance",
    manualPunchModalTitle: "Manual Punch Entry",
    deviceSimulatorTitle: "Identix Biometric Machine Simulator",
  },

  hi: {
    // Brand & Common
    appName: "Identix PayFlow",
    tagline: "क्लाउड बायोमेट्रिक उपस्थिति, प्रति घंटा मजदूरी और पेरोल इंजन",
    subTagline: "जीरो-LAN बायोमेट्रिक उपस्थिति और प्रति घंटा पेरोल",
    liveConnected: "लाइव कनेक्टेड",
    connectingDb: "नियॉन डेटाबेस से कनेक्ट हो रहा है...",
    cloudAdms: "क्लाउड ADMS",
    save: "सुरक्षित करें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    close: "बंद करें",
    refresh: "रिफ्रेश करें",
    download: "डाउनलोड करें",
    loading: "लोड हो रहा है...",
    success: "सफल",
    error: "त्रुटि",
    actions: "कार्य",
    status: "स्थिति",
    date: "दिनांक",
    amount: "राशि",
    welcome: "स्वागत है",
    namaste: "नमस्ते",

    // Auth & Login
    accountLogin: "खाता लॉगिन",
    loginWithBiometric: "फोन फिंगरप्रिंट से लॉगिन करें",
    biometricScanning: "सेंसर स्कैन हो रहा है...",
    welcomeBack: "वापसी पर स्वागत है",
    unlinkBiometric: "फिंगरप्रिंट हटाएं",
    orEnterPassword: "या नीचे पासवर्ड दर्ज करें",
    identifierLabel: "यूज़रनेम / मोबाइल नंबर / ईमेल",
    identifierPlaceholder: "admin या 9876543210 या ईमेल",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "••••••••",
    enableBiometricLabel: "इस फोन पर फिंगरप्रिंट लॉगिन सक्षम करें",
    signInWithPassword: "पासवर्ड से साइन इन करें",
    authenticating: "सत्यापित हो रहा है...",
    quickDemoLogins: "त्वरित वन-क्लिक डेमो लॉगिन",
    shopOwner: "दुकान मालिक",
    staffRamesh: "स्टाफ (रमेश)",
    zeroLanPush: "जीरो-LAN पुश",
    fingerprintLogin: "फिंगरप्रिंट लॉगिन",
    pdfSlipEngine: "PDF स्लिप इंजन",
    invalidCredentials: "अमान्य विवरण। कृपया अपना यूज़रनेम, फोन या पासवर्ड जांचें।",
    biometricFailed: "फिंगरप्रिंट सत्यापन विफल रहा। आप पासवर्ड से लॉगिन कर सकते हैं।",

    // Navbar & Roles
    shopOwnerRole: "दुकान मालिक",
    staffRole: "स्टाफ",
    logout: "लॉगआउट",
    toggleTheme: "थीम बदलें",
    languageToggle: "English / हिंदी",

    // Navigation Tabs
    tabOverview: "अवलोकन और लाइव फीड",
    tabStaff: "कर्मचारी और दरें",
    tabAdvances: "अग्रिम (Advance) भुगतान",
    tabPayroll: "वेतन (Payroll) और PDF रिपोर्ट",
    tabDevice: "बायोमेट्रिक हार्डवेयर",
    tabMyToday: "आज की उपस्थिति",
    tabMyHistory: "उपस्थिति इतिहास",
    tabMyEarnings: "वेतन और अग्रिम",
    testSimulatorBtn: "पंच सिम्युलेटर",

    // Admin Overview
    kpiPresentToday: "आज उपस्थित कर्मचारी",
    kpiPresentSub: "वर्तमान में दुकान में मौजूद / कुल स्टाफ",
    kpiHoursToday: "आज दर्ज कुल घंटे",
    kpiHoursSub: "सक्रिय काम के कुल घंटे",
    kpiWageToday: "आज की अनुमानित मजदूरी",
    kpiWageSub: "प्रति घंटा दर के आधार पर आज की कमाई",
    kpiAdvancesMonth: "इस माह दिए गए अग्रिम",
    kpiAdvancesSub: "मासिक वेतन से कटने वाली अग्रिम राशि",
    hoursLoggedChartTitle: "आज के काम के घंटे और कमाई का ग्राफ",
    livePunchesTitle: "रियल-टाइम बायोमेट्रिक पंच फीड",
    noPunchesCaptured: "अभी तक कोई पंच नहीं मिला। Identix मशीन पर अपनी अंगुली लगाएं!",
    deviceSn: "सीरियल नं.",
    pin: "पिन",
    punchIn: "आगमन (IN)",
    punchOut: "प्रस्थान (OUT)",
    liveBadge: "लाइव",

    // Admin Staff Management
    staffManagementTitle: "कर्मचारी डायरेक्टरी और प्रति घंटा दरें",
    staffManagementSub: "कर्मचारियों की प्रति घंटा मजदूरी, बायोमेट्रिक पिन और मोबाइल ऐप एक्सेस सेट करें",
    addNewStaffBtn: "नया कर्मचारी जोड़ें",
    colStaffMember: "कर्मचारी का नाम",
    colBiometricPin: "बायोमेट्रिक पिन",
    colHourlyRate: "प्रति घंटा दर",
    colRole: "रोल",
    colAppLogin: "लॉगिन मोबाइल",
    colActions: "कार्यवाही",
    activeStaffBadge: "सक्रिय",
    inactiveStaffBadge: "निष्क्रिय",
    deleteStaffConfirm: "क्या आप वाकई इस कर्मचारी को हटाना चाहते हैं?",

    // Admin Advances & Extra Pay
    advancesManagementTitle: "माह के बीच दिए गए अग्रिम (Advance) का हिसाब",
    advancesManagementSub: "कैश या UPI से दिए गए अग्रिम दर्ज करें। यह महीने की सैलरी से स्वतः कट जाता है।",
    recordAdvanceBtn: "नया अग्रिम (Advance) दर्ज करें",
    colStaff: "कर्मचारी",
    colDate: "तारीख",
    colAmount: "रकम (₹)",
    colMode: "भुगतान माध्यम",
    colReasonNotes: "कारण / टिप्पणी",
    colDeduction: "प्रकार",
    deleteAdvanceConfirm: "क्या आप यह अग्रिम रिकॉर्ड हटाना चाहते हैं?",

    // Admin Payroll & Reports
    payrollTitle: "वेतन सारांश और तत्काल PDF स्लिप जनरेटर",
    payrollSub: "कोई भी तारीख सीमा चुनकर कुल काम के घंटे, अग्रिम कटौती और शुद्ध देय वेतन निकालें।",
    dateRangeLabel: "तारीख सीमा:",
    fromDateLabel: "प्रारंभिक तारीख",
    toDateLabel: "अंतिम तारीख",
    calcPayrollBtn: "वेतन की गणना करें",
    customRateOverrideLabel: "विशेष दर (₹/घंटा वैकल्पिक)",
    exportCsvBtn: "एक्सेल स्प्रेडशीट (CSV) डाउनलोड",
    kpiTotalHours: "कुल काम के घंटे",
    kpiGrossSalary: "कुल सकल वेतन (Gross)",
    kpiAdvancesDeducted: "अग्रिम कटौती (Advance Cut)",
    kpiNetPayable: "अंतिम शुद्ध देय वेतन (Net)",
    payoutDistributionTitle: "वेतन वितरण",
    payrollTableTitle: "कर्मचारी-वार वेतन और कटौती विवरण",
    colDaysPresent: "उपस्थित दिन",
    colGrossSalary: "सकल वेतन",
    colAdvanceCut: "अग्रिम कटौती",
    colNetTakeHome: "शुद्ध हाथ में (Net)",
    pdfSlipBtn: "PDF स्लिप",
    markPaidBtn: "भुगतान मार्क करें",
    markPaidSuccess: "भुगतान सफलतापूर्वक दर्ज किया गया",

    // Admin Biometric Hardware Tab
    hardwareTitle: "Identix बायोमेट्रिक टर्मिनल और क्लाउड पुश सेटिंग्स",
    hardwareSub: "मशीन बिना किसी लोकल ऑफिस LAN के सीधे HTTP Cloud ADMS पर काम करती है",
    launchHardwareSim: "हार्डवेयर सिम्युलेटर खोलें",
    physicalProfileTitle: "भौतिक हार्डवेयर प्रोफाइल",
    deviceModel: "डिवाइस मॉडल",
    serialNumber: "सीरियल नंबर (SN)",
    platformKernel: "प्लेटफ़ॉर्म और कर्नेल",
    pushServiceVersion: "पुश सर्विस वर्शन",
    protocolSupport: "प्रोटोकॉल सपोर्ट",
    admsCloudEnabled: "ADMS क्लाउड पुश सक्षम है",
    onDeviceSetupTitle: "मशीन के अंदर सेटिंग करने के निर्देश",
    onDeviceSetupSub: "अपनी भौतिक मशीन को इस क्लाउड बैकएंड से जोड़ने के लिए मशीन में ये सेटिंग्स डालें:",
    serverMode: "Server Mode",
    enableDomainName: "Enable Domain Name",
    serverAddress: "Server Address",
    serverPort: "Server Port",
    enableProxyServer: "Enable Proxy Server",

    // Employee Dashboard
    namasteGreeting: "नमस्ते",
    staffPinLabel: "स्टाफ पिन",
    hourlyRateLabel: "प्रति घंटा दर",
    downloadMonthPayslip: "मेरी इस महीने की सैलरी स्लिप (PDF) डाउनलोड करें",
    empTodayHours: "आज के कुल घंटे",
    empTodayEarning: "आज की कुल कमाई",
    empMonthTakeHome: "इस महीने का कुल वेतन",
    empTodayStatusTitle: "आज की बायोमेट्रिक उपस्थिति स्थिति",
    punchInArrival: "आगमन समय (Punch IN)",
    punchOutDeparture: "प्रस्थान समय (Punch OUT)",
    loggedHours: "काम के कुल घंटे",
    todayAccumulation: "आज की संचित कमाई",
    noPunchTodayMsg: "आपने आज अपनी उंगली मशीन पर नहीं लगाई है। अपनी शिफ्ट शुरू करने के लिए दुकान की मशीन पर उंगली लगाएं।",
    empAdvancesTitle: "माह के दौरान ली गई अग्रिम (Advance) राशि",
    empAdvancesSub: "यह राशि आपके महीने के अंतिम वेतन से घटा दी जाती है।",
    deductionBadge: "कटौती",
    empHistoryTitle: "मेरा हालिया उपस्थिति और काम के घंटों का इतिहास",
    colInTime: "आने का समय",
    colOutTime: "जाने का समय",
    colHoursWorked: "काम के घंटे",
    colEarned: "कमाई (₹)",
    noHistoryFound: "अभी तक कोई पिछला उपस्थिति रिकॉर्ड नहीं मिला।",

    // Staff Period Selection & Payslip
    selectPeriod: "अवधि चुनें:",
    thisMonth: "इस महीने",
    lastMonth: "पिछले महीने",
    twoMonthsAgo: "2 महीने पहले",
    customRange: "कस्टम तारीख",
    applyPeriodFilter: "हिसाब देखें",
    periodSummaryTitle: "चुनी गई अवधि का वेतन और घंटों का हिसाब",
    daysPresentCount: "काम के दिन",
    totalHoursCount: "कुल काम के घंटे",
    grossEarnedAmount: "सकल कमाई (Gross)",
    advanceCutAmount: "अग्रिम कटौती (Advance Cut)",
    netTakeHomeAmount: "शुद्ध मिलने वाला वेतन (Net)",
    downloadPeriodPdfBtn: "इस अवधि की सैलरी स्लिप (PDF) डाउनलोड करें",
    dayByDayTitle: "दैनिक उपस्थिति और समय (कब आए / कब गए)",
    inTimeLabel: "आने का समय (In Time)",
    outTimeLabel: "जाने का समय (Out Time)",
    hoursWorkedLabel: "काम के घंटे",
    dayEarningsLabel: "दिन की कमाई (₹)",
    statusLabel: "स्थिति",
    activeNowBadge: "अभी सक्रिय शिफ्ट",
    noRecordsForPeriod: "इस चुनी गई तारीख सीमा में कोई उपस्थिति रिकॉर्ड नहीं मिला।",

    // Modals
    addStaffTitle: "नया कर्मचारी जोड़ें",
    editStaffTitle: "कर्मचारी विवरण बदलें",
    recordAdvanceTitle: "नया अग्रिम (Advance) दर्ज करें",
    manualPunchModalTitle: "मैनुअल पंच एंट्री",
    deviceSimulatorTitle: "Identix बायोमेट्रिक मशीन सिम्युलेटर",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("hi"); // Default to Hindi or English based on user locale

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("identix_lang") as Language | null;
      if (saved === "en" || saved === "hi") {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("identix_lang", lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const fallbackDict = translations.en;
    if (fallbackDict && fallbackDict[key]) {
      return fallbackDict[key];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
