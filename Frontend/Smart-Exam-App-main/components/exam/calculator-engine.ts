/**
 * Calculator Engine — handles all calculation logic
 * Supports: Basic, Scientific, Financial, Statistical operations
 */

// ============================================
// FINANCIAL FUNCTIONS
// ============================================

/** Present Value: PV(rate, nper, pmt, fv?, type?) */
export function PV(rate: number, nper: number, pmt: number, fv = 0, type = 0): number {
  if (rate === 0) return -(pmt * nper + fv)
  const pvif = Math.pow(1 + rate, nper)
  return -(fv / pvif + (pmt * (1 + rate * type) * (pvif - 1)) / (rate * pvif))
}

/** Future Value: FV(rate, nper, pmt, pv?, type?) */
export function FV(rate: number, nper: number, pmt: number, pv = 0, type = 0): number {
  if (rate === 0) return -(pv + pmt * nper)
  const pvif = Math.pow(1 + rate, nper)
  return -(pv * pvif + (pmt * (1 + rate * type) * (pvif - 1)) / rate)
}

/** Payment: PMT(rate, nper, pv, fv?, type?) */
export function PMT(rate: number, nper: number, pv: number, fv = 0, type = 0): number {
  if (rate === 0) return -(pv + fv) / nper
  const pvif = Math.pow(1 + rate, nper)
  return (-rate * (fv + pv * pvif)) / ((1 + rate * type) * (pvif - 1))
}

/** Net Present Value: NPV(rate, ...cashflows) */
export function NPV(rate: number, cashflows: number[]): number {
  return cashflows.reduce((npv, cf, i) => npv + cf / Math.pow(1 + rate, i + 1), 0)
}

/** Internal Rate of Return: IRR(cashflows, guess?) — Newton-Raphson */
export function IRR(cashflows: number[], guess = 0.1): number {
  let rate = guess
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0
    let dnpv = 0
    for (let i = 0; i < cashflows.length; i++) {
      const factor = Math.pow(1 + rate, i)
      npv += cashflows[i] / factor
      dnpv -= (i * cashflows[i]) / Math.pow(1 + rate, i + 1)
    }
    if (Math.abs(npv) < 1e-10) return rate
    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < 1e-10) return newRate
    rate = newRate
  }
  return rate // best estimate after 100 iterations
}

/** RATE(nper, pmt, pv, fv?, type?, guess?) — Newton-Raphson */
export function RATE(nper: number, pmt: number, pv: number, fv = 0, type = 0, guess = 0.1): number {
  let rate = guess
  for (let iter = 0; iter < 100; iter++) {
    const pvif = Math.pow(1 + rate, nper)
    const y = pv * pvif + pmt * (1 + rate * type) * (pvif - 1) / rate + fv
    const dy = nper * pv * Math.pow(1 + rate, nper - 1) +
      pmt * (1 + rate * type) * (nper * Math.pow(1 + rate, nper - 1) * rate - (pvif - 1)) / (rate * rate) +
      pmt * type * (pvif - 1) / rate
    const newRate = rate - y / dy
    if (Math.abs(newRate - rate) < 1e-10) return newRate
    rate = newRate
  }
  return rate
}

// ============================================
// STATISTICAL FUNCTIONS
// ============================================

export function SUM(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

export function AVERAGE(values: number[]): number {
  if (values.length === 0) return 0
  return SUM(values) / values.length
}

export function MIN(values: number[]): number {
  return Math.min(...values)
}

export function MAX(values: number[]): number {
  return Math.max(...values)
}

export function COUNT(values: number[]): number {
  return values.length
}

export function STDEV(values: number[]): number {
  if (values.length < 2) return 0
  const avg = AVERAGE(values)
  const squareDiffs = values.map(v => Math.pow(v - avg, 2))
  return Math.sqrt(SUM(squareDiffs) / (values.length - 1))
}

// ============================================
// EXPRESSION EVALUATOR
// ============================================

/**
 * Safe math expression evaluator
 * Supports: +, -, *, /, ^, %, parentheses, and math functions
 */
export function evaluateExpression(expr: string): number {
  // Replace display symbols with operators
  let sanitized = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
    .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
    .replace(/√(\d+\.?\d*)/g, "Math.sqrt($1)")
    .replace(/sin\(/g, "Math.sin(")
    .replace(/cos\(/g, "Math.cos(")
    .replace(/tan\(/g, "Math.tan(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/ln\(/g, "Math.log(")
    .replace(/abs\(/g, "Math.abs(")
    .replace(/(\d+\.?\d*)\^(\d+\.?\d*)/g, "Math.pow($1,$2)")
    .replace(/\^/g, "**")

  // Validate: only allow safe chars
  if (!/^[0-9+\-*/().%,\s\w]*$/.test(sanitized)) {
    throw new Error("Invalid expression")
  }

  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${sanitized})`)
  const result = fn()

  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error("Invalid result")
  }

  return result
}

export type HistoryEntry = {
  expression: string
  result: string
}
