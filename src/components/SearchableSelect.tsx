import { useState, useRef, useEffect } from 'react'
import './SearchableSelect.css'

/**
 * Searchable select component with dropdown
 */
export const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  getOptionLabel = (option: any) => option.name || option,
  getOptionValue = (option: any) => option.name || option,
  className = ''
}: {
  options?: any[];
  value?: string;
  onChange: any;
  placeholder?: string;
  getOptionLabel?: (option: any) => string;
  getOptionValue?: (option: any) => string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = getOptionLabel(option).toLowerCase()
    return label.includes(searchTerm.toLowerCase())
  })

  // Get the selected option label
  const selectedOption = options.find(opt => getOptionValue(opt) === value)
  const displayValue = selectedOption ? getOptionLabel(selectedOption) : ''
  
  // Reset search term when value changes to empty and dropdown is closed
  useEffect(() => {
    if (!value && !isOpen) {
      setSearchTerm('')
    }
  }, [value, isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex]
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleInputChange = (e: any) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearchTerm('')
  }

  const handleSelect = (option: any) => {
    const optionValue = getOptionValue(option)
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
    // If value prop is empty, reset the input after a brief delay to allow onChange to process
    if (!value) {
      setTimeout(() => {
        setSearchTerm('')
      }, 0)
    }
  }

  const handleKeyDown = (e: any) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      setIsOpen(true)
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
      default:
        break
    }
  }

  const handleClear = (e: any) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
    setIsOpen(false)
  }

  return (
    <div className={`searchable-select ${className}`} ref={containerRef}>
      <div className="searchable-select-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="searchable-select-input"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        <div className="searchable-select-icons">
          {value && (
            <button
              type="button"
              className="searchable-select-clear"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
          <span className="searchable-select-arrow">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>
      
      {isOpen && (
        <div className="searchable-select-dropdown" ref={dropdownRef}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option: any, index: any) => {
              const optionValue = getOptionValue(option)
              const optionLabel = getOptionLabel(option)
              const isSelected = optionValue === value
              const isHighlighted = index === highlightedIndex

              return (
                <div
                  key={optionValue}
                  className={`searchable-select-option ${
                    isSelected ? 'selected' : ''
                  } ${isHighlighted ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {optionLabel}
                </div>
              )
            })
          ) : (
            <div className="searchable-select-no-results">
              No players found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableSelect

