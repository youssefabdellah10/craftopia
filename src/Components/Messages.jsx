import { useEffect, useState, useRef } from "react";
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const Messages = ({ responseId, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const chatRef = useRef(null);
    const inputRef = useRef(null);
    const token = localStorage.getItem("token");
    const [messageCount, setMessageCount] = useState(0);
    const prevMessageCount = useRef(0);


    const getConversationByResponseId = async (responseId) => {
        const res = await fetch(`http://localhost:3000/msg/conversation/${responseId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch conversation");
        return res.json();
    };
    const sendMessage = async ({ token, responseId, messageContent }) => {
        const res = await fetch(`http://localhost:3000/msg/send/${responseId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ messageContent }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to send message: ${res.statusText}: ${errorText}`);
        }

        return res.json();
    };

    useEffect(() => {
        let interval;
        const fetchMessages = async () => {
            try {
                const data = await getConversationByResponseId(responseId);
                const allMessages = data.data.messages;
                setMessageCount(data.data.messageCount || allMessages.length);

                const normalized = allMessages.map((msg) => ({
                    sender: msg.senderType,
                    senderName: msg.senderName,
                    messageContent: msg.messageContent,
                    attachmentUrl: msg.attachmentUrl,
                    timestamp: msg.createdAt,
                }));
                setMessages(normalized);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setLoading(false);
            }
        };

        if (responseId) {
            fetchMessages();
            interval = setInterval(fetchMessages, 1000);
        }

        return () => clearInterval(interval);
    }, [responseId, token]);


    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages, isMinimized]);

    const handleFileChange = (e) => {
        setAttachment(e.target.files[0]);
        inputRef.current.focus();
    };

    const containsPersonalData = (text) => {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i;
        const phoneRegex = /(\+?\d{1,4}?[-.\s]?(\(?\d{3}\)?|\d{3})[-.\s]?\d{3}[-.\s]?\d{4})/;
        const cardRegex = /\b(?:\d[ -]*?){13,16}\b/;
        return emailRegex.test(text) || phoneRegex.test(text) || cardRegex.test(text);
    };

    const handleSend = async () => {
        if (!newMessage.trim() && !attachment) return;
        if (containsPersonalData(newMessage)) {
            setShowWarning("Avoid sharing personal data like email, phone, or card numbers.");
            return;
        }

        setIsTyping(true);
        try {
            await sendMessage({ token, responseId, messageContent: newMessage, attachment });

            const updated = await getConversationByResponseId(responseId);
            const updatedMessages = updated.data.messages.map((msg) => ({
                sender: msg.senderType,
                senderName: msg.senderName,
                messageContent: msg.messageContent,
                attachmentUrl: msg.attachmentUrl,
                timestamp: msg.createdAt,
            }));

            setMessages(updatedMessages);
            setNewMessage("");
            setAttachment(null);
            setShowWarning(false);
        } catch (error) {
            console.error("Error sending message:", error);
            const match = error.message.match(/Bad Request:\s*(\{.*\})/);
            if (match && match[1]) {
                try {
                    const parsed = JSON.parse(match[1]);
                    if (parsed?.reason) {
                        setShowWarning(parsed.reason);
                    } else if (parsed?.message) {
                        setShowWarning(parsed.message);
                    } else {
                        setShowWarning("Message could not be sent.");
                    }
                } catch (parseErr) {
                    console.error("Failed to parse backend error JSON:", parseErr);
                    setShowWarning("Message could not be sent.");
                }
            } else {
                setShowWarning("Message could not be sent.");
            }
        }

    };


    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const toggleMinimize = () => {
        setIsMinimized((prev) => !prev);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 w-96 max-w-[95%] bg-white rounded-2xl shadow-xl flex flex-col z-50 overflow-hidden border border-gray-100"
        >
            <div className="bg-gray-100 text-black px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 3 }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FAD0C4] to-[#FFD1FF] shadow-md flex items-center justify-center text-white text-base font-bold border border-white/30"
                    >
                        👤
                    </motion.div>
                    <div>
                        <h2 className="text-sm font-bold tracking-wide">
                            <span className="bg-white/20 px-2 py-1 rounded-lg">✨Let’s Customize</span>
                        </h2>
                        <p className="text-xs text-black italic mt-1">Your Customization Journey Starts Here 🚀</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            📨 {messageCount} {messageCount === 1 ? "message" : "messages"}
                        </p>
                    </div>

                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleMinimize} className="p-1 rounded-full hover:bg-gray-300 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                            />
                        </svg>
                    </button>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-300 transition-colors">
                        <XMarkIcon className="h-5 w-5 text-black" />
                    </button>
                </div>
            </div>
            {!isMinimized && (
                <>
                    <div
                        ref={chatRef}
                        className="chat-scroll overflow-y-auto px-4 py-3 bg-gradient-to-b from-[#FAF9F6] to-[#F6EEEE] space-y-3"
                        style={{ maxHeight: "400px" }}
                    >
                        {loading ? (
                            <div className="flex justify-center items-center h-64 text-[#921A40] text-lg font-medium animate-pulse">
                                Loading...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-64 bg-gradient-to-r from-[#fdf2f8] to-[#fce7f3] rounded-xl shadow-sm border border-pink-200 p-6 text-center animate-fade-in">
                                <svg
                                    className="w-14 h-14 text-[#921A40] mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                                    />
                                </svg>
                                <h2 className="text-xl font-semibold text-[#921A40] mb-1">No Messages Yet</h2>
                                <p className="text-sm text-gray-600">Messages you receive will show up here.</p>
                            </div>
                        ) : (

                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.sender === "artist" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className="flex flex-col max-w-[80%]">
                                            <div
                                                className={`text-[10px] font-semibold mb-1 px-2 py-[2px] rounded-full w-fit ${msg.sender === "artist"
                                                    ? "bg-[#f7ccd1] text-[#921A40]"
                                                    : "bg-gray-200 text-gray-700"
                                                    }`}
                                            >
                                                {msg.senderName || (msg.sender === "artist" ? "Artist" : "Customer")}
                                            </div>
                                            <div
                                                className={`relative px-4 py-2 rounded-xl text-sm shadow-sm ${msg.sender === "artist"
                                                    ? "bg-white text-[#921A40] border border-[#f3c4ca] self-end"
                                                    : "bg-white text-gray-800 border border-gray-200 self-start"
                                                    }`}
                                            >
                                                <div className="whitespace-pre-wrap">{msg.messageContent}</div>
                                                {msg.attachmentUrl && (
                                                    <a
                                                        href={msg.attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
                                                    >
                                                        <PaperClipIcon className="h-3 w-3" />
                                                        View Attachment
                                                    </a>
                                                )}
                                                <div
                                                    className={`text-xs opacity-70 mt-1 text-right ${msg.sender === "artist"
                                                        ? "text-[#921A40]/70"
                                                        : "text-gray-500"
                                                        }`}
                                                >
                                                    {formatTime(msg.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-white">
                        <AnimatePresence>
                            {showWarning && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-2 text-sm text-[#921A40] bg-[#fbeaec] border border-[#f3c4ca] rounded-lg px-4 py-2 flex justify-between items-center"
                                >
                                    ⚠️ {showWarning}
                                    <button
                                        onClick={() => setShowWarning(false)}
                                        className="ml-3 font-bold"
                                    >
                                        OK
                                    </button>
                                </motion.div>
                            )}

                        </AnimatePresence>

                        {attachment && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mb-2 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    <PaperClipIcon className="h-4 w-4 text-gray-500" />
                                    <span className="text-xs truncate max-w-[180px]">
                                        {attachment.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setAttachment(null)}
                                    className="text-gray-400 hover:text-[#921A40]"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </motion.div>
                        )}

                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full px-4 py-2 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#921A40]/50 bg-gray-50 placeholder-gray-400 pr-20"
                                />
                                <div className="absolute right-10 top-2">
                                    <label className="cursor-pointer text-gray-400 hover:text-[#921A40] transition-colors">
                                        <input type="file" className="hidden" onChange={handleFileChange} />
                                        <PaperClipIcon className="h-5 w-5" />
                                    </label>
                                </div>
                            </div>
                            <motion.button
                                onClick={handleSend}
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                disabled={!newMessage.trim() && !attachment}
                                className={`transition-all duration-200 ease-in-out p-2 rounded-full ${newMessage.trim() || attachment
                                    ? "bg-gradient-to-r from-[#921A40] to-[#E07385] text-white"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                aria-label="Send message"
                            >
                                <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
                            </motion.button>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
};

export default Messages;
