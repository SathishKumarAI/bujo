import { useContext } from 'react'
import { FlatCards } from './flatCards'

/** A list's "·" bullet, drawn nowhere under `FlatCards` (a phone shows no
 *  symbols, COD-590). Decorative either way, so `aria-hidden`. */
export function Dot({ className }: { className?: string }) {
  return useContext(FlatCards) ? null : <span aria-hidden className={className}>·</span>
}
