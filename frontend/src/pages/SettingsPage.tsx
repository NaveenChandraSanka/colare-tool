import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

export default function SettingsPage() {
  const { session } = useAuth();

  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const loopsWebhookUrl = `${apiUrl}/api/webhooks/loops`;
  const resendWebhookUrl = `${apiUrl}/api/webhooks/resend`;

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input readOnly value={session?.user.email || ''} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure these URLs in your Loops and Resend dashboards to receive
              email engagement events.
            </p>

            <div className="space-y-2">
              <Label>Loops Webhook URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={loopsWebhookUrl} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(loopsWebhookUrl, 'Loops webhook URL')
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resend Webhook URL</Label>
              <div className="flex gap-2">
                <Input readOnly value={resendWebhookUrl} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(resendWebhookUrl, 'Resend webhook URL')
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Backend URL</Label>
              <Input readOnly value={apiUrl} disabled />
              <p className="text-xs text-muted-foreground">
                The base URL for the Colare API.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
