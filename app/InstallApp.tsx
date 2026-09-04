import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const available = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', complete);
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', complete);
    };
  }, []);
  if (installed) return null;
  async function install() {
    if (!prompt) { setHelp(!help); return; }
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally { setPrompt(null); }
  }
  return <div className="install-panel">
    <Button variant="outline" onClick={() => void install().catch(() => setHelp(true))}><Download />Install on this device</Button>
    {help && <p role="status">On Android, open this page in Chrome. Tap the ⋮ menu, then “Add to Home screen” or “Install app”.</p>}
  </div>;
}
