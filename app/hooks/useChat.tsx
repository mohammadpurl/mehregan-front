/**
 * چت‌بات فرودگاه (آواتار / QR) — برای فرم‌های ERP از `app/hooks/useVoiceToText` استفاده کنید.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { extractPassengerDataWithOpenAI, introduction, saveConversation, saveTrip, sendUserMessage } from "@/services/api"; 
import { Message, MessageSender, Passenger, TicketInfo } from "@/types/type";

// Language type definition
export type Language = "fa" | "en";

/**
 * ChatContextType provides all chat-related state and actions for consumers.
 */
interface ChatContextType {
  // Messages
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  lastAvatarMessage: Message | null;
  
  // Chat functionality
  chat: (msg: string) => Promise<void>;
  getIntroduction :() => Promise<void>;
  onMessagePlayed: () => void;
  
  // Language management
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // UI states
  loading: boolean;
  cameraZoomed: boolean;
  setCameraZoomed: (v: boolean) => void;
  
  // QR Code states
  showQRCode: boolean;
  setShowQRCode: (v: boolean) => void;
  qrCodeImage: string;
  setQrCodeImage: (v: string) => void;
  tripId: string | null;
  setTripId: (v: string | null) => void;
  
  // Voice states
  isListening: boolean;
  setIsListening: (v: boolean) => void;
  isUserTalking: boolean;
  setIsUserTalking: (v: boolean) => void;
  isAvatarTalking: boolean;
  setIsAvatarTalking: (v: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  
  // Session management
  sessionId: string | null;
  isSessionActive: boolean;
  startSession: () => void;
  endSession: () => void;
  
  // Utility functions
  handleEndMessage: () => void;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * ChatProvider wraps your app and provides chat state and actions via context.
 */
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // اضافه کردن قفل برای مدیریت درخواست‌ها
  const requestLockRef = useRef(false);
  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);

  const [lastAvatarMessage, setLastAvatarMessage] = useState<Message | null>(null);
  
  // Language state
  const [language, setLanguage] = useState<Language>("fa");
  
  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraZoomed, setCameraZoomed] = useState<boolean>(true);
  
  // QR Code states
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>(""); // Default QR code image
  const [tripId, setTripId] = useState<string | null>(null);
  // Debug: observe QR state changes and expose for manual inspection
  useEffect(() => {
    console.log('[QR-STATE] showQRCode:', showQRCode, 'qrCodeImage:', qrCodeImage);
    if (typeof window !== 'undefined') {
      (window as unknown as { __qrDebug?: unknown }).__qrDebug = {
        get state() {
          return { showQRCode, qrCodeImage, tripId };
        },
        forceLocation(src: string) {
          setQrCodeImage(src);
          setShowQRCode(true);
        },
        forceBooking(id: string) {
          setQrCodeImage('');
          setTripId(id);
          setShowQRCode(true);
        },
        hide() { setShowQRCode(false); }
      };
    }
  }, [showQRCode, qrCodeImage, tripId]);
  
  // Voice states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isUserTalking, setIsUserTalking] = useState<boolean>(false);
  const [isAvatarTalking, setIsAvatarTalking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  // Timeout refs
  const noResponseTimerRef = useRef<number | null>(null);
  const qrTimerRef = useRef<number | null>(null);
  const userInactivityTimerRef = useRef<number | null>(null);

  // Mapping of location keywords to QR images under public/locations
  // Add or edit entries to support more locations.
  const qrLocationMappings: Array<{ keywords: string[]; image: string }> = [
    { keywords: ["duty free", "دیوتی فری", "دیوتی", "free shop", "فروشگاه","shop", "store", "retail", "gift shop"], image: "/locations/duty free.jpeg" },
    { keywords: ["نمازخانه", "محل عبادت","prayer room", "chapel", "mosque"], image: "/locations/Namaz.jpeg" },
    { keywords: ["سرویس بهداشتی", "دستشویی", "توالت","restroom", "bathroom", "toilet", "washroom"], image: "/locations/Wc.jpeg" },
    { keywords: ["اتاق سیگار", "محل سیگار", "اتاق کشیدن سیگار","smoking room", "smoking area", "smoking lounge"], image: "/locations/smoke launge.jpeg" },
    { keywords: ["سالن ترانزیت", "سالن انتظار", "لانج ترانزیت","transit lounge", "lounge", "waiting area"], image: "/locations/Exit salon.jpeg" },
    { keywords: ["کال سنتر", "مرکز تماس", "پشتیبانی","call center", "contact center", "help desk"], image: "/locations/Vbb.jpeg" },



  ];

  const findQrImageForMessage = (text: string): string | null => {
    const t = text.toLowerCase();
    for (const mapping of qrLocationMappings) {
      if (mapping.keywords.some(k => t.includes(k.toLowerCase()))) {
        return mapping.image;
      }
    }
    return null;
  };

  // Function to check if avatar message contains "کیو آر کد"
  const checkForQRCodeTrigger = async (messageText: string) => {
    const qrCodeKeywords = ["کیو آر کد", "QR کد", "کیوآر کد", "QR Code", "qrcode", "qr code"];
    const locationKeywords = ["نمازخانه", "WC", "دستشویی", "کالسنتر", "اتاق سیگار", "smoke lounge", "smoke room", "duty free", "فروشگاه", "shop", "store", "retail", "gift shop","transit lounge", "lounge", "waiting area","سالن ترانزیت"];
    
    const containsQRCode = qrCodeKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const containsLocation = locationKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword.toLowerCase())
    );
    debugger;
    // Priority 1: explicit or implicit location request with a known mapping
    const mappedImage = findQrImageForMessage(messageText);
    if(containsLocation || mappedImage) {
      setQrCodeImage(mappedImage || "/locations/Vbb.jpeg");
      setShowQRCode(true);
      startQrTimer();
    }
    else if (containsQRCode && !containsLocation) {
      console.log("QR Code triggered by avatar message:", messageText);
      
      debugger;
      extractPassengerDataWithOpenAI(messages)
        .then(async (data) => {
          // تبدیل داده به فرمت مورد نیاز
          // نرمال‌سازی travelType برای API: فقط 'departure' یا 'arrival' مجاز است
          const normalizeTravelType = (v?: string): "departure" | "arrival" | undefined => {
            if (!v) return undefined;
            const t = String(v).trim().toLowerCase();
            // فارسی و انگلیسی رایج
            if (["departure", "depart", "out", " خروج", "خروج", "خروجی", "پرواز خروجی"].some(k => t.includes(k.trim()))) return "departure";
            if (["arrival", "arrive", "in", " ورود", "ورود", "ورودی", "پرواز ورودی"].some(k => t.includes(k.trim()))) return "arrival";
            return undefined;
          };

          const normalizedTravelType = normalizeTravelType(data.travelType);
          const tripData: TicketInfo = {
            airportName: data.airportName,
            travelType: normalizedTravelType,
            travelDate: data.travelDate,
            passengerCount: String(data.passengerCount || ""),
            flightNumber: data.flightNumber,
            flightType: data.flightType,
            additionalInfo: data.additionalInfo,
            buyer_phone: data.buyer_phone,
            buyer_email: data.buyer_email,
            passengers: (data.passengers || []).map((p: Passenger) => ({
              name: p.name,
              lastName: p.lastName ?? "",
              nationalId: p.nationalId,            
              passportNumber: p.passportNumber,
              luggageCount: p.luggageCount ?? "",
              passengerType: p.passengerType, // "adult" | "infant"
              gender: p.gender,
            })),
          };
          debugger;
          const saved = await saveTrip(tripData);
          console.log("Saved trip data:", saved);

          if (saved && saved.id) {
            console.log("Setting tripId to:", saved.id);
            setTripId(saved.id);
            setShowQRCode(true);
            startQrTimer();
            clearMessages();
          } else {
            console.error("Saved trip data is missing id:", saved);
            // Generate a temporary ID for testing
            const tempId = `temp_${Date.now()}`;
            console.log("Using temporary tripId:", tempId);
            setTripId(tempId);
            setShowQRCode(true);
            startQrTimer();
            clearMessages();
          }
        })
        .catch(async (err) => {
          console.error("Failed to extract passenger data:", err);
          
          // ساخت داده خالی
          const emptyTripData = {
            airportName: "",
            travelDate: "",
            flightNumber: "",
            buyer_phone: "",
            buyer_email: "",
            passengers: [],
          };
          
          try {
            const saved = await saveTrip(emptyTripData);
            if (saved && saved.id) {
              console.log("Saved empty trip data with id:", saved.id);
              setTripId(saved.id);
            } else {
              // Generate a temporary ID for testing
              const tempId = `temp_${Date.now()}`;
              console.log("Using temporary tripId for empty data:", tempId);
              setTripId(tempId);
            }
          } catch (saveError) {
            console.error("Failed to save empty trip data:", saveError);
            // Generate a temporary ID as last resort
            const tempId = `temp_${Date.now()}`;
            console.log("Using temporary tripId as fallback:", tempId);
            setTripId(tempId);
          }
          
          setShowQRCode(true);
        
          startQrTimer();
          clearMessages();
        });
    }
  };

  const getIntroduction = async () => {
    // تنظیم قفل
    requestLockRef.current = true;
    setIsProcessing(true);
    setLoading(true);
    try{
      // intro endpoint does not require session_id; allow calling even if session state hasn't propagated yet
      const introData = await introduction(language)
      const resp = introData.messages;
      
      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        text: resp[0].text,
        audio: resp[0].audio,
        lipsync: resp[0].lipsync,
        facialExpression: resp[0].facialExpression,
        animation: resp[0].animation,
        sender: MessageSender.AVATAR
      };

      if(resp[0].audio) {
        setIsAvatarTalking(true);
      }
      else {
        setIsAvatarTalking(false);
      }
      setMessages((prev: Message[]) => [...prev,  newAssistantMessage]);
      setLastAvatarMessage(newAssistantMessage); // به‌روزرسانی مستقیم برای جلوگیری از تأخیر
      setIsAvatarTalking(!!resp[0].audio);
      
      
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setLoading(false);
      setIsProcessing(false);
      requestLockRef.current = false; // آزاد کردن قفل
    }

  }
  // Chat function
  const chat = async (msg: string) => {
    
    // اگر در حال پردازش هستیم، پیام جدید را نادیده بگیر
    if (isProcessing) {
      console.log("Chat: Ignoring message - already processing:", msg);
      return;
    }
    // بررسی قفل درخواست
    if (requestLockRef.current) {
      console.log("Chat: Ignoring message - request lock active:", msg);
      return;
    }

    // Reset inactivity timer on user activity
    clearUserInactivityTimer();
    // تنظیم قفل
    requestLockRef.current = true;
    setIsProcessing(true);
    setLoading(true);
    try {
      const userMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: msg,
        sender: MessageSender.CLIENT
      };
      
      setMessages((prev: Message[]) => [...prev, userMessage]);
      // Restart inactivity timer waiting for the next user message after bot reply
      startUserInactivityTimer();

      if (!sessionId) {
        throw new Error("No active session");
      }
      
      // Start a 2-minute timeout in case no avatar response comes back
      startNoResponseTimer();

      const data = await sendUserMessage(msg, sessionId, language); 
      const resp = data.messages;
      
      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        text: resp[0].text,
        audio: resp[0].audio,
        lipsync: resp[0].lipsync,
        facialExpression: resp[0].facialExpression,
        animation: resp[0].animation,
        sender: MessageSender.AVATAR
      };

      if(resp[0].audio) {
        setIsAvatarTalking(true);
      }
      else {
        setIsAvatarTalking(false);
      }
      setMessages((prev: Message[]) => [...prev,  newAssistantMessage]);
      setLastAvatarMessage(newAssistantMessage); // به‌روزرسانی مستقیم برای جلوگیری از تأخیر
      setIsAvatarTalking(!!resp[0].audio);
      // Avatar responded; cancel the no-response timeout
      clearNoResponseTimer();
      
      // Check if avatar message contains QR code trigger
      checkForQRCodeTrigger(resp[0].text);
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setLoading(false);
      setIsProcessing(false);
      requestLockRef.current = false; // آزاد کردن قفل
    }

  };

  const onMessagePlayed = () => {
    // Don't remove messages - just reset talking state
    setIsAvatarTalking(false);
    setIsProcessing(false);
    requestLockRef.current = false; // اطمینان از آزاد شدن قفل
    console.log("Chat: Message played, ready for next message");
  };
    const handleEndMessage = useCallback(() => {
      // setIsAvatarTalking(false);
      setIsUserTalking(false);
      setIsListening(false);
    }, []);

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);
  const clearMessages = useCallback(async () => {
    setMessages([]);
    await saveConversation(messages);
  }, [messages]);
  
  // Timer helpers
  const clearNoResponseTimer = useCallback(() => {
    if (noResponseTimerRef.current) {
      clearTimeout(noResponseTimerRef.current);
      noResponseTimerRef.current = null;
    }
  }, []);

  const startNoResponseTimer = useCallback(() => {
    clearNoResponseTimer();
    noResponseTimerRef.current = window.setTimeout(async () => {
      try {
        await clearMessages();
      } finally {
        endSession();
      }
    }, 5 * 60 * 1000);
  }, [clearNoResponseTimer, clearMessages]);

  // User inactivity timer: end session if no user message for 5 minutes
  const clearUserInactivityTimer = useCallback(() => {
    if (userInactivityTimerRef.current) {
      clearTimeout(userInactivityTimerRef.current);
      userInactivityTimerRef.current = null;
    }
  }, []);

  const startUserInactivityTimer = useCallback(() => {
    clearUserInactivityTimer();
    userInactivityTimerRef.current = window.setTimeout(() => {
      endSession();
    }, 5 * 60 * 1000);
  }, [clearUserInactivityTimer]);

  const clearQrTimer = useCallback(() => {
    if (qrTimerRef.current) {
      clearTimeout(qrTimerRef.current);
      qrTimerRef.current = null;
    }
  }, []);

  const startQrTimer = useCallback(() => {
    clearQrTimer();
    qrTimerRef.current = window.setTimeout(async () => {
      try {
        await clearMessages();
      } finally {
        endSession();
      }
    }, 5 * 60 * 1000);
  }, [clearQrTimer, clearMessages]);
  
  // Session management functions
  const startSession = async () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    setIsSessionActive(true);
    setMessages([]); // پاک کردن پیام‌های قبلی
    setShowQRCode(false); // Reset QR code state
    setQrCodeImage(""); // Reset QR code image
    setTripId(null); // Reset trip ID
    console.log("Chat: Started new session:", newSessionId);
    // Start inactivity timer waiting for first user message
    startUserInactivityTimer();
  };
  
  const endSession = () => {
    // Clear pending timers
    if (noResponseTimerRef.current) {
      clearTimeout(noResponseTimerRef.current);
      noResponseTimerRef.current = null;
    }
    if (qrTimerRef.current) {
      clearTimeout(qrTimerRef.current);
      qrTimerRef.current = null;
    }
    if (userInactivityTimerRef.current) {
      clearTimeout(userInactivityTimerRef.current);
      userInactivityTimerRef.current = null;
    }
    setSessionId(null);
    setIsSessionActive(false);
    setMessages([]);
    setIsProcessing(false);
    setIsAvatarTalking(false);
    setShowQRCode(false); // Reset QR code state
    setQrCodeImage(""); // Reset QR code image
    setTripId(null); // Reset trip ID
    requestLockRef.current = false;
    console.log("Chat: Ended session");
  };

  // Update lastAvatarMessage when messages change
  useEffect(() => {
    console.log("ChatContext: messages changed", messages);
    if (messages?.length > 0) {
      if(messages[messages?.length - 1].sender === MessageSender.AVATAR) {
        console.log("ChatContext: Setting last avatar message", messages[messages?.length - 1]);
        setLastAvatarMessage(messages[messages?.length - 1]);
      }
    } else {
      setLastAvatarMessage(null);
    }
  }, [messages]);


  

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        lastAvatarMessage,
        chat,
        getIntroduction,
        onMessagePlayed,
        language,
        setLanguage,
        loading,
        cameraZoomed,
        setCameraZoomed,
        isListening,
        setIsListening,
        isUserTalking,
        setIsUserTalking,
        isAvatarTalking,
        setIsAvatarTalking,
        isProcessing,
        setIsProcessing,
        sessionId,
        isSessionActive,
        startSession,
        endSession,
        handleEndMessage,
        addMessage,
        clearMessages,
        showQRCode,
        setShowQRCode,
        qrCodeImage,
        setQrCodeImage,
        tripId,
        setTripId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

/**
 * useChatContext provides access to the chat context.
 */
export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within a ChatProvider");
  return ctx;
}; 