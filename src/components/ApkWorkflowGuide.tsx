/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import JSZip from 'jszip';
import {
  Github,
  CheckCircle2,
  Copy,
  Download,
  Terminal,
  Smartphone,
  FolderArchive,
  ExternalLink,
  HelpCircle,
  FileCode2,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import {
  GRADLE_WRAPPER_PROPERTIES,
  SETTINGS_GRADLE,
  ROOT_BUILD_GRADLE,
  APP_BUILD_GRADLE,
  GRADLE_PROPERTIES,
  PROGUARD_RULES,
  ANDROID_MANIFEST,
  MAIN_ACTIVITY_KT,
  ACTIVITY_MAIN_XML,
  STYLES_XML,
  BG_URL_INPUT_XML,
  PROGRESS_BAR_XML,
  BACKUP_RULES_XML,
  DATA_EXTRACTION_RULES_XML,
  GITHUB_WORKFLOW_FIXED_YAML,
  GRADLEW_BASH
} from '../data/mungilProjectTemplate';

export default function ApkWorkflowGuide() {
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string>('workflow');

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(GITHUB_WORKFLOW_FIXED_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // 1. Workflow GitHub
      zip.file('.github/workflows/builder.yaml', GITHUB_WORKFLOW_FIXED_YAML);

      // 2. Gradle Root files
      zip.file('build.gradle.kts', ROOT_BUILD_GRADLE);
      zip.file('settings.gradle.kts', SETTINGS_GRADLE);
      zip.file('gradle.properties', GRADLE_PROPERTIES);
      zip.file('gradlew', GRADLEW_BASH, { unixPermissions: '755' });
      zip.file('gradle/wrapper/gradle-wrapper.properties', GRADLE_WRAPPER_PROPERTIES);

      // 3. App module
      zip.file('app/build.gradle.kts', APP_BUILD_GRADLE);
      zip.file('app/proguard-rules.pro', PROGUARD_RULES);
      zip.file('app/src/main/AndroidManifest.xml', ANDROID_MANIFEST);

      // 4. Kotlin Source
      zip.file('app/src/main/java/com/mungil/browser/MainActivity.kt', MAIN_ACTIVITY_KT);

      // 5. Layout & Resources
      zip.file('app/src/main/res/layout/activity_main.xml', ACTIVITY_MAIN_XML);
      zip.file('app/src/main/res/values/styles.xml', STYLES_XML);
      zip.file('app/src/main/res/drawable/bg_url_input.xml', BG_URL_INPUT_XML);
      zip.file('app/src/main/res/drawable/progress_bar_custom.xml', PROGRESS_BAR_XML);
      zip.file('app/src/main/res/xml/backup_rules.xml', BACKUP_RULES_XML);
      zip.file('app/src/main/res/xml/data_extraction_rules.xml', DATA_EXTRACTION_RULES_XML);

      // Generate & Download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mungil-Browser-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to create ZIP', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-6 sm:p-8 space-y-7">
      {/* Direct APK Download Highlight Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-black border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xl shadow-emerald-950/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-black text-[10px] font-bold tracking-wide uppercase">
              Rilis Terbaru v1.7.0
            </span>
            <span className="text-[11px] text-emerald-300/80 font-mono">
              Build Sukses (Run #48) • 5.8 MB
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-medium text-white tracking-tight">
            Mungil Browser APK Siap Diunduh
          </h4>
          <p className="text-xs text-white/70 max-w-xl leading-relaxed font-sans">
            Mencakup Chrome-style Downloader Manager terintegrasi, pemutaran langsung file media, auto-redirect handling, dan diagnosa error interaktif (Network vs Storage).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
          <a
            id="download-apk-direct-btn"
            href="/mungil-v1.7.0.apk"
            download="Mungil-Browser-v1.7.0.apk"
            className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-400/25"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Unduh APK Langsung (.apk)</span>
          </a>

          <a
            id="github-actions-artifact-btn"
            href="https://github.com/AMillionDriver/Mungil/actions/runs/34595982924"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat di GitHub Actions</span>
          </a>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium">
              Repo: AMillionDriver / Mungil
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase font-sans text-white/50">
              Android CI/CD Engine
            </span>
          </div>
          <h3 className="font-serif-display text-2xl text-white font-medium">
            Paket Proyek Android APK & GitHub Workflow
          </h3>
          <p className="text-xs text-white/60 font-sans max-w-2xl leading-relaxed">
            Penyebab status build <strong className="text-rose-400">Failure 0s</strong> sebelumnya karena repo Anda baru berisi file yaml kosong tanpa kode sumber Android. Unduh paket project ZIP di bawah ini dan unggah ke repo <code className="text-white bg-white/10 px-1 py-0.5 rounded">Mungil</code>, GitHub Actions akan langsung sukses merilis APK-nya!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyYaml}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border border-white/10"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'YAML Tersalin!' : 'Salin builder.yaml'}</span>
          </button>

          <button
            type="button"
            disabled={isZipping}
            onClick={handleDownloadZip}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {downloadSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-black" />
            ) : (
              <FolderArchive className="w-4 h-4" />
            )}
            <span>
              {isZipping
                ? 'Menyiapkan ZIP...'
                : downloadSuccess
                ? 'ZIP Berhasil Diunduh!'
                : 'Unduh Project ZIP (Siap Ekstrak)'}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Troubleshooting Box */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
        <div className="flex items-center gap-2 font-medium text-white">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Mengapa Error "Failure 0s" Terjadi di Repo Mungil?</span>
        </div>
        <p className="text-white/70 leading-relaxed">
          1. <strong>Belum ada Gradle Wrapper</strong>: GitHub Actions menjalankan perintah <code className="text-white bg-white/10 px-1 py-0.5 rounded">./gradlew assembleDebug</code>, namun di dalam repo Anda belum ada file <code className="text-white bg-white/10 px-1 py-0.5 rounded">gradlew</code> dan folder <code className="text-white bg-white/10 px-1 py-0.5 rounded">app/</code>.<br/>
          2. <strong>Solusi Mudah</strong>: Cukup unduh file <strong>Mungil-Browser-Android-Project.zip</strong> di atas, lalu ekstrak dan upload file-filenya ke repo GitHub Anda. Begitu ter-upload, GitHub Actions otomatis berjalan ~2 menit dan menghasilkan file APK di tab <em>Actions ➔ Artifacts</em>!
        </p>
      </div>

      {/* Step by step Setup */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2">
          <span>3 Langkah Mudah Mengaktifkan Build APK Otomatis:</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-sans">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-emerald-400">1</span>
              <span>Unduh & Ekstrak ZIP</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              Klik tombol hijau <strong>Unduh Project ZIP</strong> di atas. Ekstrak file zip tersebut di laptop atau lewat file manager ponsel Anda.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-emerald-400">2</span>
              <span>Upload ke Repo Mungil</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              Buka repo <a href="https://github.com/AMillionDriver/Mungil" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">github.com/AMillionDriver/Mungil</a>, klik <strong>Add file ➔ Upload files</strong> dan unggah seluruh isi folder yang telah diekstrak.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono text-emerald-400">3</span>
              <span>Unduh APK Jadi</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              Buka tab <strong>Actions</strong> di GitHub. Workflow <strong className="text-white">Build Mungil Android APK</strong> akan berwarna hijau (sukses). Buka detailnya lalu unduh <strong>Mungil-Browser-APK</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Project Structure Viewer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white/60" />
            <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
              Pratinjau Kode Sumber di Dalam Proyek
            </span>
          </div>

          {/* Selector */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/10 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedFilePreview('workflow')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                selectedFilePreview === 'workflow' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              builder.yaml
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilePreview('kotlin')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                selectedFilePreview === 'kotlin' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              MainActivity.kt
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilePreview('manifest')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                selectedFilePreview === 'manifest' ? 'bg-white text-black font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              AndroidManifest.xml
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10 overflow-x-auto max-h-[380px] font-mono text-xs text-white/80 leading-relaxed selection:bg-white/20">
          <pre>
            {selectedFilePreview === 'workflow' && GITHUB_WORKFLOW_FIXED_YAML}
            {selectedFilePreview === 'kotlin' && MAIN_ACTIVITY_KT}
            {selectedFilePreview === 'manifest' && ANDROID_MANIFEST}
          </pre>
        </div>
      </div>
    </div>
  );
}
