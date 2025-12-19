import { useMemo, useState } from 'react'
import { MaterialReactTable } from 'material-react-table'
import './RankingTable.css'

function RankingTable({ players, viewMode, onPlayerSelect, selectedSeason }) {
  const [copied, setCopied] = useState(false)

  const getMedalEmoji = (place) => {
    if (place === 1) return '🥇'
    if (place === 2) return '🥈'
    if (place === 3) return '🥉'
    return place
  }

  const exportToWhatsApp = async () => {
    // Sort players by place (ascending) for export, limit to first 25
    const sortedForExport = [...players].sort((a, b) => a.place - b.place).slice(0, 25)
    
    // Format as WhatsApp message
    const seasonText = selectedSeason ? ` ${selectedSeason}` : ''
    let message = `🏆 *Season Rankings${seasonText}*\n\n`
    
    sortedForExport.forEach((player, index) => {
      const place = player.place
      const medal = getMedalEmoji(place)
      const name = player.name
      const points = player.seasonPoints
      
      // Add qualification badges if applicable
      let statusBadge = ''
      if (player.finaleStatus === 'qualified') {
        statusBadge = ' ✓'
      } else if (player.finaleStatus === 'successor') {
        statusBadge = ' →'
      }
      
      message += `${place <= 3 ? medal : place + '.'} ${name} - ${points} pts${statusBadge}\n`
    })

    // Add season points calculation info (in German)
    message += `\n📊 *Punkteberechnung:*\n`
    message += `Punkte basierend auf Endplatzierung (1.: 25, 2.: 20, 3.: 16, 4.: 13, 5.: 10) plus 1 Anwesenheitspunkt für alle.\n`
    message += `Plätze 5-16 erhalten alle 11 Punkte (z.B. 1. Platz = 26 Gesamtpunkte, 5.-16. Platz = 11 Gesamtpunkte, 17.+ Platz = 1 Gesamtpunkt)\n\n`
    message += `*Qualifikation:*\n`
    message += `Mindestens 10 Turnierteilnahmen erforderlich. Top 20 Spieler sind qualifiziert für das Saisonfinale.`
        
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = message
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  // Define columns based on viewMode
  const columns = useMemo(() => {
    const cols = []

    // Rank column
    cols.push({
      accessorKey: viewMode === 'tournament' ? 'finalPlace' : 'place',
      id: 'rank',
      header: viewMode === 'tournament' ? 'Final' : 'Rank',
      size: 80,
      Cell: ({ row }) => {
        const player = row.original
        const displayPlace = viewMode === 'tournament' ? player.finalPlace : player.place
        return (
          <div className="rank-cell">
            <span className="rank-badge">
              {getMedalEmoji(displayPlace)}
            </span>
            {player.finaleStatus === 'qualified' && (
              <span className="finale-badge qualified" title="Qualified for Season Finale">✓</span>
            )}
            {player.finaleStatus === 'successor' && (
              <span className="finale-badge successor" title="Potential Successor">→</span>
            )}
          </div>
        )
      }
    })

    // Name column
    cols.push({
      accessorKey: 'name',
      id: 'name',
      header: 'Player',
      size: 200,
      Cell: ({ row }) => {
        const player = row.original
        return (
          <div className="name-cell">
            <div className="player-info">
              <a 
                href={`?player=${encodeURIComponent(player.name)}`}
                className="player-name clickable" 
                onClick={(e) => {
                  e.preventDefault()
                  onPlayerSelect && onPlayerSelect(player.name)
                }}
                title="Click to view player details (right-click to open in new tab)"
              >
                {player.name}
              </a>
              {player.external && (
                <span className="player-license">
                  {player.external.nationalLicence}
                </span>
              )}
            </div>
          </div>
        )
      }
    })

    // View-specific columns
    if (viewMode === 'overall' || viewMode === 'season') {
      cols.push(
        {
          accessorKey: 'seasonPoints',
          id: 'seasonPoints',
          header: viewMode === 'overall' ? 'Total Points' : 'Season Points',
          size: 120,
          Cell: ({ cell }) => (
            <div className="season-points-cell">
              <span className="season-points-value" title={`Season Points: ${cell.getValue()}`}>
                {cell.getValue()}
              </span>
            </div>
          )
        },
        {
          accessorKey: 'trueSkill',
          id: 'trueSkill',
          header: 'TrueSkill',
          size: 100,
          Cell: ({ cell }) => (
            <div className="trueskill-cell">
              <span className="trueskill-rating" title={`TrueSkill: ${cell.getValue().toFixed(1)}`}>
                {cell.getValue().toFixed(1)}
              </span>
            </div>
          )
        },
        {
          accessorKey: 'tournaments',
          id: 'tournaments',
          header: 'Tournaments',
          size: 100
        },
        {
          accessorKey: 'bestPlace',
          id: 'bestPlace',
          header: 'Best Place',
          size: 100,
          Cell: ({ cell }) => (
            <span className="best-place">
              {getMedalEmoji(cell.getValue())}
            </span>
          )
        },
        {
          accessorKey: 'avgPlace',
          id: 'avgPlace',
          header: 'Avg Place',
          size: 100
        }
      )
    }

    if (viewMode === 'tournament') {
      cols.push(
        {
          accessorKey: 'qualifyingPlace',
          id: 'qualifyingPlace',
          header: 'Qualifying',
          size: 100,
          Cell: ({ cell }) => getMedalEmoji(cell.getValue())
        },
        {
          accessorKey: 'eliminationPlace',
          id: 'eliminationPlace',
          header: 'Knockout',
          size: 100,
          Cell: ({ cell }) => cell.getValue() !== null ? getMedalEmoji(cell.getValue()) : '-'
        },
        {
          accessorKey: 'buchholz',
          id: 'buchholz',
          header: 'Buchholz',
          size: 100,
          Cell: ({ cell }) => cell.getValue() || 0
        },
        {
          accessorKey: 'sonnebornBerger',
          id: 'sonnebornBerger',
          header: 'SB',
          size: 100,
          Cell: ({ cell }) => cell.getValue() || 0
        }
      )
    }

    // Common columns
    cols.push(
      {
        accessorKey: 'matches',
        id: 'matches',
        header: 'Matches',
        size: 80
      },
      {
        accessorKey: 'points',
        id: 'points',
        header: 'Points',
        size: 80,
        Cell: ({ cell }) => (
          <div className="points-cell">
            <strong>{cell.getValue()}</strong>
          </div>
        )
      },
      {
        accessorKey: 'won',
        id: 'won',
        header: 'Won',
        size: 80,
        Cell: ({ cell }) => <span className="positive">{cell.getValue()}</span>
      },
      {
        accessorKey: 'lost',
        id: 'lost',
        header: 'Lost',
        size: 80,
        Cell: ({ cell }) => <span className="negative">{cell.getValue()}</span>
      },
      {
        accessorKey: 'winRate',
        id: 'winRate',
        header: 'Win %',
        size: 80,
        Cell: ({ cell }) => {
          const rate = parseFloat(cell.getValue())
          return (
            <span className={`win-rate ${
              rate >= 60 ? 'high' :
              rate >= 40 ? 'medium' : 'low'
            }`}>
              {cell.getValue()}%
            </span>
          )
        }
      },
      {
        accessorKey: 'goalsFor',
        id: 'goalsFor',
        header: 'GF',
        size: 60
      },
      {
        accessorKey: 'goalsAgainst',
        id: 'goalsAgainst',
        header: 'GA',
        size: 60
      },
      {
        accessorKey: 'goalDiff',
        id: 'goalDiff',
        header: 'GD',
        size: 60,
        Cell: ({ cell }) => {
          const diff = cell.getValue()
          return (
            <span className={diff >= 0 ? 'positive' : 'negative'}>
              {diff >= 0 ? '+' : ''}{diff}
            </span>
          )
        }
      },
      {
        accessorKey: 'pointsPerGame',
        id: 'pointsPerGame',
        header: 'PPG',
        size: 80,
        Cell: ({ cell }) => {
          const value = cell.getValue()
          return typeof value === 'number' ? value.toFixed(2) : value
        }
      }
    )

    return cols
  }, [viewMode, onPlayerSelect])

  return (
    <div className="ranking-table-container">
      <div className="table-header">
        <div className="table-header-top">
          <div>
            <h2>
              {viewMode === 'overall' ? 'Overall Rankings' : 
               viewMode === 'season' ? 'Season Rankings' : 
               'Player Rankings'}
            </h2>
            <p className="table-subtitle">
              {viewMode === 'overall' 
                ? `Showing ${players.length} players across all tournaments`
                : viewMode === 'season'
                ? (() => {
                    const qualified = players.filter(p => p.finaleStatus === 'qualified').length
                    const successors = players.filter(p => p.finaleStatus === 'successor').length
                    if (qualified > 0 || successors > 0) {
                      return `Showing ${qualified} qualified players${successors > 0 ? ` + ${successors} potential successors` : ''} (min. 10 games)`
                    }
                    return `Showing ${players.length} players for this season`
                  })()
                : `Showing ${players.length} players`
              }
            </p>
          </div>
          {false && viewMode === 'season' && players.length > 0 && (
            <button 
              className="export-whatsapp-btn"
              onClick={exportToWhatsApp}
              title="Copy ranking to clipboard as WhatsApp message"
            >
              {copied ? '✓ Copied!' : '📱 Export to WhatsApp'}
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <MaterialReactTable
          columns={columns}
          data={players}
          enableStickyHeader
          enableColumnResizing={false}
          enableDensityToggle={false}
          enableFullScreenToggle={false}
          enableHiding={false}
          enablePagination={false}
          enableSorting
          enableGlobalFilter={true}
          renderBottomToolbar={false}
          initialState={{
            sorting: [{
              id: 'rank',
              desc: false
            }]
          }}
          muiTableContainerProps={{
            sx: {
              maxHeight: 'calc(100vh)',
              backgroundColor: 'var(--surface) !important',
              borderRadius: '8px',
              '& .MuiTable-root': {
                borderCollapse: 'separate',
                borderSpacing: 0,
                backgroundColor: 'var(--surface) !important'
              }
            }
          }}
          muiTablePaperProps={{
            sx: {
              boxShadow: 'none',
              backgroundColor: 'var(--surface) !important',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              overflow: 'hidden',
              '& .MuiToolbar-root': {
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)'
              },
              '& *': {
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'var(--border)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'var(--text-secondary)'
                  }
                }
              }
            }
          }}
          muiTableProps={{
            sx: {
              backgroundColor: 'var(--surface)',
              '& .MuiTableHead-root': {
                backgroundColor: 'var(--background)'
              },
              '& .MuiTableBody-root': {
                backgroundColor: 'var(--surface)'
              }
            }
          }}
          muiTableHeadCellProps={{
            sx: {
              backgroundColor: 'var(--background) !important',
              color: 'var(--text-secondary) !important',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.5px',
              borderBottom: '2px solid var(--border)',
              padding: '1rem',
              '&:hover': {
                backgroundColor: 'var(--surface-light) !important',
                color: 'var(--primary-color) !important'
              },
              '& .MuiTableSortLabel-root': {
                color: 'inherit !important',
                '&:hover': {
                  color: 'var(--primary-color) !important'
                },
                '&.Mui-active': {
                  color: 'var(--primary-color) !important'
                },
                '& .MuiTableSortLabel-icon': {
                  color: 'inherit !important'
                }
              }
            }
          }}
          muiTableBodyCellProps={{
            sx: {
              borderBottom: '1px solid var(--border)',
              padding: '1rem',
              fontSize: '0.9375rem',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)'
            }
          }}
          muiTableBodyRowProps={({ row }) => {
            const player = row.original
            const displayPlace = viewMode === 'tournament' ? player.finalPlace : player.place
            const finaleClass = player.finaleStatus === 'qualified' ? 'finale-qualified' : 
                               player.finaleStatus === 'successor' ? 'finale-successor' : ''
            return {
              className: `rank-${displayPlace <= 3 ? displayPlace : ''} ${finaleClass}`,
              sx: {
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                '&:hover': {
                  backgroundColor: 'var(--surface-light) !important'
                },
                '&:nth-of-type(even)': {
                  backgroundColor: 'var(--surface)'
                }
              }
            }
          }}
          muiTopToolbarProps={{
            sx: {
              backgroundColor: 'var(--surface) !important',
              color: 'var(--text-primary) !important',
              borderBottom: '1px solid var(--border)',
              padding: '0.5rem 1rem',
              minHeight: '48px',
              '& .MuiButton-root': {
                color: 'var(--text-primary) !important',
                borderColor: 'var(--border)',
                '&:hover': {
                  backgroundColor: 'var(--surface-light) !important'
                }
              },
              '& .MuiIconButton-root': {
                color: 'var(--text-primary) !important',
                '&:hover': {
                  backgroundColor: 'var(--surface-light) !important'
                }
              },
              '& .MuiTypography-root': {
                color: 'var(--text-secondary) !important'
              },
              '& .MuiInputBase-root': {
                color: 'var(--text-primary) !important',
                backgroundColor: 'var(--surface-light)',
                '& .MuiInputBase-input': {
                  color: 'var(--text-primary) !important',
                  '&::placeholder': {
                    color: 'var(--text-secondary) !important',
                    opacity: 1
                  }
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--border) !important'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary-color) !important'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary-color) !important'
                }
              }
            }
          }}
          muiBottomToolbarProps={{
            sx: {
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)',
              '& .MuiButton-root': {
                color: 'var(--text-primary)',
                '&:hover': {
                  backgroundColor: 'var(--surface-light)'
                }
              },
              '& .MuiTypography-root': {
                color: 'var(--text-secondary)'
              }
            }
          }}
          muiToolbarAlertBannerProps={{
            sx: {
              backgroundColor: 'var(--surface)',
              color: 'var(--text-primary)'
            }
          }}
          muiSearchTextFieldProps={{
            sx: {
              
            }
          }}
        />
      </div>
    </div>
  )
}

export default RankingTable
