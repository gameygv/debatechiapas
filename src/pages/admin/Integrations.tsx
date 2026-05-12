import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Save, Lock, AlertCircle, CheckCircle2, Webhook, Mail, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

const Integrations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Mock save handler
  const handleSave = () => {
    setIsLoading(true);
    // Simulate API verification call
    setTimeout(() => {
      setIsLoading(false);
      setIsConnected(true);
      toast.success("Configuración guardada correctamente.");
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">Integraciones & Automatización</h1>
        <p className="text-muted-foreground mt-1">Conecta servicios externos y automatiza flujos de trabajo.</p>
      </div>

      <Tabs defaultValue="automation" className="w-full max-w-4xl">
        <TabsList className="mb-4">
          <TabsTrigger value="automation">Automatización</TabsTrigger>
          <TabsTrigger value="social">Redes Sociales</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-6">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Webhook className="h-6 w-6 text-purple-600" />
                <CardTitle>Webhook de Publicación (Make.com)</CardTitle>
              </div>
              <CardDescription>
                Se disparará automáticamente cuando un artículo pase a estado <strong>"Published"</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input id="webhookUrl" placeholder="https://hook.us1.make.com/..." />
                <p className="text-[11px] text-muted-foreground">Endpoint que recibirá el JSON del artículo.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Secret Key (HMAC)</Label>
                <div className="relative">
                  <Input id="webhookSecret" type="password" placeholder="sk_live_..." />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-[11px] text-muted-foreground">Usado para firmar el payload y verificar autenticidad.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t p-4 flex justify-end rounded-b-lg">
              <Button onClick={handleSave} disabled={isLoading}>Guardar Webhook</Button>
            </CardFooter>
          </Card>

          {/* Email Ingest Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                <CardTitle>Publicar por Email</CardTitle>
              </div>
              <CardDescription>
                Envía correos a esta dirección para crear borradores automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Instrucciones</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  El <strong>Asunto</strong> será el título. El cuerpo será el contenido. 
                  Si adjuntas imágenes, la primera será la destacada.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Endpoint de Ingesta</Label>
                <div className="flex gap-2">
                  <Input readOnly value="https://api.eldivodechiapas.com/api/ingest/email" className="bg-muted font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard("https://api.eldivodechiapas.com/api/ingest/email")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingestSecret">Ingest Secret Key</Label>
                <div className="flex gap-2">
                  <Input id="ingestSecret" value="sk_ingest_8374928374" readOnly className="font-mono" />
                  <Button variant="outline" onClick={() => toast.success("Secreto regenerado")}>Regenerar</Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Debes incluir este secreto en el header o body de la petición del proveedor de email.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
           <div className="p-10 text-center border rounded-md bg-muted/20">
             Usa el Webhook en "Automatización" para conectar con Make.com y distribuir a redes sociales.
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Integrations;