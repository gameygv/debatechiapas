import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Trash2, Search, Loader2, AlertTriangle, HardDrive, RefreshCw, 
  FileVideo, Image as ImageIcon, ShieldCheck, Database, Terminal, FileCode,
  CheckCircle2, XCircle, Eraser, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface OrphanFile {
  name: string;
  size: number;
  date: string;
  type: 'image' | 'video' | 'other';
}

// Media base URL is now Supabase Storage (no longer FTP)

const OrphanCleaner = () => {
  const [loading, setLoading] = useState(false);
  const [orphans, setOrphans] = useState<OrphanFile[]>([]);
  const [stats, setStats] = useState({ totalFtp: 0, totalProtected: 0 });
  const [scanned, setScanned] = useState(false);
  
  // Selection States
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });

  // Corrupted Files State
  const [corruptedFiles, setCorruptedFiles] = useState<any[]>([]);
  const [scannedCorrupted, setScannedCorrupted] = useState(false);

  const [logs, setLogs] = useState<string[]>([]);
  const [auditLimit, setAuditLimit] = useState(60);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleScanOrphans = async () => {
    setLoading(true);
    setOrphans([]);
    setScanned(false);
    setSelectedFiles(new Set());
    
    try {
      const { data, error } = await supabase.functions.invoke('scan-orphans');
      if (error) throw error;

      setOrphans(data.orphans || []);
      setStats({ totalFtp: data.totalFtp, totalProtected: data.totalProtected });
      setScanned(true);
      toast.success(data.orphans.length === 0 ? "Servidor impecable" : `Hallados ${data.orphans.length} archivos sin uso`);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFileSelection = (filename: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filename)) {
      newSelection.delete(filename);
    } else {
      newSelection.add(filename);
    }
    setSelectedFiles(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === orphans.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(orphans.map(f => f.name)));
    }
  };

  const handleDeleteSelected = async () => {
    const count = selectedFiles.size;
    if (count === 0) return;
    
    if (!confirm(`¿Eliminar permanentemente los ${count} archivos seleccionados?`)) return;

    setDeletingBulk(true);
    setDeleteProgress({ current: 0, total: count });
    
    const filesToDelete = Array.from(selectedFiles);
    let successCount = 0;
    
    for (const filename of filesToDelete) {
      try {
        const { data, error } = await supabase.functions.invoke('delete-ftp-file', { body: { filename } });
        if (error) throw error;
        successCount++;
      } catch (err) {
        console.error(`Error borrando ${filename}:`, err);
      }
      setDeleteProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }

    toast.success(`${successCount} archivos eliminados correctamente.`);
    setDeletingBulk(false);
    handleScanOrphans(); 
  };

  const handleScanCorrupted = async () => {
    setLoading(true);
    try {
      // CAMBIO CLAVE: Buscar menores a 100 bytes (para pillar los de 1B)
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .or('size_bytes.lt.100,size_bytes.is.null');
      
      if (error) throw error;
      setCorruptedFiles(data || []);
      setScannedCorrupted(true);
      
      if (data && data.length > 0) {
        toast.info(`Se hallaron ${data.length} registros para limpiar`);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanCorrupted = async () => {
    if (!confirm(`Se eliminarán ${corruptedFiles.length} registros corruptos. ¿Continuar?`)) return;
    
    setLoading(true);
    setLogs([]);
    try {
      const { data, error } = await supabase.functions.invoke('system-maintenance', {
        body: { action: 'clean_empty_files' }
      });
      if (error) throw error;
      setLogs(data.logs || []);
      toast.success('Limpieza completada');
      setCorruptedFiles([]);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuditArticles = async () => {
    setLoading(true);
    setLogs([]);
    try {
      const { data, error } = await supabase.functions.invoke('system-maintenance', {
        body: { action: 'audit_articles', limit: auditLimit }
      });
      if (error) throw error;
      setLogs(data.logs || []);
      toast.success("Auditoría completada");
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateStorage = async () => {
    if (!confirm("Se moverán archivos de Supabase al FTP y se borrarán del origen. ¿Continuar?")) return;
    setLoading(true);
    setLogs([]);
    try {
      const { data, error } = await supabase.functions.invoke('system-maintenance', {
        body: { action: 'migrate_storage' }
      });
      if (error) throw error;
      setLogs(data.logs || []);
      toast.success("Migración completada");
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" /> Revisión y Limpieza
        </h1>
        <p className="text-muted-foreground">Herramientas de mantenimiento para la integridad del servidor.</p>
      </div>

      <Tabs defaultValue="corrupted" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="corrupted" className="text-red-600 data-[state=active]:bg-red-50">Registros Sospechosos</TabsTrigger>
        </TabsList>

        <TabsContent value="corrupted" className="space-y-4 mt-4">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" /> 
                Limpiar Cargas Fallidas o Vacías
              </CardTitle>
              <CardDescription>
                Elimina registros de la base de datos menores a 100 bytes (archivos fantasma o corruptos).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <Button onClick={handleScanCorrupted} disabled={loading} variant="outline" className="bg-white">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Escanear DB
                  </Button>
                  
                  {corruptedFiles.length > 0 && (
                    <Button onClick={handleCleanCorrupted} disabled={loading} variant="destructive">
                      <Eraser className="mr-2 h-4 w-4" />
                      Eliminar {corruptedFiles.length} Registros
                    </Button>
                  )}
                </div>

                {scannedCorrupted && (
                  <div className="bg-white rounded-md border p-4 max-h-80 overflow-y-auto">
                    {corruptedFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-green-600 py-4">
                        <CheckCircle2 className="h-8 w-8 mb-2" />
                        <p>No se hallaron registros sospechosos.</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {corruptedFiles.map(f => (
                          <li key={f.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 hover:bg-gray-50 p-1">
                            <div className="flex flex-col">
                                <span className="font-mono text-red-600 font-bold">{f.filename}</span>
                                <span className="text-[10px] text-gray-400">{f.folder}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-red-50 text-red-700">{formatSize(f.size_bytes || 0)}</Badge>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orphans" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Archivos huérfanos en FTP</CardTitle>
                  <CardDescription>Archivos físicos que no están en la biblioteca ni en el contenido de los posts.</CardDescription>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                   {selectedFiles.size > 0 && (
                     <Button variant="destructive" onClick={handleDeleteSelected} disabled={deletingBulk} className="gap-2">
                        {deletingBulk ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> {deleteProgress.current}/{deleteProgress.total}</>
                        ) : (
                          <><Trash2 className="h-4 w-4" /> Borrar seleccionados ({selectedFiles.size})</>
                        )}
                     </Button>
                   )}
                   <Button onClick={handleScanOrphans} disabled={loading || deletingBulk}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Escanear Servidor
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm mb-6">
                <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded flex items-center gap-2 border border-blue-100">
                    <Database size={14} /> Total FTP: <strong>{stats.totalFtp}</strong>
                </div>
                <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded flex items-center gap-2 border border-green-100">
                    <Lock size={14} /> Protegidos: <strong>{stats.totalProtected}</strong>
                </div>
              </div>

              {scanned && orphans.length > 0 && (
                <div className="border rounded-md overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-12 text-center">
                          <Checkbox checked={selectedFiles.size === orphans.length} onCheckedChange={handleSelectAll} className="translate-y-0.5" />
                        </TableHead>
                        <TableHead className="w-24">Vista Previa</TableHead>
                        <TableHead>Nombre del Archivo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tamaño</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orphans.map((file) => (
                        <TableRow key={file.name} className={cn("hover:bg-muted/30 transition-colors", selectedFiles.has(file.name) && "bg-primary/5")}>
                          <TableCell className="text-center">
                            <Checkbox checked={selectedFiles.has(file.name)} onCheckedChange={() => toggleFileSelection(file.name)} />
                          </TableCell>
                          <TableCell>
                            <div className="h-14 w-14 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                              {file.type === 'image' ? (
                                <img src={`${FTP_BASE_URL}/${file.name}`} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'; }} />
                              ) : file.type === 'video' ? (
                                <video src={`${FTP_BASE_URL}/${file.name}`} className="h-full w-full object-cover" muted />
                              ) : (
                                <FileCode className="text-muted-foreground" size={20} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] max-w-[200px] truncate" title={file.name}>{file.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={file.type === 'image' ? "text-blue-600 border-blue-100 bg-blue-50/50" : "text-purple-600 border-purple-100 bg-purple-50/50"}>
                                {file.type === 'image' ? <ImageIcon size={10} className="mr-1" /> : <FileVideo size={10} className="mr-1" />}
                                {file.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatSize(file.size)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => { if(confirm(`¿Borrar "${file.name}"?`)) { setSelectedFiles(new Set([file.name])); handleDeleteSelected(); } }} disabled={deletingBulk}><Trash2 className="h-4 w-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {scanned && orphans.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed rounded-lg bg-green-50/30 border-green-100">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-green-800">¡Todo en orden!</h3>
                  <p className="text-green-600/70 text-sm">No se hallaron archivos sin uso en el servidor.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>Auditoría de Artículos</CardTitle>
              <CardDescription>Busca links a Supabase en tus posts y los corrige para que apunten al FTP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-2 w-full sm:w-48">
                  <Label>Artículos a revisar</Label>
                  <Input type="number" value={auditLimit} onChange={(e) => setAuditLimit(parseInt(e.target.value) || 60)} />
                </div>
                <Button onClick={handleAuditArticles} disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Iniciar Auditoría
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrate" className="mt-4">
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2"><Database size={20}/> Migración Total</CardTitle>
              <CardDescription>Mueve CUALQUIER archivo de Supabase al FTP y limpia el storage.</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle size={16} />
                <AlertTitle>Atención</AlertTitle>
                <AlertDescription>Esta acción moverá todos los archivos restantes del bucket al servidor FTP.</AlertDescription>
              </Alert>
              <Button variant="destructive" onClick={handleMigrateStorage} disabled={loading}>Ejecutar Migración Masiva</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrphanCleaner;