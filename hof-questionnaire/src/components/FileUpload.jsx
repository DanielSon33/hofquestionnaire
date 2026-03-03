import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * FileUpload — lets users upload multiple files to Supabase Storage.
 * Stored URLs are saved as a JSON array in the responses table.
 */
export default function FileUpload({ fieldKey, customerId, value = [], onChange, colors, lang = 'de' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // value is an array of { name, url } objects (or stored as JSON string)
  const files = Array.isArray(value) ? value : (() => {
    try { return JSON.parse(value) } catch { return [] }
  })()

  const labels = lang === 'de'
    ? { btn: 'Dateien hochladen', uploading: 'Wird hochgeladen …', remove: 'Entfernen', hint: 'Mehrere Dateien möglich' }
    : { btn: 'Upload files', uploading: 'Uploading …', remove: 'Remove', hint: 'Multiple files allowed' }

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles?.length) return
    setUploading(true)
    setError(null)

    const newFiles = [...files]
    for (const file of Array.from(selectedFiles)) {
      const ext = file.name.split('.').pop()
      const path = `${customerId || 'anon'}/${fieldKey}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('questionnaire-uploads')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) {
        setError(uploadErr.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('questionnaire-uploads')
        .getPublicUrl(path)

      newFiles.push({ name: file.name, url: urlData.publicUrl })
    }

    onChange(newFiles)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (index) => {
    const next = files.filter((_, i) => i !== index)
    onChange(next)
  }

  const borderCls = colors?.inputBorder || 'border-ink/20'
  const bgCls = colors?.inputBg || 'bg-black/5'
  const textCls = colors?.text || 'text-ink'
  const subCls = colors?.subtext || 'text-ink/50'
  const btnCls = colors?.btnSecondary || 'border-ink/20 text-ink/60 hover:border-ink/60 hover:text-ink'

  return (
    <div className="w-full space-y-3">
      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className={`rounded-2xl border p-4 space-y-2 ${borderCls} ${bgCls}`}>
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-lg ${textCls}`}>📎</span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`font-mono text-xs truncate underline underline-offset-2 ${textCls} hover:opacity-70`}
                >
                  {f.name}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className={`shrink-0 font-mono text-xs rounded-full border px-3 py-1 transition ${btnCls}`}
              >
                {labels.remove}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-mono text-sm tracking-widest uppercase transition disabled:opacity-40 ${btnCls}`}
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span>
              {labels.uploading}
            </>
          ) : (
            <>
              ↑ {labels.btn}
            </>
          )}
        </button>
        <p className={`mt-2 text-xs font-mono ${subCls}`}>{labels.hint}</p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400 font-mono text-xs">{error}</p>
      )}
    </div>
  )
}
