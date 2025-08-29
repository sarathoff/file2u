'use client';

import { useState, FormEvent, ChangeEvent, DragEvent } from 'react';
import { upload } from '@vercel/blob/client'; // Import the upload function
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

type View = 'main' | 'send' | 'receive';

export default function HomePage() {
  const [view, setView] = useState<View>('main');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ shareCode: string; fileUrl: string } | null>(null); // Changed to fileUrl
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
      // Step 1: Upload the file directly to Vercel Blob from the client.
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/vercel-blob-upload',
      });

      // Step 2: Send the new file's URL to our server to save it and get a code.
      const response = await fetch('/api/save-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: newBlob.url }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to save the file URL.');

      // Step 3: Show the result to the user.
      setSendResult(data);

    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleReceiveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code || code.length < 5) { // Updated to 5-digit code
      setReceiveError('Please enter a valid 5-digit code.');
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
          <Card className="w-full max-w-md bg-white/80 backdrop-blur-lg border-gray-200/80 shadow-lg rounded-2xl transition-all duration-500 ease-in-out fade-in">
            <CardHeader>
              <Button variant="ghost" size="sm" className="absolute top-4 left-4 text-gray-500 hover:text-gray-900" onClick={resetSend}>
                <Icons.arrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle className="text-center text-2xl font-semibold text-gray-900 pt-8">Send File</CardTitle>
              <CardDescription className="text-center text-gray-500">Upload a file to get a shareable code.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {sendResult ? (
                <div className="text-center fade-in p-4">
                  <Icons.checkCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-xl font-medium text-gray-900">Upload Successful</h3>
                  <p className="mt-2 text-sm text-gray-500">Your share code is:</p>
                  <div className="my-4 text-5xl font-bold tracking-widest text-gray-800">{sendResult.shareCode}</div>
                  <Button onClick={resetSend} className="w-full mt-4" variant="outline">Send another file</Button>
                </div>
              ) : (
                <form onSubmit={handleSendSubmit} className="space-y-4">
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'flex justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 transition-colors',
                      isDragging && 'border-blue-500 bg-blue-50'
                    )}
                  >
                    <div className="text-center">
                      <Icons.upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <Label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                        >
                          <span>Click to upload</span>
                          <Input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                        </Label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      {file && <p className="text-xs leading-5 text-gray-500 mt-2">{file.name}</p>}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSending || !file}>
                    {isSending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    {isSending ? 'Uploading...' : 'Get Share Code'}
                  </Button>
                  {sendError && (
                    <p className="flex items-center text-sm text-red-600">
                      <Icons.alertCircle className="mr-2 h-4 w-4" />
                      {sendError}
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        );
      case 'receive':
        return (
          <Card className="w-full max-w-md bg-white/80 backdrop-blur-lg border-gray-200/80 shadow-lg rounded-2xl transition-all duration-500 ease-in-out fade-in">
            <CardHeader>
              <Button variant="ghost" size="sm" className="absolute top-4 left-4 text-gray-500 hover:text-gray-900" onClick={resetReceive}>
                <Icons.arrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle className="text-center text-2xl font-semibold text-gray-900 pt-8">Receive File</CardTitle>
              <CardDescription className="text-center text-gray-500">Enter the 5-digit code to download.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {receiveResult ? (
                <div className="text-center fade-in p-4">
                  <Icons.checkCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-xl font-medium text-gray-900">File Ready to Download</h3>
                  <a
                    href={receiveResult.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'default' }), 'mt-6 w-full')}
                  >
                    <Icons.download className="mr-2 h-4 w-4" />
                    Download File
                  </a>
                  <Button variant="outline" className="mt-2 w-full" onClick={resetReceive}>
                    Receive another file
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleReceiveSubmit} className="space-y-4">
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                    placeholder="12345"
                    maxLength={5}
                    className="text-center text-4xl tracking-[1em] font-semibold h-20"
                    disabled={isReceiving}
                  />
                  <Button type="submit" className="w-full" disabled={isReceiving || code.length !== 5}>
                    {isReceiving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    {isReceiving ? 'Searching...' : 'Get File'}
                  </Button>
                  {receiveError && (
                    <p className="flex items-center text-sm text-red-600">
                      <Icons.alertCircle className="mr-2 h-4 w-4" />
                      {receiveError}
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        );
      default:
        return (
          <div className="text-center fade-in">
            <h1 className="text-5xl font-bold text-gray-800">File2U</h1>
            <p className="mt-2 text-lg text-gray-600">Share files to the smart board instantly.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setView('send')}
                className="transform transition-transform hover:scale-105"
              >
                <Icons.upload className="mr-2 h-5 w-5" />
                Send File
              </Button>
              <Button
                size="lg"
                onClick={() => setView('receive')}
                className="transform transition-transform hover:scale-105"
                variant="secondary"
              >
                <Icons.download className="mr-2 h-5 w-5" />
                Receive File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">{renderView()}</div>
      <footer className="absolute bottom-8 text-center text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} file2U. All Rights Reserved.</p>
      </footer>
    </main>
  );
}