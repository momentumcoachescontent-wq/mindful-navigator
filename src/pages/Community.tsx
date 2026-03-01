import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SOSButton } from "@/components/layout/SOSButton";
import { FeedTab } from "@/components/community/FeedTab";
import { VictoriesTab } from "@/components/community/VictoriesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Community = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold text-foreground">
              Círculo de Empoderamiento
            </h1>
          </div>
          <Users className="w-8 h-8 text-primary" />
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="feed" className="flex-1">Comunidad</TabsTrigger>
            <TabsTrigger value="victories" className="flex-1">Victorias</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-0">
            <FeedTab />
          </TabsContent>

          <TabsContent value="victories" className="mt-0">
            <VictoriesTab />
          </TabsContent>
        </Tabs>
      </main>

      <SOSButton />
    </div>
  );
};

export default Community;
