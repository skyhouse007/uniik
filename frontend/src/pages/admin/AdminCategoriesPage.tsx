import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { adminDelete, adminGet, adminHeaders, adminPost, adminPut } from '../../api/adminClient'

type Category = { _id: string; name: string; image?: string; parentId?: string | null; sortOrder?: number }

function parentKey(c: Category): string | null {
  if (c.parentId == null || c.parentId === '') return null
  return String(c.parentId)
}

function sortSiblings(a: Category, b: Category) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
}

function CategoryListRow({
  cat,
  items,
  reorderBusy,
  canUp,
  canDown,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  cat: Category
  items: Category[]
  reorderBusy: boolean
  canUp: boolean
  canDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const parentLabel =
    cat.parentId == null || cat.parentId === ''
      ? 'Top level'
      : (items.find((x) => x._id === cat.parentId)?.name ?? 'Unknown parent')
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--border))] p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {cat.image ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <img src={cat.image} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-dashed border-[rgb(var(--border))] text-[10px] text-[rgb(var(--muted))]">
            No photo
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{cat.name}</div>
          <div className="truncate text-xs text-[rgb(var(--muted))]">Parent: {parentLabel}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-xl border border-[rgb(var(--border))]">
          <button
            type="button"
            disabled={!canUp || reorderBusy}
            title="Move up"
            onClick={onMoveUp}
            className="px-2.5 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition enabled:hover:bg-[rgb(var(--surface))] disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!canDown || reorderBusy}
            title="Move down"
            onClick={onMoveDown}
            className="border-l border-[rgb(var(--border))] px-2.5 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition enabled:hover:bg-[rgb(var(--surface))] disabled:opacity-30"
          >
            ↓
          </button>
        </div>
        <button
          type="button"
          className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-xs font-semibold"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
          onClick={() => void onDelete()}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [parentId, setParentId] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [reorderBusy, setReorderBusy] = useState(false)

  const grouped = useMemo(() => {
    if (!items) return null
    const roots = items.filter((c) => parentKey(c) === null).sort(sortSiblings)
    const childrenByParent = new Map<string, Category[]>()
    for (const c of items) {
      const pk = parentKey(c)
      if (pk === null) continue
      if (!childrenByParent.has(pk)) childrenByParent.set(pk, [])
      childrenByParent.get(pk)!.push(c)
    }
    for (const arr of childrenByParent.values()) arr.sort(sortSiblings)
    return { roots, childrenByParent }
  }, [items])

  async function load() {
    setError('')
    const res = await adminGet<{ items: Category[] }>('/categories')
    setItems(res.items)
  }

  useEffect(() => {
    load().catch((e: any) => setError(e?.response?.data?.error ?? 'Failed to load categories'))
  }, [])

  const canSubmit = useMemo(() => name.trim().length >= 2, [name])

  const moveCategory = useCallback(
    async (cat: Category, delta: number) => {
      if (!items?.length) return
      const p = parentKey(cat)
      const sibs = items.filter((x) => parentKey(x) === p).sort(sortSiblings)
      const i = sibs.findIndex((x) => x._id === cat._id)
      const j = i + delta
      if (i < 0 || j < 0 || j >= sibs.length) return
      setReorderBusy(true)
      setError('')
      try {
        const next = [...sibs]
        const [row] = next.splice(i, 1)
        next.splice(j, 0, row)
        const res = await adminPost<{ items: Category[] }>('/categories/reorder', {
          parentId: p,
          orderedIds: next.map((x) => x._id),
        })
        setItems(res.items)
      } catch (e: any) {
        setError(e?.response?.data?.error ?? 'Reorder failed')
      } finally {
        setReorderBusy(false)
      }
    },
    [items],
  )

  async function uploadCategoryPhoto(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploadingImage(true)
    setError('')
    try {
      const folder = editing?._id
        ? `uniik/categories/${editing._id}`
        : 'uniik/categories/tmp'
      const sigRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}/admin/uploads/signature?folder=${encodeURIComponent(folder)}`,
        { headers: adminHeaders() as Record<string, string> },
      )
      if (!sigRes.ok) throw new Error('Failed to get upload signature')
      const sig = await sigRes.json()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sig.apiKey)
      formData.append('timestamp', String(sig.timestamp))
      formData.append('folder', sig.folder)
      formData.append('signature', sig.signature)
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const json = await up.json()
      if (!up.ok) throw new Error(json?.error?.message ?? 'Upload failed')
      setImage(json.secure_url as string)
    } catch (e: any) {
      setError(e?.message ?? 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        image: image.trim() || undefined,
        parentId: parentId || null,
      }
      if (editing) await adminPut(`/categories/${editing._id}`, payload)
      else await adminPost(`/categories`, payload)
      setName('')
      setImage('')
      setParentId('')
      setEditing(null)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Helmet>
        <title>Admin Categories — CozyFoam</title>
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold">Categories</div>
          <div className="mt-1 text-sm text-[rgb(var(--muted))]">Create and manage storefront categories</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">{editing ? 'Edit category' : 'New category'}</div>
          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name (e.g. Memory Foam)"
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
            />
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[rgb(var(--muted))]">Category photo</div>
              {image.trim() ? (
                <div className="flex items-start gap-3">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
                    <img src={image.trim()} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                  >
                    Remove photo
                  </button>
                </div>
              ) : null}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-semibold">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void uploadCategoryPhoto(e.target.files)}
                />
                {uploadingImage ? 'Uploading…' : 'Upload photo (Cloudinary)'}
              </label>
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Or paste image URL"
                className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
              />
            </div>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm outline-none focus:border-[rgb(var(--brand))]"
            >
              <option value="">Top level category</option>
              {(items ?? [])
                .filter((c) => !editing || c._id !== editing._id)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {error ? <div className="text-xs text-red-600">{error}</div> : null}
            <div className="flex gap-2">
              <button
                disabled={!canSubmit || saving || uploadingImage}
                onClick={submit}
                className="flex-1 rounded-xl bg-[rgb(var(--brand))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
              {editing ? (
                <button
                  onClick={() => {
                    setEditing(null)
                    setName('')
                    setImage('')
                    setParentId('')
                  }}
                  className="rounded-xl border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">All categories</div>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            Use ↑ ↓ to set order. Top-level order is separate from each parent’s child order. The storefront uses the
            same order.
          </p>
          <div className="mt-4 space-y-6">
            {items === null ? (
              <div className="text-sm text-[rgb(var(--muted))]">Loading…</div>
            ) : !grouped?.roots.length ? (
              <div className="text-sm text-[rgb(var(--muted))]">No categories yet.</div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    Top level
                  </div>
                  <div className="mt-2 grid gap-2">
                    {grouped.roots.map((c, idx) => (
                      <CategoryListRow
                        key={c._id}
                        cat={c}
                        items={items}
                        reorderBusy={reorderBusy}
                        canUp={idx > 0}
                        canDown={idx < grouped.roots.length - 1}
                        onMoveUp={() => void moveCategory(c, -1)}
                        onMoveDown={() => void moveCategory(c, 1)}
                        onEdit={() => {
                          setEditing(c)
                          setName(c.name)
                          setImage(c.image ?? '')
                          setParentId(c.parentId ?? '')
                        }}
                        onDelete={async () => {
                          if (!confirm('Delete this category?')) return
                          await adminDelete(`/categories/${c._id}`)
                          await load()
                        }}
                      />
                    ))}
                  </div>
                </div>
                {grouped.roots.map((parent) => {
                  const kids = grouped.childrenByParent.get(parent._id) ?? []
                  if (!kids.length) return null
                  return (
                    <div key={parent._id}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        Under “{parent.name}”
                      </div>
                      <div className="mt-2 grid gap-2">
                        {kids.map((c, idx) => (
                          <CategoryListRow
                            key={c._id}
                            cat={c}
                            items={items}
                            reorderBusy={reorderBusy}
                            canUp={idx > 0}
                            canDown={idx < kids.length - 1}
                            onMoveUp={() => void moveCategory(c, -1)}
                            onMoveDown={() => void moveCategory(c, 1)}
                            onEdit={() => {
                              setEditing(c)
                              setName(c.name)
                              setImage(c.image ?? '')
                              setParentId(c.parentId ?? '')
                            }}
                            onDelete={async () => {
                              if (!confirm('Delete this category?')) return
                              await adminDelete(`/categories/${c._id}`)
                              await load()
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

