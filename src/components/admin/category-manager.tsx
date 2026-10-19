"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit,
  FolderArchive,
  Sliders,
  CheckCircle2,
  XCircle,
  HardDrive,
  Search,
  Camera,
  GraduationCap,
  Award,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import {
  showSwalConfirm,
  showSwalLoading,
  showSwalSuccessAlert,
  showSwalError,
  closeSwal,
} from "@/lib/swal";
import { toast } from "sonner";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  driveFolderId: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  maxFileSizeMb: number;
  allowedFileTypes: string | null;
  fields: any[];
  _count?: {
    submissions: number;
    files: number;
  };
}

export function CategoryManager({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(500);
  const [icon, setIcon] = useState("FolderArchive");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setDriveFolderId("");
    setMaxFileSizeMb(500);
    setIcon("FolderArchive");
    setIsActive(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setDriveFolderId(cat.driveFolderId || "");
    setMaxFileSizeMb(cat.maxFileSizeMb || 500);
    setIcon(cat.icon || "FolderArchive");
    setIsActive(cat.isActive);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await updateCategory(editingId, {
          name,
          description,
          driveFolderId: driveFolderId.trim() || undefined,
          icon,
          maxFileSizeMb,
          isActive,
        });

        if (res.success && res.data) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingId ? { ...c, ...res.data } : c))
          );
          toast.success("Kategori berhasil diperbarui.");
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || "Gagal memperbarui kategori.");
        }
      } else {
        const res = await createCategory({
          name,
          description,
          driveFolderId: driveFolderId.trim() || undefined,
          icon,
          maxFileSizeMb,
        });

        if (res.success && res.data) {
          setCategories((prev) => [
            ...prev,
            { ...res.data, fields: [], _count: { submissions: 0, files: 0 } },
          ]);
          toast.success("Kategori baru berhasil dibuat.");
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || "Gagal membuat kategori.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    const confirmed = await showSwalConfirm(
      "Hapus Kategori & Berkas Drive?",
      `Apakah Anda yakin ingin menghapus kategori <b>"${catName}"</b>?<br><br><span class="text-xs text-rose-600 dark:text-rose-400 font-bold">⚠️ Semua formulir isian, data submisi, dan berkas di Google Drive untuk kategori ini juga akan dihapus permanen.</span>`,
      "Ya, Hapus Kategori",
      true
    );

    if (!confirmed) return;

    showSwalLoading({
      title: "Menghapus Kategori & Berkas...",
      stepText: "Sedang menghapus berkas dari Google Drive dan database...",
      progressPercent: 60,
    });

    try {
      const res = await deleteCategory(id);
      closeSwal();

      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showSwalSuccessAlert(
          "Kategori Berhasil Dihapus!",
          `Kategori "${catName}" dan semua berkas Google Drive terkait berhasil dihapus.`
        );
      } else {
        showSwalError("Gagal Menghapus Kategori", res.error || "Terjadi kesalahan saat menghapus kategori.");
      }
    } catch (err: any) {
      closeSwal();
      showSwalError("Terjadi Kesalahan", err.message || "Gagal menghapus kategori.");
    }
  };

  const getIconComponent = (iconName: string | null) => {
    switch (iconName) {
      case "Camera":
        return <Camera className="h-5 w-5" />;
      case "GraduationCap":
        return <GraduationCap className="h-5 w-5" />;
      case "Award":
        return <Award className="h-5 w-5" />;
      case "Sparkles":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <FolderArchive className="h-5 w-5" />;
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Kategori Berkas & Dynamic Form Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Atur kelompok berkas madrasah dan sesuaikan kolom isian kustom untuk formulir publik.
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Buat Kategori Baru
        </Button>
      </div>

      {/* Filter & Counter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kategori berkas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50/50 dark:bg-slate-800/40"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span>Menampilkan {filteredCategories.length} dari {categories.length} kategori</span>
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => (
          <Card
            key={cat.id}
            className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-800 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
          >
            <CardHeader className="pb-3 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/60 dark:to-transparent">
              <div className="flex items-start justify-between gap-2">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  {getIconComponent(cat.icon)}
                </div>
                <div className="flex items-center gap-1.5">
                  {cat.isActive ? (
                    <Badge variant="success" className="text-[10px] font-bold">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Non-aktif
                    </Badge>
                  )}
                </div>
              </div>

              <CardTitle className="text-base font-extrabold mt-3 text-slate-900 dark:text-white leading-snug">
                {cat.name}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1 leading-relaxed">
                {cat.description || "Tidak ada deskripsi khusus untuk kategori ini."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Field</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    {cat.fields?.length ?? 0} Kolom
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Berkas</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {cat._count?.files ?? 0} File
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Batas File</span>
                  <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm">
                    {cat.maxFileSizeMb || 500} MB
                  </span>
                </div>
              </div>

              {cat.driveFolderId && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono truncate px-1">
                  <HardDrive className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Folder ID: {cat.driveFolderId}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link href={`/admin/categories/${cat.id}/fields`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 rounded-xl"
                  >
                    <Sliders className="h-3.5 w-3.5 text-emerald-600" />
                    Form Builder ({cat.fields?.length ?? 0})
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-500 hover:text-slate-800 rounded-xl"
                  onClick={() => handleOpenEdit(cat)}
                  title="Ubah info kategori"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  title="Hapus kategori"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Add / Edit Category */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingId ? "Ubah Data Kategori" : "Buat Kategori Berkas Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tentukan nama kategori, ikon, batas ukuran file, dan folder tujuan Google Drive.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama Kategori <span className="text-red-500">*</span></Label>
              <Input
                id="cat-name"
                placeholder="Contoh: Dokumentasi Outing Class 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Deskripsi Kategori</Label>
              <Textarea
                id="cat-desc"
                placeholder="Jelaskan jenis berkas yang harus diunggah pada kategori ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-folder">Folder ID Google Drive Khusus (Opsional)</Label>
              <Input
                id="cat-folder"
                placeholder="Biarkan kosong untuk menggunakan folder default"
                value={driveFolderId}
                onChange={(e) => setDriveFolderId(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Jika diisi, berkas pada kategori ini akan langsung tersimpan ke folder Google Drive tersebut.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cat-size">Maks. Ukuran File per Berkas (MB)</Label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {maxFileSizeMb >= 1000 ? `${(maxFileSizeMb / 1024).toFixed(1)} GB` : `${maxFileSizeMb} MB`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="cat-size"
                  type="number"
                  min={10}
                  max={2000}
                  value={maxFileSizeMb}
                  onChange={(e) => setMaxFileSizeMb(parseInt(e.target.value, 10) || 500)}
                  className="flex-1 font-mono"
                />
              </div>
              {/* Quick preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Preset cepat:</span>
                {[100, 250, 500, 1000, 2000].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setMaxFileSizeMb(size)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      maxFileSizeMb === size
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {size >= 1000 ? `${size / 1000} GB` : `${size} MB`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mendukung video resolusi tinggi berdurasi panjang (hingga 2000 MB / 2 GB). Unggahan menggunakan sistem chunked resumable Google Drive.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-icon">Pilihan Ikon</Label>
              <select
                id="cat-icon"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              >
                <option value="FolderArchive">Folder Umum</option>
                <option value="Camera">Kamera / Dokumentasi</option>
                <option value="GraduationCap">Topi Wisuda / Siswa</option>
                <option value="Award">Piagam / Penghargaan</option>
                <option value="Sparkles">Bintang / Kreasi Pojok</option>
              </select>
            </div>

            {editingId && (
              <div className="flex items-center justify-between rounded-xl border border-border/80 p-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="space-y-0.5">
                  <Label htmlFor="cat-active" className="cursor-pointer">Status Aktif</Label>
                  <p className="text-xs text-muted-foreground">
                    Tampilkan kategori ini pada formulir publik.
                  </p>
                </div>
                <Switch
                  id="cat-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Kategori"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
