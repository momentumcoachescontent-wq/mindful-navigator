import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileJson, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

type TableConfig = {
  name: string;
  displayName: string;
  description: string;
  columns: string[];
  isGlobal?: boolean;
};

const EXPORTABLE_TABLES: TableConfig[] = [
  {
    name: "daily_reflections",
    displayName: "Reflexiones Diarias (Admin)",
    description: "Contenido global de reflexiones (Solo Admin)",
    columns: ["author", "category", "content", "display_date", "is_active", "order_index"],
    isGlobal: true,
  },
  {
    name: "journal_entries",
    displayName: "Entradas de Diario",
    description: "Tus reflexiones, estados de ánimo y notas personales",
    columns: ["id", "content", "mood_score", "energy_score", "stress_score", "entry_type", "tags", "created_at"],
  },
  {
    name: "daily_victories",
    displayName: "Victorias Diarias",
    description: "Tus logros y victorias registradas",
    columns: ["id", "victory_text", "victory_date", "is_public", "xp_bonus", "created_at"],
  },
  {
    name: "scanner_history",
    displayName: "Historial del Escáner",
    description: "Análisis de situaciones realizados con IA",
    columns: ["id", "situation_text", "alert_level", "red_flags", "recommended_tools", "action_plan", "ai_response", "created_at"],
  },
  {
    name: "sos_cards",
    displayName: "Tarjetas SOS",
    description: "Tus tarjetas de emergencia personalizadas",
    columns: ["id", "card_type", "title", "content", "is_favorite", "reminder_time", "created_at"],
  },
  {
    name: "trusted_contacts",
    displayName: "Contactos de Confianza",
    description: "Tu red de apoyo personal",
    columns: ["id", "name", "phone", "email", "relationship", "is_primary", "created_at"],
  },
  {
    name: "daily_missions",
    displayName: "Misiones Completadas",
    description: "Registro de misiones diarias completadas",
    columns: ["id", "mission_id", "mission_type", "mission_date", "xp_earned", "completed_at"],
  },
];

const normalizeDate = (dateStr: string | unknown): string | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmy = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  // Try standard parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
};

const DataManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ table: string; status: "success" | "error"; message: string } | null>(null);

  // Fetch user profile to check admin status
  const [isAdmin, setIsAdmin] = useState(false);

  useState(() => {
    async function checkAdmin() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (data?.is_admin) {
        setIsAdmin(true);
      }
    }
    checkAdmin();
  });

  const handleExport = async (table: TableConfig) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para exportar datos",
        variant: "destructive",
      });
      return;
    }

    setLoading(`export-${table.name}`);
    try {
      let query = supabase
        .from(table.name as "journal_entries")
        .select(table.columns.join(","));

      // Only filter by user_id if it's NOT a global table
      if (!table.isGlobal) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table.name}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${data?.length || 0} registros de ${table.displayName}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleImport = async (table: TableConfig, file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para importar datos",
        variant: "destructive",
      });
      return;
    }

    setLoading(`import-${table.name}`);
    setImportStatus(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("El archivo debe contener un array de registros");
      }

      // Validate and clean data
      const cleanedData = data.map((item: Record<string, unknown>) => {
        const cleaned: Record<string, unknown> = {};
        table.columns.forEach((col) => {
          if (col !== "id" && col !== "created_at" && col !== "completed_at" && item[col] !== undefined) {
            cleaned[col] = item[col];
          }
        });

        // Add user_id ONLY if it's NOT a global table
        if (!table.isGlobal) {
          cleaned.user_id = user.id;
        }

        return cleaned;
      }).filter(item => {
        // Validation for daily_reflections
        if (table.name === 'daily_reflections') {
          // Content is required
          if (!item.content) return false;

          // Normalize date if present
          if (item.display_date) {
            const normalized = normalizeDate(item.display_date);
            if (normalized) {
              item.display_date = normalized;
            } else {
              // If invalid or unparseable, nullify to avoid DB error
              item.display_date = null;
            }
          }

          // Ensure defaults if missing
          if (typeof item.is_active === 'undefined') item.is_active = true;
          if (typeof item.order_index === 'undefined') item.order_index = 0;
        }
        return true;
      });

      if (cleanedData.length === 0) {
        throw new Error("No hay datos válidos para importar");
      }

      const { error } = await supabase
        .from(table.name as "journal_entries")
        .insert(cleanedData as never[]);

      if (error) throw error;

      setImportStatus({
        table: table.name,
        status: "success",
        message: `Se importaron ${cleanedData.length} registros correctamente`,
      });

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${cleanedData.length} registros a ${table.displayName}`,
      });
    } catch (error: any) {
      console.error("Import error object:", error);

      let message = "Error desconocido";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error structure
        message = error.message || error.details || error.hint || JSON.stringify(error);
      }

      setImportStatus({
        table: table.name,
        status: "error",
        message,
      });
      toast({
        title: "Error al importar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const triggerFileInput = (table: TableConfig) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImport(table, file);
      }
    };
    input.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Inicia sesión</h2>
            <p className="text-muted-foreground mb-4">
              Necesitas una cuenta para gestionar tus datos
            </p>
            <Button onClick={() => navigate("/auth")}>Ir a iniciar sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Gestión de Datos</h1>
            <p className="text-sm text-muted-foreground">Importar y exportar tu información</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Alert */}
        <Alert>
          <FileJson className="h-4 w-4" />
          <AlertDescription>
            Los archivos se exportan e importan en formato JSON. Al importar, los registros se añadirán a los existentes.
          </AlertDescription>
        </Alert>

        {/* Import Status */}
        {importStatus && (
          <Alert variant={importStatus.status === "success" ? "default" : "destructive"}>
            {importStatus.status === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{importStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Table Cards */}
        <div className="grid gap-4">
          {EXPORTABLE_TABLES.filter(t => !t.isGlobal || isAdmin).map((table) => (
            <Card key={table.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{table.displayName}</CardTitle>
                <CardDescription>{table.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleExport(table)}
                    disabled={loading !== null}
                  >
                    {loading === `export-${table.name}` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Exportar
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => triggerFileInput(table)}
                    disabled={loading !== null}
                  >
                    {loading === `import-${table.name}` ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Importar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
