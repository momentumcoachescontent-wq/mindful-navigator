import { useState, useEffect } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { SOSButton } from "@/components/layout/SOSButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FeedTab, VictoriesTab } from "@/components/community";
import { RankingTab } from "@/components/ranking";

const Community = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "feed");

  useEffect(() => {
    if (tabFromUrl && ["feed", "victories", "ranking"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="feed" className="text-sm">
              Feed
            </TabsTrigger>
            <TabsTrigger value="victories" className="text-sm">
              Victorias
            </TabsTrigger>
            <TabsTrigger value="ranking" className="text-sm">
              Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-0">
            <FeedTab />
          </TabsContent>

          <TabsContent value="victories" className="mt-0">
            <VictoriesTab />
          </TabsContent>

          <TabsContent value="ranking" className="mt-0">
            <RankingTab />
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />
      <SOSButton />
    </div>
  );
};

export default Community;
