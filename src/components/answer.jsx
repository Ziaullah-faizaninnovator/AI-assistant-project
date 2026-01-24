// components/answer.jsx
export function Answer({ ans }) {
  return (
    <div className="p-3 bg-zinc-700/50 rounded-lg mb-2">
      <p className="whitespace-pre-wrap">{ans}</p>
    </div>
  )
}