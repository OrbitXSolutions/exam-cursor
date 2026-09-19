export interface AnswerSaveState {
  pendingQuestionIds: number[]
  hasError: boolean
}

/** Serializes saves so an older request cannot overwrite a newer answer. */
export class AnswerSaveQueue<T extends { questionId: number }> {
  private pending = new Map<number, { answer: T }>()
  private running: Promise<boolean> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private stopped = false
  private hasError = false

  constructor(
    private save: (answer: T) => Promise<unknown>,
    private changed: (state: AnswerSaveState) => void,
    private retryDelayMs = 3000,
  ) {}

  get hasPending() { return this.pending.size > 0 }

  enqueue(answer: T) {
    if (this.stopped) return
    this.pending.set(answer.questionId, { answer })
    this.publish()
    void this.flush()
  }

  flush(): Promise<boolean> {
    if (this.stopped) return Promise.resolve(!this.hasPending)
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = undefined
    if (this.running) {
      return this.running.then(saved => saved && this.hasPending ? this.flush() : saved)
    }
    this.running = this.drain().finally(() => { this.running = null })
    return this.running
  }

  stop() {
    this.stopped = true
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = undefined
  }

  private publish() {
    if (!this.stopped) this.changed({ pendingQuestionIds: [...this.pending.keys()], hasError: this.hasError })
  }

  private async drain(): Promise<boolean> {
    while (this.pending.size && !this.stopped) {
      const [questionId, entry] = this.pending.entries().next().value!
      try {
        await this.save(entry.answer)
      } catch {
        if (!this.stopped) {
          this.hasError = true
          this.publish()
          this.retryTimer = setTimeout(() => { void this.flush() }, this.retryDelayMs)
        }
        return false
      }
      if (this.stopped) return false
      // A newer edit may have arrived while this request was in flight.
      if (this.pending.get(questionId) === entry) this.pending.delete(questionId)
      if (!this.pending.size) this.hasError = false
      this.publish()
    }
    return !this.pending.size
  }
}
