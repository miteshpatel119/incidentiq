import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Clock,
  Code,
  Copy,
  Download,
  FileText,
  GitCommit,
  HelpCircle,
  List,
  Server,
  Shield,
  Terminal,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type {
  CodeFixSuggestion,
  ConfigFixSuggestion,
  EvidenceItem,
  RCAResult,
  TimelineEvent,
  PreventiveAction,
  PrioritizedRemediation,
  KubectlCommands,
} from '@/features/incidents/investigationTypes'

interface RCAResultViewProps {
  readonly result: RCAResult
  readonly incidentId: string
}

function ConfidenceMeter({
  score,
  supportingSignals,
}: {
  readonly score: number
  readonly supportingSignals?: readonly string[]
}): JSX.Element {
  const color =
    score >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : score >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400'

  const bgColor =
    score >= 80
      ? 'bg-emerald-500/15 dark:bg-emerald-500/25'
      : score >= 60
        ? 'bg-amber-500/15 dark:bg-amber-500/25'
        : 'bg-rose-500/15 dark:bg-rose-500/25'

  const barColor =
    score >= 80
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : score >= 60
        ? 'bg-amber-500 dark:bg-amber-400'
        : 'bg-rose-500 dark:bg-rose-400'

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Confidence score</p>
          <p className={cn('mt-1 text-3xl font-bold tracking-tight', color)}>{score}%</p>
        </div>
        <div className={cn('rounded-xl p-3', bgColor)}>
          <TrendingUp className={cn('h-6 w-6', color)} />
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      {supportingSignals && supportingSignals.length > 0 ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
            Supporting signals
          </p>
          <ul className="space-y-0.5">
            {supportingSignals.map((signal, index) => (
              <li className="flex items-center gap-1 text-[10px] text-muted-foreground" key={index}>
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function EvidenceCard({ evidence }: { readonly evidence: readonly EvidenceItem[] }): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayItems = isExpanded ? evidence : evidence.slice(0, 3)

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Evidence ({evidence.length})
      </h3>
      <div className="space-y-3">
        {displayItems.map((item, index) => (
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3" key={index}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <div className="flex items-center gap-1">
                {item.confidence !== undefined ? (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {item.confidence}%
                  </span>
                ) : null}
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                    item.severity === 'critical'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      : item.severity === 'supporting'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
                  )}
                >
                  {item.severity}
                </span>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/60">Source: {item.source}</p>
          </div>
        ))}
      </div>
      {evidence.length > 3 ? (
        <button
          className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded((prev) => !prev)}
          type="button"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" />
              Show {evidence.length - 3} more
            </>
          )}
        </button>
      ) : null}
    </div>
  )
}

function TimelineCard({ timeline }: { readonly timeline: readonly TimelineEvent[] }): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayItems = isExpanded ? timeline : timeline.slice(0, 5)

  const typeColors: Record<string, string> = {
    error: 'border-l-rose-500 bg-rose-500/5',
    warning: 'border-l-amber-500 bg-amber-500/5',
    info: 'border-l-primary bg-primary/5',
    change: 'border-l-emerald-500 bg-emerald-500/5',
  }

  const typeIcons: Record<string, React.ReactNode> = {
    error: <AlertTriangle className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />,
    info: <Clock className="h-3.5 w-3.5 text-primary" />,
    change: <GitCommit className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />,
  }

  const categoryIcons: Record<string, string> = {
    Change: '🔧',
    Deployment: '🚀',
    Metric: '📊',
    'Application Log': '📝',
    'Infrastructure Log': '🖥️',
    'Kubernetes Event': '⚙️',
    'Customer Impact': '👥',
    Recovery: '✅',
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Incident timeline ({timeline.length})
      </h3>
      <div className="space-y-2">
        {displayItems.map((event, index) => (
          <div
            className={cn(
              'rounded-r-lg border-l-2 py-3 pl-4',
              typeColors[event.type] ?? 'border-l-border bg-secondary/10',
            )}
            key={index}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {typeIcons[event.type] ?? <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="font-mono text-[10px] text-muted-foreground">
                  {event.timestamp}
                </span>
              </div>
              {event.category ? (
                <span className="text-[10px] text-muted-foreground/60" title={event.category}>
                  {categoryIcons[event.category] ?? '•'} {event.category}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm font-medium">{event.event}</p>
              {event.severity ? (
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                    event.severity === 'critical'
                      ? 'bg-rose-500/15 text-rose-700'
                      : event.severity === 'high'
                        ? 'bg-amber-500/15 text-amber-700'
                        : event.severity === 'medium'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-slate-500/15 text-slate-700',
                  )}
                >
                  {event.severity}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
          </div>
        ))}
      </div>
      {timeline.length > 5 ? (
        <button
          className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded((prev) => !prev)}
          type="button"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" />
              Show {timeline.length - 5} more
            </>
          )}
        </button>
      ) : null}
    </div>
  )
}

function CodeFixCard({ fixes }: { readonly fixes: readonly CodeFixSuggestion[] }): JSX.Element {
  if (fixes.length === 0) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Code className="h-4 w-4" />
        Code fix suggestions
      </h3>
      <div className="space-y-4">
        {fixes.map((fix, index) => (
          <div key={index}>
            <p className="mb-1 text-sm font-medium text-foreground">{fix.file}</p>
            <p className="mb-2 text-xs text-muted-foreground">{fix.explanation}</p>
            {fix.why ? (
              <p className="mb-1 text-[10px] text-muted-foreground/80">
                <span className="font-medium">Why:</span> {fix.why}
              </p>
            ) : null}
            {fix.expectedImpact ? (
              <p className="mb-2 text-[10px] text-emerald-600">
                <span className="font-medium">Expected Impact:</span> {fix.expectedImpact}
              </p>
            ) : null}
            {fix.risks && fix.risks.length > 0 ? (
              <p className="mb-2 text-[10px] text-amber-600">
                <span className="font-medium">Risks:</span> {fix.risks.join(', ')}
              </p>
            ) : null}
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="flex border-b border-border bg-secondary/40 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
                <span className="flex-1">Before</span>
                <span className="text-rose-400">—</span>
              </div>
              <pre className="overflow-x-auto bg-[#0d1117] p-3 text-[11px] leading-relaxed text-rose-300">
                <code>{fix.before}</code>
              </pre>
              <div className="flex border-b border-t border-border bg-secondary/40 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
                <span className="flex-1">After</span>
                <span className="text-emerald-400">+</span>
              </div>
              <pre className="overflow-x-auto bg-[#0d1117] p-3 text-[11px] leading-relaxed text-emerald-300">
                <code>{fix.after}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfigFixCard({ fixes }: { readonly fixes: readonly ConfigFixSuggestion[] }): JSX.Element {
  if (fixes.length === 0) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Server className="h-4 w-4" />
        Configuration fixes
      </h3>
      <div className="space-y-3">
        {fixes.map((fix, index) => (
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-3" key={index}>
            <p className="text-sm font-medium">{fix.key}</p>
            <p className="mt-1 text-xs text-muted-foreground">{fix.explanation}</p>
            {fix.rollbackRecommendation ? (
              <p className="mt-1 text-[10px] text-primary">
                <span className="font-medium">Rollback:</span> {fix.rollbackRecommendation}
              </p>
            ) : null}
            {fix.expectedImpact ? (
              <p className="mt-1 text-[10px] text-emerald-600">
                <span className="font-medium">Impact:</span> {fix.expectedImpact}
              </p>
            ) : null}
            <div className="mt-2 flex items-center gap-2 font-mono text-xs">
              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-300 line-through">
                {fix.before}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300">
                {fix.after}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ArrowRight({ className }: { readonly className?: string }): JSX.Element {
  return (
    <svg
      className={className}
      fill="none"
      height="12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="12"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function CommandsCard({ commands }: { readonly commands: readonly string[] }): JSX.Element {
  if (commands.length === 0) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Terminal className="h-4 w-4" />
        Recommended commands
      </h3>
      <div className="space-y-2">
        {commands.map((command, index) => (
          <div
            className="flex items-center justify-between rounded-lg bg-[#0d1117] px-3 py-2"
            key={index}
          >
            <code className="text-xs text-emerald-300">{command}</code>
            <button
              aria-label="Copy command"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => void navigator.clipboard.writeText(command)}
              type="button"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function KubectlCommandsCard({ commands }: { readonly commands: KubectlCommands }): JSX.Element {
  if (
    !commands ||
    (!commands.investigation.length &&
      !commands.recovery.length &&
      !commands.verification.length &&
      !commands.monitoring.length)
  )
    return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Terminal className="h-4 w-4" />
        kubectl Commands
      </h3>
      <div className="space-y-4">
        {commands.investigation.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
              Investigation
            </p>
            <div className="space-y-2">
              {commands.investigation.map((cmd, i) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-[#0d1117] px-3 py-2"
                  key={i}
                >
                  <code className="text-xs text-emerald-300">{cmd}</code>
                  <button onClick={() => void navigator.clipboard.writeText(cmd)} type="button">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {commands.recovery.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">Recovery</p>
            <div className="space-y-2">
              {commands.recovery.map((cmd, i) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-[#0d1117] px-3 py-2"
                  key={i}
                >
                  <code className="text-xs text-emerald-300">{cmd}</code>
                  <button onClick={() => void navigator.clipboard.writeText(cmd)} type="button">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {commands.verification.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
              Verification
            </p>
            <div className="space-y-2">
              {commands.verification.map((cmd, i) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-[#0d1117] px-3 py-2"
                  key={i}
                >
                  <code className="text-xs text-emerald-300">{cmd}</code>
                  <button onClick={() => void navigator.clipboard.writeText(cmd)} type="button">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {commands.monitoring.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
              Monitoring
            </p>
            <div className="space-y-2">
              {commands.monitoring.map((cmd, i) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-[#0d1117] px-3 py-2"
                  key={i}
                >
                  <code className="text-xs text-emerald-300">{cmd}</code>
                  <button onClick={() => void navigator.clipboard.writeText(cmd)} type="button">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function BusinessImpactCard({ impact }: { impact: RCAResult['businessImpact'] }): JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Users className="h-4 w-4" />
        Business impact
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-secondary/20 p-3">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">
            Customers affected
          </p>
          <p className="mt-1 text-sm font-semibold">{impact.customersAffected}</p>
        </div>
        <div className="rounded-lg bg-secondary/20 p-3">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Revenue at risk</p>
          <p className="mt-1 text-sm font-semibold">{impact.revenueAtRisk}</p>
        </div>
        <div className="rounded-lg bg-secondary/20 p-3">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">SLA impact</p>
          <p className="mt-1 text-sm font-semibold">{impact.sla}</p>
        </div>
        <div className="rounded-lg bg-secondary/20 p-3">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Blast radius</p>
          <p className="mt-1 text-sm font-semibold">{impact.blastRadius}</p>
        </div>
      </div>
    </div>
  )
}

function RemediationCard({
  remediation,
}: {
  readonly remediation: readonly PrioritizedRemediation[]
}): JSX.Element {
  if (!remediation || remediation.length === 0) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <List className="h-4 w-4" />
        Remediation steps
      </h3>
      <div className="space-y-4">
        {remediation.map((r) => (
          <div key={r.priority} className="rounded-lg border border-border/50 bg-secondary/20 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  r.priority === 1
                    ? 'bg-rose-500/20 text-rose-700'
                    : r.priority === 2
                      ? 'bg-amber-500/20 text-amber-700'
                      : r.priority === 3
                        ? 'bg-emerald-500/20 text-emerald-700'
                        : 'bg-primary/20 text-primary',
                )}
              >
                {r.priority}
              </span>
              <p className="text-sm font-medium">{r.title}</p>
            </div>
            <ul className="space-y-1 pl-8">
              {r.steps.map((step, i) => (
                <li className="text-xs text-muted-foreground" key={i}>
                  • {step}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreventiveActionsCard({
  actions,
}: {
  readonly actions: readonly PreventiveAction[]
}): JSX.Element {
  if (!actions || actions.length === 0) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Shield className="h-4 w-4" />
        Preventive actions
      </h3>
      <div className="space-y-4">
        {actions.map((a, index) => (
          <div key={index}>
            <p
              className={cn(
                'mb-2 text-xs font-semibold uppercase',
                a.timeframe === 'Short Term'
                  ? 'text-rose-600'
                  : a.timeframe === 'Medium Term'
                    ? 'text-amber-600'
                    : 'text-emerald-600',
              )}
            >
              {a.timeframe}
            </p>
            {a.actions && a.actions.length > 0 ? (
              <ul className="space-y-1 pl-4">
                {a.actions.map((action, i) => (
                  <li className="text-xs text-muted-foreground" key={i}>
                    • {action}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function LessonsLearnedCard({ lessons }: { readonly lessons?: readonly string[] }): JSX.Element {
  if (!lessons || lessons.length === 0) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        Lessons learned
      </h3>
      <ol className="list-inside space-y-2">
        {lessons.map((lesson, index) => (
          <li className="text-sm text-muted-foreground" key={index}>
            <span className="font-medium text-primary">{index + 1}.</span> {lesson}
          </li>
        ))}
      </ol>
    </div>
  )
}

function SeverityExplanationCard({ explanation }: { readonly explanation?: string }): JSX.Element {
  if (!explanation) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <AlertTriangle className="h-4 w-4" />
        Incident severity explanation
      </h3>
      <p className="text-sm leading-relaxed text-foreground">{explanation}</p>
    </div>
  )
}

function ExecutiveSummaryCard({ summary }: { readonly summary?: string }): JSX.Element {
  if (!summary) return <></>

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <FileText className="h-4 w-4" />
        Executive summary
      </h3>
      <p className="text-sm leading-relaxed text-foreground">{summary}</p>
    </div>
  )
}

export function RCAResultView({ result, incidentId }: RCAResultViewProps): JSX.Element {
  const reportRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyReport = useCallback(() => {
    if (reportRef.current === null) return
    const text = reportRef.current.textContent
    if (text === null) return
    void navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleDownloadPDF = useCallback(() => {
    const remediationText =
      result.remediation && result.remediation.length > 0
        ? result.remediation
            .map((r) => `${r.priority}. ${r.title}: ${r.steps.join(', ')}`)
            .join('\n')
        : ''

    const preventiveText =
      result.preventiveActions && result.preventiveActions.length > 0
        ? result.preventiveActions
            .flatMap((a) => a.actions.map((s) => `[${a.timeframe}] ${s}`))
            .join('\n')
        : ''

    const content = `
INCIDENT IQ - ROOT CAUSE ANALYSIS
Incident: ${incidentId}
Root Cause: ${result.rootCause}
Confidence: ${result.confidenceScore}%
Summary: ${result.summary}

Technical Impact: ${result.technicalImpact}

Remediation:
${remediationText}

Verification Steps:
${result.verificationSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Preventive Actions:
${preventiveText}

Post-Incident Report:
${result.postIncidentReport}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RCA-${incidentId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [result, incidentId])

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Root cause analysis
          </p>
          <h2 className="text-md break-words leading-7 tracking-tight">{result.rootCause}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{result.summary}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={handleCopyReport} size="sm" variant="outline">
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Clipboard className="h-3.5 w-3.5" />
                Copy report
              </>
            )}
          </Button>
          <Button onClick={handleDownloadPDF} size="sm" variant="outline">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Executive Summary & Severity Explanation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ExecutiveSummaryCard summary={result.executiveSummary} />
        <SeverityExplanationCard explanation={result.incidentSeverityExplanation} />
      </div>

      {/* Confidence + Business Impact */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ConfidenceMeter
            score={result.confidenceScore}
            supportingSignals={result.confidenceAnalysis?.supportingSignals}
          />
        </div>
        <div className="lg:col-span-2">
          <BusinessImpactCard impact={result.businessImpact} />
        </div>
      </div>

      {/* Evidence + Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EvidenceCard evidence={result.evidence} />
        <TimelineCard timeline={result.timeline} />
      </div>

      {/* Technical Impact & Remediation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Technical impact
          </h3>
          <p className="text-sm leading-relaxed text-foreground">{result.technicalImpact}</p>
        </div>
        <RemediationCard remediation={result.remediation} />
      </div>

      {/* Verification Steps & Preventive Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Verification steps
          </h3>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {result.verificationSteps.map((step, index) => (
              <li className="text-muted-foreground" key={index}>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <PreventiveActionsCard actions={result.preventiveActions} />
      </div>

      {/* Lessons Learned */}
      <LessonsLearnedCard lessons={result.lessonsLearned} />

      {/* Code Fixes */}
      <CodeFixCard fixes={result.codeFixes} />

      {/* Config Fixes */}
      <ConfigFixCard fixes={result.configFixes} />

      {/* kubectl Commands */}
      <KubectlCommandsCard commands={result.kubectlCommands!} />

      {/* Commands */}
      <CommandsCard commands={result.recommendedCommands} />

      {/* Post-Incident Report */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <FileText className="h-4 w-4" />
          Post-incident report
        </h3>
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {result.postIncidentReport}
          </p>
        </div>
      </div>
    </div>
  )
}
