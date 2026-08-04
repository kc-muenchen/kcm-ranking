import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react'
import { springSnappy } from '../lib/motion'

/**
 * Searchable combobox.
 *
 * Keyboard behaviour (arrow navigation, enter to commit, escape to dismiss) is
 * preserved from the original; the presentation and ARIA wiring are new.
 */
export const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No matches',
  getOptionLabel = (option: any) => option.name || option,
  getOptionValue = (option: any) => option.name || option,
  className = ''
}: {
  options?: any[]
  value?: string
  onChange: any
  placeholder?: string
  emptyMessage?: string
  getOptionLabel?: (option: any) => string
  getOptionValue?: (option: any) => string
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const filteredOptions = options.filter(option =>
    getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedOption = options.find(opt => getOptionValue(opt) === value)
  const displayValue = selectedOption ? getOptionLabel(selectedOption) : ''

  useEffect(() => {
    if (!value && !isOpen) setSearchTerm('')
  }, [value, isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      dropdownRef.current.children[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (option: any) => {
    onChange(getOptionValue(option))
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (event: any) => {
    if (!isOpen && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      setIsOpen(true)
      return
    }
    if (!isOpen) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        event.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
      default:
        break
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`flex items-center gap-2 rounded-md border bg-surface px-2.5 transition-colors ${
          isOpen ? 'border-accent' : 'border-line hover:border-line-strong'
        }`}
      >
        <MagnifyingGlass size={14} weight="bold" className="shrink-0 text-fg-faint" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-fg outline-none placeholder:text-fg-faint"
          value={isOpen ? searchTerm : displayValue}
          onChange={event => {
            setSearchTerm(event.target.value)
            setHighlightedIndex(-1)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => {
            setIsOpen(true)
            setSearchTerm('')
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={event => {
              event.stopPropagation()
              onChange('')
              setSearchTerm('')
              setIsOpen(false)
            }}
            aria-label="Clear selection"
            className="tactile shrink-0 rounded-xs p-0.5 text-fg-faint hover:text-fg"
          >
            <X size={12} weight="bold" />
          </button>
        )}
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={springSnappy} className="flex shrink-0">
          <CaretDown size={12} weight="bold" className="text-fg-faint" />
        </motion.span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={springSnappy}
            className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-line-strong bg-surface-2 shadow-[var(--shadow-overlay)]"
          >
            <div ref={dropdownRef} className="max-h-64 overflow-y-auto" role="listbox">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option: any, index: number) => {
                  const optionValue = getOptionValue(option)
                  const isSelected = optionValue === value
                  const isHighlighted = index === highlightedIndex

                  return (
                    <div
                      key={optionValue}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`cursor-pointer border-l-2 px-3 py-2 text-sm transition-colors ${
                        isSelected
                          ? 'border-accent bg-accent/10 text-accent'
                          : isHighlighted
                            ? 'border-line-strong bg-surface-3 text-fg'
                            : 'border-transparent text-fg-dim'
                      }`}
                    >
                      {getOptionLabel(option)}
                    </div>
                  )
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-fg-faint">{emptyMessage}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchableSelect
