import { Modal } from './Modal'

const SHORTCUTS: Array<[string, string]> = [
  ['⌘K  /  Ctrl-K', 'Open command palette'],
  ['/', 'Search records'],
  ['g then d', 'Go to dashboard'],
  ['g then a', 'Go to audit log'],
  ['g then t', 'Jump to a table'],
  ['j / k', 'Move row cursor'],
  ['↵', 'Open focused row'],
  ['x', 'Toggle-select row'],
  ['⌘S', 'Save record'],
  ['?', 'This cheatsheet'],
  ['Esc', 'Close the top layer'],
]

export function KeyboardHelp({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <div className="grid grid-cols-1 gap-y-1.5">
        {SHORTCUTS.map(([keys, desc]) => (
          <div key={keys} className="flex items-center justify-between gap-4 text-[13px]">
            <span className="text-sec">{desc}</span>
            <span className="kbd whitespace-nowrap px-1.5">{keys}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
