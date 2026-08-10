"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { TopBar } from "@/components/ace/TopBar";
import { Loader2, Upload, Save, User as UserIcon, Building2, Tag, Phone } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  
  const [companyName, setCompanyName] = useState("");
  const [niche, setNiche] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || "");
      setNiche(profile.niche || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyName,
          niche: niche || null,
          phone: phone || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Erro ao atualizar o perfil: " + error.message);
      } else {
        toast.success("Perfil atualizado com sucesso!");
        await refreshProfile();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar as configurações do perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${user.id}.${fileExt}`;

      // Upload do arquivo para o bucket company-logos
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtém a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      // Adiciona um timestamp para limpar cache de imagem local
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

      // Salva no perfil do usuário
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: cacheBustedUrl })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(cacheBustedUrl);
      toast.success("Foto de perfil atualizada com sucesso!");
      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar a imagem de perfil: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-brand" size={40} />
      </div>
    );
  }

  return (
    <TopBar>
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8 animate-float-up">
        {/* Header da Página */}
        <div className="space-y-2 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Configurações da <span className="text-gradient-brand">Empresa</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os dados cadastrais da sua marca, nicho de atuação e identidade visual.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Seção da Logo (Upload) */}
          <div className="rounded-3xl border border-border/50 bg-card p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Logotipo da Empresa
            </div>
            
            <div className="relative group">
              <div className="h-32 w-32 rounded-full overflow-hidden border border-border/60 bg-secondary/30 flex items-center justify-center relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 size={48} className="text-muted-foreground/40" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-xs">
                    <Loader2 className="animate-spin text-white" size={24} />
                  </div>
                )}
              </div>
              
              <label className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-white shadow-md hover:scale-105 active:scale-95 transition cursor-pointer">
                <Upload size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            
            <p className="text-[10px] text-muted-foreground max-w-[200px]">
              Formatos aceitos: PNG, JPG ou WEBP. A imagem será recortada no formato circular.
            </p>
          </div>

          {/* Formulário com as configurações */}
          <div className="md:col-span-2 rounded-3xl border border-border/50 bg-card p-8 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                {/* Nome da Empresa */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Building2 size={12} /> Nome da Empresa
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Minha Cachaçaria Ltda"
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition-all text-sm font-medium shadow-sm"
                  />
                </div>

                {/* Nicho de Atuação */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Tag size={12} /> Nicho de Atuação
                  </label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Ex: Cachaça Artesanal, Vinhos Finos, Destilados"
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition-all text-sm font-medium shadow-sm"
                  />
                </div>

                {/* Telefone de Contato */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Phone size={12} /> Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background/50 focus:bg-background focus:border-primary focus:outline-none transition-all text-sm font-medium shadow-sm"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-card transition duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Salvar Alterações <Save size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </TopBar>
  );
}
