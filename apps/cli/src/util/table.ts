/* eslint-disable @typescript-eslint/indent */
import chalk from 'chalk'

export interface TableOptions {
  colors?: boolean
  headerColor?: (text: string) => string
  firstColumnColor?: (text: string) => string
  contentColor?: (text: string) => string
  maxColumnWidth?: number
  wrapText?: boolean
}

export const Table = {
  defaultOptions: {
    colors: true,
    headerColor: (text: string) => chalk.white.bold(text),
    firstColumnColor: (text: string) => chalk.magenta(text),
    contentColor: (text: string) => chalk.white(text),
    maxColumnWidth: 30,
    wrapText: true
  } satisfies TableOptions,

  wrapText(text: string, maxWidth: number): string[] {
    if (!text || maxWidth <= 0) return ['']

    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if (word.length > maxWidth) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim())
          currentLine = ''
        }

        for (let i = 0; i < word.length; i += maxWidth) {
          lines.push(word.slice(i, i + maxWidth))
        }
        continue
      }

      const testLine = currentLine ? `${currentLine} ${word}` : word

      if (testLine.length <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine.trim()) {
          lines.push(currentLine.trim())
        }
        currentLine = word
      }
    }

    // Add the last line if it has content
    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }

    return lines.length > 0 ? lines : ['']
  },

  render(headers: string[], rows: string[][], options?: TableOptions): void {
    const result = this.create(headers, rows, options)
    if (result) {
      console.log(result)
    }
  },

  create(headers: string[], rows: string[][], options?: TableOptions): string {
    if (!headers.length || !rows.length) return ''

    const opts = { ...this.defaultOptions, ...options }

    const wrappedHeaders = opts.wrapText
      ? headers.map((header) => this.wrapText(header, opts.maxColumnWidth))
      : headers.map((header) => [header])

    const wrappedRows = opts.wrapText
      ? rows.map((row) =>
          row.map((cell) => this.wrapText(cell || '', opts.maxColumnWidth))
        )
      : rows.map((row) => row.map((cell) => [cell || '']))

    const colWidths = headers.map((_, i) => {
      const headerWidth = Math.max(
        ...wrappedHeaders[i].map((line) => line.length)
      )
      const maxRowWidth = Math.max(
        ...wrappedRows.map((row) =>
          Math.max(...(row[i] || ['']).map((line) => line.length))
        )
      )
      return Math.max(headerWidth, maxRowWidth) + 2
    })

    const createBorder = () => {
      const parts = colWidths.map((width) => '-'.repeat(width))
      return `+${parts.join('+')}+`
    }
    const formatMultiLineRow = (cellLines: string[][], isHeader = false) => {
      const maxLines = Math.max(...cellLines.map((lines) => lines.length))
      const rowLines: string[] = []

      for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
        const cells = cellLines.map((lines, colIndex) => {
          const content = ` ${(lines[lineIndex] || '').padEnd(colWidths[colIndex] - 2)} `

          if (!opts.colors) return content

          if (isHeader && opts.headerColor) {
            return opts.headerColor(content)
          } else if (colIndex === 0 && opts.firstColumnColor) {
            return opts.firstColumnColor(content)
          } else if (opts.contentColor) {
            return opts.contentColor(content)
          }

          return content
        })
        rowLines.push(`|${cells.join('|')}|`)
      }

      return rowLines
    }

    const lines: string[] = []

    lines.push(createBorder())

    const headerLines = formatMultiLineRow(wrappedHeaders, true)
    lines.push(...headerLines)

    lines.push(createBorder())

    wrappedRows.forEach((wrappedRow) => {
      const rowLines = formatMultiLineRow(wrappedRow)
      lines.push(...rowLines)
    })

    lines.push(createBorder())

    return lines.join('\n')
  }
}
