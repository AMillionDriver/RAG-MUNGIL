import { useEffect, useState } from 'react';
import { Clock, ShieldCheck, GitCommit } from 'lucide-react';
import { timeAgo } from '../lib/ragData';

interface RunInfo {
  status: string;
  conclusion: string | null;
  createdAt: string;
  htmlUrl: string;
}

export default function GitHubWorkflowStatus() {
  const [run, setRun] = useState<RunInfo | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('https://api.github.com/repos/AMillionDriver/RAG-MUNGIL/actions/runs?per_page=1')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const latest = data.workflow_runs?.[0];
        if (!latest) throw new Error('tidak ada run tercatat');
        setRun({
          status: latest.status,
          conclusion: latest.conclusion,
          createdAt: latest.created_at,
          htmlUrl: latest.html_url,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="font-catalog-heading text-[16px] text-paper">Log ekspedisi situs</h2>
        <p className="text-[13px] text-paper-dim mt-1">
          Mesin otonom di repositori <code className="font-mono text-[12px]">AMillionDriver/RAG-MUNGIL</code>, disurvei ulang tanpa perlu laptop menyala.
        </p>
      </div>

      <div className="border-l-2 border-verdigris pl-3 py-1">
        {loadFailed && (
          <p className="text-[13px] text-paper-dim">Status ekspedisi terakhir tidak bisa dimuat — coba buka langsung ke tab Actions di repositori.</p>
        )}
        {!loadFailed && !run && (
          <p className="text-[13px] text-paper-dim">Memeriksa ekspedisi terakhir...</p>
        )}
        {run && (
          <a href={run.htmlUrl} target="_blank" rel="noreferrer" className="block group">
            <p className="text-[13px] text-paper">
              Ekspedisi terakhir:{' '}
              <span className={run.conclusion === 'success' ? 'text-verdigris' : 'text-oxide'}>
                {run.conclusion ?? run.status}
              </span>
            </p>
            <p className="text-[11px] text-paper-dim mt-0.5 group-hover:text-paper transition-colors">
              {timeAgo(run.createdAt)} — lihat detail run →
            </p>
          </a>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
        <div>
          <dt className="flex items-center gap-1.5 text-paper-dim mb-1">
            <Clock className="w-3.5 h-3.5" /> Jadwal
          </dt>
          <dd className="font-mono text-paper">0 */2 * * *</dd>
          <dd className="text-[11px] text-paper-dim mt-0.5">tiap 2 jam, UTC</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-paper-dim mb-1">
            <GitCommit className="w-3.5 h-3.5" /> Commit
          </dt>
          <dd className="text-paper">atomic + retry 3x</dd>
          <dd className="text-[11px] text-paper-dim mt-0.5">anti-race antar situs</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-paper-dim mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Dedup
          </dt>
          <dd className="text-paper">hash + fuzzy 82%</dd>
          <dd className="text-[11px] text-paper-dim mt-0.5">basmi fork/copy-paste</dd>
        </div>
      </dl>
    </div>
  );
}
