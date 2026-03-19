// Chainable, thenable query builder that mirrors the Supabase PostgREST API
import { mockStore } from './store'

type Row = Record<string, unknown>
type Result = { data: unknown; error: null } | { data: null; error: { message: string } }

function ok(data: unknown): Result {
  return { data, error: null }
}

function cloneRows(rows: Row[]): Row[] {
  return rows.map((r) => ({ ...r }))
}

function applySelect(rows: Row[], columns: string): Row[] {
  if (columns === '*') return rows
  const cols = columns.split(',').map((c) => c.trim())
  return rows.map((r) => {
    const out: Row = {}
    for (const col of cols) {
      if (col in r) out[col] = r[col]
    }
    return out
  })
}

type FilterFn = (rows: Row[]) => Row[]

function addEqFilter(filters: FilterFn[], column: string, value: unknown) {
  filters.push((rows) => rows.filter((r) => r[column] === value))
}

function addInFilter(filters: FilterFn[], column: string, values: unknown[]) {
  filters.push((rows) => rows.filter((r) => values.includes(r[column])))
}

function runFilters(rows: Row[], filters: FilterFn[]): Row[] {
  let result = rows
  for (const fn of filters) {
    result = fn(result)
  }
  return result
}

export function createQueryBuilder() {
  return {
    from(table: string) {
      return new TableBuilder(table)
    },
  }
}

class TableBuilder {
  private table: string

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*') {
    return new SelectBuilder(this.table, columns)
  }

  insert(row: Row | Row[]) {
    const rows = Array.isArray(row) ? row : [row]
    const tableData = mockStore.getTable(this.table)

    const inserted: Row[] = []
    for (const r of rows) {
      const newRow: Row = {
        id: r.id ?? crypto.randomUUID(),
        created_at: r.created_at ?? new Date().toISOString(),
        updated_at: r.updated_at ?? new Date().toISOString(),
        ...r,
      }
      tableData.push(newRow)
      inserted.push({ ...newRow })
    }

    return new TerminalBuilder(ok(Array.isArray(row) ? inserted : inserted[0]))
  }

  update(partial: Row) {
    return new UpdateBuilder(this.table, partial)
  }

  upsert(row: Row | Row[]) {
    const rows = Array.isArray(row) ? row : [row]
    const tableData = mockStore.getTable(this.table)

    const upserted: Row[] = []
    for (const r of rows) {
      const idx = tableData.findIndex((existing) => existing.id === r.id)
      if (idx >= 0) {
        tableData[idx] = { ...tableData[idx], ...r, updated_at: new Date().toISOString() }
        upserted.push({ ...tableData[idx] })
      } else {
        const newRow: Row = {
          id: r.id ?? crypto.randomUUID(),
          created_at: r.created_at ?? new Date().toISOString(),
          updated_at: r.updated_at ?? new Date().toISOString(),
          ...r,
        }
        tableData.push(newRow)
        upserted.push({ ...newRow })
      }
    }

    return new TerminalBuilder(ok(Array.isArray(row) ? upserted : upserted[0]))
  }

  delete() {
    return new DeleteBuilder(this.table)
  }
}

class SelectBuilder {
  private table: string
  private columns: string
  private filters: FilterFn[] = []
  private orderCol?: string
  private orderAsc = true
  private limitN?: number
  private isSingle = false

  constructor(table: string, columns: string) {
    this.table = table
    this.columns = columns
  }

  eq(column: string, value: unknown) {
    addEqFilter(this.filters, column, value)
    return this
  }

  in(column: string, values: unknown[]) {
    addInFilter(this.filters, column, values)
    return this
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderCol = column
    this.orderAsc = opts?.ascending ?? true
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  private resolve(): Result {
    const raw = mockStore.getTable(this.table)
    let rows = cloneRows(raw)
    rows = runFilters(rows, this.filters)
    rows = applySelect(rows, this.columns)

    if (this.orderCol) {
      const col = this.orderCol
      const asc = this.orderAsc
      rows.sort((a, b) => {
        const aVal = String(a[col] ?? '')
        const bVal = String(b[col] ?? '')
        return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    }

    if (this.limitN !== undefined) {
      rows = rows.slice(0, this.limitN)
    }

    if (this.isSingle) {
      return rows.length > 0 ? ok(rows[0]) : ok(null)
    }

    return ok(rows)
  }

  then(resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) {
    try {
      const result = this.resolve()
      return Promise.resolve(resolve(result))
    } catch (err) {
      if (reject) return Promise.resolve(reject(err))
      return Promise.reject(err)
    }
  }
}

class UpdateBuilder {
  private table: string
  private partial: Row
  private filters: FilterFn[] = []

  constructor(table: string, partial: Row) {
    this.table = table
    this.partial = partial
  }

  eq(column: string, value: unknown) {
    addEqFilter(this.filters, column, value)
    return this
  }

  in(column: string, values: unknown[]) {
    addInFilter(this.filters, column, values)
    return this
  }

  private resolve(): Result {
    const tableData = mockStore.getTable(this.table)
    const matching = runFilters(tableData, this.filters)
    const matchIds = new Set(matching.map((r) => r.id))

    const updated: Row[] = []
    for (let i = 0; i < tableData.length; i++) {
      if (matchIds.has(tableData[i].id)) {
        tableData[i] = { ...tableData[i], ...this.partial, updated_at: new Date().toISOString() }
        updated.push({ ...tableData[i] })
      }
    }

    return ok(updated)
  }

  then(resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) {
    try {
      return Promise.resolve(resolve(this.resolve()))
    } catch (err) {
      if (reject) return Promise.resolve(reject(err))
      return Promise.reject(err)
    }
  }
}

class DeleteBuilder {
  private table: string
  private filters: FilterFn[] = []

  constructor(table: string) {
    this.table = table
  }

  eq(column: string, value: unknown) {
    addEqFilter(this.filters, column, value)
    return this
  }

  private resolve(): Result {
    const tableData = mockStore.getTable(this.table)
    const matching = runFilters(tableData, this.filters)
    const matchIds = new Set(matching.map((r) => r.id))

    const removed: Row[] = []
    for (let i = tableData.length - 1; i >= 0; i--) {
      if (matchIds.has(tableData[i].id)) {
        removed.push(tableData.splice(i, 1)[0])
      }
    }

    return ok(removed)
  }

  then(resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) {
    try {
      return Promise.resolve(resolve(this.resolve()))
    } catch (err) {
      if (reject) return Promise.resolve(reject(err))
      return Promise.reject(err)
    }
  }
}

class TerminalBuilder {
  private result: Result

  constructor(result: Result) {
    this.result = result
  }

  select() {
    return this
  }

  then(resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) {
    try {
      return Promise.resolve(resolve(this.result))
    } catch (err) {
      if (reject) return Promise.resolve(reject(err))
      return Promise.reject(err)
    }
  }
}
