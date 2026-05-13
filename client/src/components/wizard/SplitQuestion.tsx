interface Props {
  onAnswer: (hasSplits: boolean) => void
}

export function SplitQuestion({ onAnswer }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-mono font-semibold mb-1">Ticket type</h2>
        <p className="text-sm text-dim font-sans">Are you travelling on split tickets for this journey?</p>
      </div>
      <div className="space-y-3">
        <button
          className="w-full card text-left hover:border-amber transition-colors group"
          onClick={() => onAnswer(true)}
        >
          <div className="font-mono font-semibold group-hover:text-amber">Yes, I have split tickets</div>
          <div className="text-xs text-dim font-sans mt-0.5">I bought separate tickets for different segments of this journey</div>
        </button>
        <button
          className="w-full card text-left hover:border-b2 transition-colors group"
          onClick={() => onAnswer(false)}
        >
          <div className="font-mono font-semibold group-hover:text-white">No, single through ticket</div>
          <div className="text-xs text-dim font-sans mt-0.5">One ticket covering the full journey</div>
        </button>
      </div>
    </div>
  )
}
