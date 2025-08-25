import React, { useState } from "react";
import "./App.css";

function App() {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicPem, setPublicPem] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string>("");

  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyPublicPem, setVerifyPublicPem] = useState<string>("");
  const [verifySignature, setVerifySignature] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<string>("");

  // Interactive states
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // --- Utils ---
  async function exportPublicKey(key: CryptoKey) {
    const spki = await window.crypto.subtle.exportKey("spki", key);
    const b64 = window.btoa(String.fromCharCode(...new Uint8Array(spki)));
    const body = b64.match(/.{1,64}/g)?.join("\n");
    return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
  }

  async function importPublicKey(pem: string) {
    const body = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\s+/g, "");
    const binary = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey(
      "spki",
      binary.buffer,
      { name: "RSA-PSS", hash: "SHA-256" },
      true,
      ["verify"]
    );
  }

  async function signFile(f: File) {
    if (!privateKey) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const sig = await crypto.subtle.sign(
      { name: "RSA-PSS", saltLength: 32 },
      privateKey,
      bytes
    );
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  async function verifyFileWithKey(
    f: File,
    sig: string,
    pubPem: string
  ): Promise<boolean> {
    try {
      const pubKey = await importPublicKey(pubPem);
      const bytes = new Uint8Array(await f.arrayBuffer());
      const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
      return await crypto.subtle.verify(
        { name: "RSA-PSS", saltLength: 32 },
        pubKey,
        sigBytes,
        bytes
      );
    } catch {
      return false;
    }
  }

  // Copy to clipboard function
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  // --- Actions ---
  async function handleGenerateKeys() {
    setIsGeneratingKeys(true);
    try {
      const kp = await crypto.subtle.generateKey(
        {
          name: "RSA-PSS",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["sign", "verify"]
      );
      setPrivateKey(kp.privateKey);
      setPublicPem(await exportPublicKey(kp.publicKey));
      
      // Add success animation
      setTimeout(() => {
        const button = document.querySelector('.generate-btn');
        if (button) {
          button.classList.add('success-pulse');
          setTimeout(() => {
            button.classList.remove('success-pulse');
          }, 1000);
        }
      }, 100);
    } catch (error) {
      console.error('Error generating keys:', error);
    } finally {
      setIsGeneratingKeys(false);
    }
  }

  async function handleSign() {
    if (!file) return;
    setIsSigning(true);
    try {
      const sig = await signFile(file);
      if (sig) {
        setSignature(sig);
        // Add success animation
        setTimeout(() => {
          const signatureArea = document.querySelector('.signature-area');
          if (signatureArea) {
            signatureArea.classList.add('success-bounce');
            setTimeout(() => {
              signatureArea.classList.remove('success-bounce');
            }, 1000);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error signing file:', error);
    } finally {
      setIsSigning(false);
    }
  }

  async function handleVerify() {
    if (!verifyFile || !verifyPublicPem || !verifySignature) return;
    setIsVerifying(true);
    try {
      const valid = await verifyFileWithKey(
        verifyFile,
        verifySignature,
        verifyPublicPem
      );
      setVerifyResult(valid ? "✅ Valid Signature" : "❌ Invalid Signature");
      
      // Add result animation
      setTimeout(() => {
        const resultElement = document.querySelector('.verify-result');
        if (resultElement) {
          resultElement.classList.add('success-pulse');
          setTimeout(() => {
            resultElement.classList.remove('success-pulse');
          }, 2000);
        }
      }, 100);
    } catch (error) {
      setVerifyResult("❌ Error during verification");
    } finally {
      setIsVerifying(false);
    }
  }

  function downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    // Add download animation
    const downloadBtn = document.querySelector(`[data-download="${filename}"]`);
    if (downloadBtn) {
      downloadBtn.classList.add('success-pulse');
      setTimeout(() => {
        downloadBtn.classList.remove('success-pulse');
      }, 1000);
    }
  }

  // File drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, setFileFunction: (file: File | null) => void) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFileFunction(files[0]);
    }
  };

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <span>🔏</span>
            </div>
            <div>
              <h1 className="header-title">RSA Digital Signature</h1>
              <p className="header-subtitle">Secure • Interactive • Real-time</p>
            </div>
          </div>
          <div className="status-dots">
            <div className="status-dot"></div>
            <div className="status-dot"></div>
            <div className="status-dot"></div>
          </div>
        </div>
      </header>

      {/* Main Split Screen */}
      <div className="main-container">
        {/* Left Panel - Signer */}
        <div className="panel panel-left">
          <div className="panel-content">
            {/* Panel Header */}
            <div className="panel-header">
              <div className="panel-icon">
                <span>👤</span>
              </div>
              <div>
                <h2 className="panel-title">Digital Signer</h2>
                <p className="panel-subtitle">Create and manage digital signatures</p>
              </div>
              <div className="panel-status"></div>
            </div>

            {/* Key Generation Section */}
            <div className="section section-blue">
              <div className="section-header">
                <div className="section-icon">
                  <span>🔑</span>
                </div>
                <div>
                  <h3 className="section-title">Generate RSA Key Pair</h3>
                  <p className="section-subtitle">Create your unique cryptographic keys for signing</p>
                </div>
              </div>
              <div className="tip-box">
                <p className="tip-text">💡 <strong>Tip:</strong> Generate keys first before signing any files. Your private key stays secure in your browser.</p>
              </div>
              <button
                onClick={handleGenerateKeys}
                disabled={isGeneratingKeys}
                className={`btn btn-primary generate-btn ${isGeneratingKeys ? 'loading' : ''}`}
              >
                {isGeneratingKeys ? (
                  <span className="loading">
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"/>
                    </svg>
                    <span className="loading-text">🔄 Generating Secure Keys...</span>
                  </span>
                ) : (
                  '🚀 Generate RSA Key Pair'
                )}
              </button>
            </div>

            {/* Public Key Display */}
            {publicPem && (
              <div className="section section-green signature-area">
                <div className="section-header">
                  <div className="section-icon">
                    <span>🔓</span>
                  </div>
                  <div>
                    <h3 className="section-title">Public Key Generated!</h3>
                    <p className="section-subtitle">Share this key with others for verification</p>
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={() => copyToClipboard(publicPem)}
                    className="btn btn-small btn-copy"
                  >
                    📋 Copy Key
                  </button>
                  <button
                    onClick={() => downloadFile("public.pem", publicPem)}
                    data-download="public.pem"
                    className="btn btn-small btn-download"
                  >
                    💾 Download
                  </button>
                </div>
                <div className="tip-box">
                  <p className="tip-text">✅ <strong>Success!</strong> Your RSA key pair has been generated. The public key is shown above.</p>
                </div>
                <textarea
                  className="textarea textarea-green"
                  rows={8}
                  value={publicPem}
                  readOnly
                />
              </div>
            )}

            {/* File Upload Section */}
            <div className="section section-purple">
              <div className="section-header">
                <div className="section-icon">
                  <span>📁</span>
                </div>
                <div>
                  <h3 className="section-title">Choose File to Sign</h3>
                  <p className="section-subtitle">Select any file you want to digitally sign</p>
                </div>
              </div>
              <div className="tip-box">
                <p className="tip-text">📝 <strong>Step 2:</strong> Choose a file to sign. You can drag & drop or click to browse.</p>
              </div>
              <div
                className={`file-upload ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setFile)}
              >
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="file-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <div className="file-icon">📄</div>
                  <p className="file-text">
                    {file ? `✅ Selected: ${file.name}` : 'Click to select or drag & drop a file'}
                  </p>
                  <p className="file-info">
                    {file ? `📊 Size: ${(file.size / 1024).toFixed(2)} KB` : 'Supports any file type'}
                  </p>
                </label>
              </div>
              
              {file && (
                <button
                  onClick={handleSign}
                  disabled={isSigning || !privateKey}
                  className={`btn btn-secondary ${isSigning ? 'loading' : ''}`}
                >
                  {isSigning ? (
                    <span className="loading">
                      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"/>
                    </svg>
                      <span className="loading-text">🔄 Creating Digital Signature...</span>
                    </span>
                  ) : (
                    '🔏 Sign File'
                  )}
                </button>
              )}
            </div>

            {/* Signature Display */}
            {signature && (
              <div className="section section-yellow">
                <div className="section-header">
                  <div className="section-icon">
                    <span>✍️</span>
                  </div>
                  <div>
                    <h3 className="section-title">Digital Signature Created!</h3>
                    <p className="section-subtitle">Your file has been successfully signed</p>
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    onClick={() => copyToClipboard(signature)}
                    className="btn btn-small btn-copy"
                  >
                    📋 Copy Signature
                  </button>
                  <button
                    onClick={() => downloadFile("signature.sig", signature)}
                    data-download="signature.sig"
                    className="btn btn-small btn-download"
                  >
                    💾 Download
                  </button>
                </div>
                <div className="tip-box">
                  <p className="tip-text">🎉 <strong>Success!</strong> Your file has been digitally signed. Share the signature with others for verification.</p>
                </div>
                <textarea
                  className="textarea textarea-yellow"
                  rows={6}
                  value={signature}
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Verifier */}
        <div className="panel panel-right">
          <div className="panel-content">
            {/* Panel Header */}
            <div className="panel-header">
              <div className="panel-icon">
                <span>🔍</span>
              </div>
              <div>
                <h2 className="panel-title">Signature Verifier</h2>
                <p className="panel-subtitle">Verify digital signatures and authenticity</p>
              </div>
              <div className="panel-status"></div>
            </div>

            {/* File Upload */}
            <div className="section section-blue">
              <div className="section-header">
                <div className="section-icon">
                  <span>📄</span>
                </div>
                <div>
                  <h3 className="section-title">File to Verify</h3>
                  <p className="section-subtitle">Select the file that was signed</p>
                </div>
              </div>
              <div className="tip-box">
                <p className="tip-text">🔍 <strong>Step 1:</strong> Upload the original file that was signed. This must be the exact same file.</p>
              </div>
              <div
                className={`file-upload ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setVerifyFile)}
              >
                <input
                  type="file"
                  onChange={(e) => setVerifyFile(e.target.files?.[0] || null)}
                  className="file-input"
                  id="verify-file-upload"
                />
                <label htmlFor="verify-file-upload">
                  <div className="file-icon">📋</div>
                  <p className="file-text">
                    {verifyFile ? `✅ Selected: ${verifyFile.name}` : 'Click to select or drag & drop a file'}
                  </p>
                </label>
              </div>
            </div>

            {/* Signature Input */}
            <div className="section section-purple">
              <div className="section-header">
                <div className="section-icon">
                  <span>✍️</span>
                </div>
                <div>
                  <h3 className="section-title">Digital Signature</h3>
                  <p className="section-subtitle">Paste the signature you received</p>
                </div>
              </div>
              <div className="tip-box">
                <p className="tip-text">📝 <strong>Step 2:</strong> Paste the Base64 signature that was created by the signer.</p>
              </div>
              <textarea
                className="textarea textarea-purple"
                rows={4}
                value={verifySignature}
                onChange={(e) => setVerifySignature(e.target.value)}
                placeholder="Paste the Base64 signature here..."
              />
            </div>

            {/* Public Key Input */}
            <div className="section section-green">
              <div className="section-header">
                <div className="section-icon">
                  <span>🔓</span>
                </div>
                <div>
                  <h3 className="section-title">Public Key (PEM)</h3>
                  <p className="section-subtitle">Paste the signer's public key</p>
                </div>
              </div>
              <div className="tip-box">
                <p className="tip-text">🔑 <strong>Step 3:</strong> Paste the public key from the person who signed the file.</p>
              </div>
              <textarea
                className="textarea textarea-green"
                rows={8}
                value={verifyPublicPem}
                onChange={(e) => setVerifyPublicPem(e.target.value)}
                placeholder="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"
              />
            </div>

            {/* Verify Button */}
            <div className="text-center">
              <div className="tip-box">
                <p className="tip-text">🔍 <strong>Step 4:</strong> Click verify to check if the signature is authentic and the file hasn't been tampered with.</p>
              </div>
              <button
                onClick={handleVerify}
                disabled={isVerifying || !verifyFile || !verifySignature || !verifyPublicPem}
                className={`btn btn-verify ${isVerifying ? 'loading' : ''}`}
              >
                {isVerifying ? (
                  <span className="loading">
                    <svg className="spinner" width="24" height="24" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"/>
                    </svg>
                      <span className="loading-text">🔄 Verifying Signature...</span>
                    </span>
                  ) : (
                    '🔍 Verify Signature'
                  )}
                </button>
            </div>

            {/* Verification Result */}
            {verifyResult && (
              <div className={`verify-result ${verifyResult.includes("Valid") ? 'valid' : 'invalid'} verify-result`}>
                <p className={`result-text ${verifyResult.includes("Valid") ? 'valid' : 'invalid'}`}>
                  {verifyResult}
                </p>
                <p className="result-description">
                  {verifyResult.includes("Valid") 
                    ? "The signature is authentic and the file hasn't been tampered with." 
                    : "The signature verification failed. The file may have been modified or the signature is invalid."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copied Message Toast */}
      {showCopiedMessage && (
        <div className="toast">
          ✅ Copied to clipboard!
        </div>
      )}

      {/* Floating particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
