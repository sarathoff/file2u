'use client';

import { useState, FormEvent, ChangeEvent, DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="self-start" onClick={resetSend}>
                <Icons.arrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle>Send File</CardTitle>
              <CardDescription>Upload a file to generate a shareable code.</CardDescription>
            </CardHeader>
            <CardContent>
              {sendResult ? (
                <div className="text-center">
                  <Icons.checkCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium">Upload Successful!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Your share code is:</p>
                  <div className="my-4 text-4xl font-bold tracking-widest text-primary">{sendResult.shareCode}</div>
                  <Button onClick={resetSend}>Send another file</Button>
                </div>
              ) : (
                <form onSubmit={handleSendSubmit} className="space-y-4">
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      'flex justify-center rounded-lg border-2 border-dashed border-muted bg-background px-6 py-10',
                      isDragging && 'border-primary bg-accent'
                    )}
                  >
                    <div className="text-center">
                      <Icons.upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                        <Label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                        >
                          <span>Click to upload</span>
                          <Input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                        </Label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      {file && <p className="text-xs leading-5 text-muted-foreground">{file.name}</p>}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSending || !file}>
                    {isSending && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    {isSending ? 'Uploading...' : 'Get Share Code'}
                  </Button>
                  {sendError && (
                    <p className="flex items-center text-sm text-destructive">
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
          <Card>
            <CardHeader>
              <Button variant="ghost" size="sm" className="self-start" onClick={resetReceive}>
                <Icons.arrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle>Receive File</CardTitle>
              <CardDescription>Enter the 3-digit code to download the file.</CardDescription>
            </CardHeader>
            <CardContent>
              {receiveResult ? (
                <div className="text-center">
                  <Icons.checkCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium">File Found!</h3>
                  <a
                    href={receiveResult.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'default' }), 'mt-4 w-full')}
                  >
                    <Icons.link className="mr-2 h-4 w-4" />
                    Open File in New Tab
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
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    placeholder="123"
                    maxLength={3}
                    className="text-center text-2xl tracking-widest"
                    disabled={isReceiving}
                  />
                  <Button type="submit" className="w-full" disabled={isReceiving || code.length < 3}>
                    {isReceiving && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    {isReceiving ? 'Searching...' : 'Get File'}
                  </Button>
                  {receiveError && (
                    <p className="flex items-center text-sm text-destructive">
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
          <div className="text-center">
            <h1 className="text-4xl font-bold">File2U 🔗</h1>
            <p className="mt-2 text-muted-foreground">Share files to the smart board instantly.</p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button size="lg" onClick={() => setView('send')}>
                <Icons.upload className="mr-2 h-5 w-5" />
                Send File
              </Button>
              <Button size="lg" onClick={() => setView('receive')}>
                <Icons.download className="mr-2 h-5 w-5" />
                Receive File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{renderView()}</div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} file2U. All Rights Reserved.</p>
      </footer>
    </main>
  );
}