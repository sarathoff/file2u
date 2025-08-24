// src/app/page.tsx
'use client';

import { useState, FormEvent, ChangeEvent, DragEvent } from 'react';
import { FiUploadCloud, FiDownloadCloud, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiFile, FiLink } from 'react-icons/fi';

type View = 'main' | 'send' | 'receive';

export default function HomePage() {
  const [view, setView] = useState<View>('main');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ shareCode: string; driveLink: string } | null>(null);
  const [code, setCode] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [receiveResult, setReceiveResult] = useState<{ file_url: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSendSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setSendError('Please select a file to upload.');
      return;
    }
    setIsSending(true);
    setSendError(null);
    setSendResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || 'Something went wrong.');
      setSendResult(data);
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleReceiveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code || code.length < 3) {
      setReceiveError('Please enter a valid 3-digit code.');
      return;
    }
    setIsReceiving(true);
    setReceiveError(null);
    setReceiveResult(null);

    try {
      const response = await fetch(`/api/retrieve?code=${code}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to retrieve file.');
      setReceiveResult(data);
    } catch (err: any) {
      setReceiveError(err.message);
    } finally {
      setIsReceiving(false);
    }
  };

  const resetSend = () => {
    setView('main');
    setFile(null);
    setSendError(null);
    setSendResult(null);
  };

  const resetReceive = () => {
    setView('main');
    setCode('');
    setReceiveError(null);
    setReceiveResult(null);
  };

  const renderView = () => {
    switch (view) {
      case 'send':
        return (
          <div className="transition-all duration-300">
            <button onClick={resetSend} className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-6">
              <FiArrowLeft className="mr-2" /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Send File</h1>
            <p className="text-gray-500 mt-1">Upload a file to generate a shareable code.</p>
            {sendResult ? (
              <div className="text-center mt-8 animate-fade-in">
                <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700">Upload Successful!</p>
                <p className="mt-2 text-gray-500">Your share code is:</p>
                <div className="my-4 text-6xl font-bold tracking-widest text-indigo-600 bg-indigo-50 p-4 rounded-lg">
                  {sendResult.shareCode}
                </div>
                <button onClick={resetSend} className="mt-4 text-sm text-indigo-600 hover:underline">Send another file</button>
              </div>
            ) : (
              <form onSubmit={handleSendSubmit} className="mt-8 space-y-6">
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}
                >
                  <FiUploadCloud className="text-4xl text-gray-400 mx-auto mb-4" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="font-semibold text-indigo-600">Click to upload</span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                  {file && (
                    <div className="mt-4 text-sm text-gray-600 flex items-center justify-center">
                      <FiFile className="mr-2" />
                      <span>{file.name}</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center items-center rounded-md bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-all"
                  disabled={isSending || !file}
                >
                  {isSending ? 'Uploading...' : 'Get Share Code'}
                </button>
                {sendError && <p className="flex items-center text-sm text-red-500"><FiAlertCircle className="mr-2"/>{sendError}</p>}
              </form>
            )}
          </div>
        );
      case 'receive':
        return (
          <div className="transition-all duration-300">
            <button onClick={resetReceive} className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition mb-6">
              <FiArrowLeft className="mr-2" /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Receive File</h1>
            <p className="text-gray-500 mt-1">Enter the 3-digit code to download the file.</p>
            {receiveResult ? (
              <div className="text-center mt-8 animate-fade-in">
                <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700">File Found!</p>
                <a
                  href={receiveResult.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center w-full rounded-md bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 transition"
                >
                  <FiLink className="mr-2"/> Open File in New Tab
                </a>
                <button onClick={resetReceive} className="mt-4 text-sm text-green-600 hover:underline">Receive another file</button>
              </div>
            ) : (
              <form onSubmit={handleReceiveSubmit} className="mt-8 space-y-6">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder="123"
                  maxLength={3}
                  className="w-full text-center text-4xl tracking-widest p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  disabled={isReceiving}
                />
                <button
                  type="submit"
                  className="w-full flex justify-center items-center rounded-md bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 disabled:bg-green-400 transition-all"
                  disabled={isReceiving || code.length < 3}
                >
                  {isReceiving ? 'Searching...' : 'Get File'}
                </button>
                {receiveError && <p className="flex items-center text-sm text-red-500"><FiAlertCircle className="mr-2"/>{receiveError}</p>}
              </form>
            )}
          </div>
        );
      default:
        return (
          <div className="text-center transition-all duration-300">
            <h1 className="text-4xl font-bold text-gray-800">BoardLink 🔗</h1>
            <p className="mt-2 text-lg text-gray-500">Share files to the smart board instantly.</p>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <button onClick={() => setView('send')} className="group flex flex-col items-center justify-center w-full bg-indigo-50 text-indigo-700 font-bold py-8 px-4 rounded-xl hover:bg-indigo-100 transition-all duration-300 transform hover:scale-105">
                <FiUploadCloud className="text-5xl mb-3 transition-transform duration-300 group-hover:-translate-y-1" />
                <span className="text-xl">Send File</span>
              </button>
              <button onClick={() => setView('receive')} className="group flex flex-col items-center justify-center w-full bg-green-50 text-green-700 font-bold py-8 px-4 rounded-xl hover:bg-green-100 transition-all duration-300 transform hover:scale-105">
                <FiDownloadCloud className="text-5xl mb-3 transition-transform duration-300 group-hover:-translate-y-1" />
                <span className="text-xl">Receive File</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 sm:p-12 shadow-xl transition-all duration-300">
        {renderView()}
      </div>
      <footer className="text-center mt-8 text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} file2U. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
