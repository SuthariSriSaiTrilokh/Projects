import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function App() {
  const [file, setFile] = useState(null);
  const [code, setCode] = useState('');
  const [retrievedUrl, setRetrievedUrl] = useState('');
  const [uploadedCode, setUploadedCode] = useState('');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert('Please select a file.');

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploadedCode(data.code);
      setRetrievedUrl(data.url);
      setCode(data.code); // auto-fill code input
      alert(`Uploaded! Code: ${data.code}`);
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  };

  const handleGetPhoto = async () => {
    if (!code) return alert('Please enter a code.');

    try {
      const res = await fetch(`http://localhost:5000/api/photos/${code}`);
      if (!res.ok) throw new Error('Invalid code');

      const data = await res.json();
      setRetrievedUrl(data.url);
      socket.emit('join', code);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendMessage = () => {
    if (message && code) {
      socket.emit('sendMessage', { code, message });
      setChatMessages(prev => [...prev, { sender: 'You', message }]);
      setMessage('');
    }
  };

  useEffect(() => {
    socket.on('receiveMessage', ({ sender, message }) => {
      setChatMessages(prev => [...prev, { sender, message }]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#b37a7a', height: '100vh' }}>
      <h1>📷 Photo Share & Chat App</h1>

      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} style={{ marginLeft: '10px' }}>Upload</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <input
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button onClick={handleGetPhoto} style={{ marginLeft: '10px' }}>Get Photo</button>
      </div>

      {retrievedUrl && (
        <div style={{ marginTop: '20px' }}>
          <p>Shared</p>
          <a href={retrievedUrl} download>
            <button>Download</button>
          </a>
          <br />
          <img src={retrievedUrl} alt="Shared" style={{ width: '200px', marginTop: '10px' }} />
        </div>
      )}

      {code && (
        <div style={{ marginTop: '30px' }}>
          <h3>💬 Chat Room for Code: {code}</h3>
          <div style={{ border: '1px solid gray', padding: '10px', height: '200px', overflowY: 'scroll', background: '#f5f5f5' }}>
            {chatMessages.map((msg, i) => (
              <div key={i}><strong>{msg.sender}:</strong> {msg.message}</div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ width: '70%', marginTop: '10px' }}
          />
          <button onClick={handleSendMessage} style={{ marginLeft: '10px' }}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;
