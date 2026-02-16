import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PaymentSettingsDialog } from "@/components/admin/PaymentSettingsDialog";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string; // New field
  category: 'subscription' | 'ebook' | 'meditation' | 'service' | 'pack';
  cta_link: string | null;
  is_active: boolean;
  is_featured: boolean;
  image_url: string | null;
}

const AdminProducts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch Products with click counts
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase
        .from('products')
        .select('*, product_events(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include a flat 'clicks' property
      return data.map((p: any) => ({
        ...p,
        clicks: p.product_events?.[0]?.count || 0
      })) as (Product & { clicks: number })[];
    }
  });

  // Create/Update Mutation
  const saveProductMutation = useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      if (editingProduct) {
        // @ts-ignore
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        // @ts-ignore
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsOpen(false);
      setEditingProduct(null);
      toast.success(editingProduct ? "Producto actualizado" : "Producto creado");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Quick Toggle Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      // @ts-ignore
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Estado actualizado");
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  // Delete Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success("Producto eliminado");
    },
    onError: (error) => toast.error(`Error: ${error.message}`)
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      currency: formData.get('currency') as string, // New field
      category: formData.get('category') as any,
      cta_link: formData.get('cta_link') as string,
      image_url: formData.get('image_url') as string,
      is_active: formData.get('is_active') === 'on',
      is_featured: formData.get('is_featured') === 'on',
    };
    saveProductMutation.mutate(data);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 p-6">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Gestión de Productos
            </h1>
            <p className="text-muted-foreground">Administra el catálogo de la tienda</p>
          </div>
        </div>

        <div className="flex gap-2">
          <PaymentSettingsDialog />

          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingProduct(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" name="title" defaultValue={editingProduct?.title} required />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description || ''} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2 col-span-1">
                    <Label htmlFor="currency">Moneda</Label>
                    <select
                      id="currency"
                      name="currency"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue={editingProduct?.currency || 'MXN'}
                    >
                      <option value="MXN">MXN ($)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price || 0} required />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={editingProduct?.category || 'pack'}
                  >
                    <option value="subscription">Suscripción</option>
                    <option value="ebook">Ebook / Libro</option>
                    <option value="meditation">Meditación</option>
                    <option value="pack">Pack Contenido</option>
                    <option value="service">Servicio / Mentoría</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cta_link">Link de Venta (Stripe/Paypal/Mail)</Label>
                  <Input id="cta_link" name="cta_link" defaultValue={editingProduct?.cta_link || ''} placeholder="https://..." />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image_url">URL Imagen (Opcional)</Label>
                  <Input id="image_url" name="image_url" defaultValue={editingProduct?.image_url || ''} placeholder="https://..." />
                </div>

                <div className="flex gap-6 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="is_active" name="is_active" defaultChecked={editingProduct?.is_active ?? true} />
                    <Label htmlFor="is_active">Activo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="is_featured" name="is_featured" defaultChecked={editingProduct?.is_featured ?? false} />
                    <Label htmlFor="is_featured">Destacado</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editingProduct ? "Guardar Cambios" : "Crear Producto"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Interés (Clicks)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{product.title}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="capitalize px-2 py-1 rounded-full bg-secondary text-xs">
                    {product.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: product.currency || 'MXN' }).format(product.price)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-medium">
                    <span className="text-primary">{product.clicks}</span>
                    <span className="text-xs text-muted-foreground">clicks</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: product.id, isActive: checked })}
                    />
                    {product.is_featured && <span className="text-xs text-yellow-600 font-bold">★</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingProduct(product);
                    setIsOpen(true);
                  }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                    if (confirm("¿Estás seguro de eliminar este producto?")) deleteProductMutation.mutate(product.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {products?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay productos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProducts;
