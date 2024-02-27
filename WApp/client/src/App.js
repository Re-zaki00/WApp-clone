import './App.css';
import io from 'socket.io-client';
import QRCode from "react-qr-code";
import { useState, useEffect } from 'react';

const socket = io.connect("http://localhost:3000/", {});

function App() {
  const [session, setSession] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [textMessage, setTextMessage] = useState("");

  const [showCreateSession, setShowCreateSession] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showWaitingMessage, setShowWaitingMessage] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);

  const createSessionForWhatsapp = () => {
    socket.emit("createSession", {
      id: session,
    });
  };

  const [id, setId] = useState("");

  useEffect(() => {
    socket.emit("connected", "Hello from client");

    socket.on("qr", (data) => {
      const { qr } = data;
      console.log("QR RECEIVED - data - ", data);
      console.log("QR RECEIVED - QR - ", qr);
      setQrCode(qr);
      setShowCreateSession(false);
      setShowQRCode(true);
    });

    socket.on("ready", (data) => {
      console.log(data);
      const { id } = data;
      setId(id);
      setShowQRCode(false);
      setShowWaitingMessage(true);
      setShowSendMessage(true);
    });

    return () => {
      socket.off("qr");
      socket.off("ready");
    };
  }, []);

  const handleDeleteSession = async () => {
    socket.emit('deleteSession', id);
  };

  const handleSendMessage = async () => {
    // Append @c.us to the contactNumber
    const formattedContactNumber = contactNumber + "@c.us";
    // Emit event to send message to server
    socket.emit('sendMessage', { id, formattedContactNumber, textMessage });
  };

  const handleGoBack = () => {
    // Reset component state to return to the "Create Session" phase
    setSession("");
    setQrCode("");
    setContactNumber("");
    setTextMessage("");
    setShowCreateSession(true);
    setShowQRCode(false);
    setShowWaitingMessage(false);
    setShowSendMessage(false);
  };

  return (
    <div className="App">
      <h1>Whatsapp Web JS Client</h1>
      <h2>Open Whatsapp and Scan Qr Code</h2>

      {showCreateSession && (
        <div>
          <h3>Please Enter a valid ID then Click Create Session!</h3>
          <input
            type="text"
            value={session}
            onChange={(e) => setSession(e.target.value)}
          />
          <button onClick={createSessionForWhatsapp}>Create Session</button>
        </div>
      )}

      {showQRCode && (
        <div>
          <h1>QR Code</h1>
          <QRCode value={qrCode} />
        </div>
      )}

      {showWaitingMessage && (
        <h3>Please Keep Waiting, Your Session is right here!</h3>
      )}

      {showSendMessage && (
        <div>
          <input
            type="tel" 
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{7}"
            placeholder="Enter Contact Number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Text Message"
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send Message</button>
          <div>
            <button onClick={handleGoBack}>Go Back</button>
            <button onClick={handleDeleteSession}>Delete Session</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
