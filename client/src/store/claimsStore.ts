import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Claim } from '../types'

interface ClaimsStore {
  claims: Claim[]
  addClaims: (incoming: Claim[]) => void
  updateClaim: (id: string, patch: Partial<Claim>) => void
  removeClaim: (id: string) => void
}

export const useClaimsStore = create<ClaimsStore>()(
  persist(
    (set) => ({
      claims: [],
      addClaims: (incoming) =>
        set((state) => {
          const existingIds = new Set(state.claims.map(c => c.id))
          const newClaims = incoming.filter(c => !existingIds.has(c.id))
          return { claims: [...state.claims, ...newClaims] }
        }),
      updateClaim: (id, patch) =>
        set((state) => ({
          claims: state.claims.map(c => c.id === id ? { ...c, ...patch } : c),
        })),
      removeClaim: (id) =>
        set((state) => ({ claims: state.claims.filter(c => c.id !== id) })),
    }),
    { name: 'rail-delay-repay-claims' }
  )
)
