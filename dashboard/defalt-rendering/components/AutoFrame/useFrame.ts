import { useContext } from 'react'
import { AutoFrameContext } from './index'

export function useFrame() {
  return useContext(AutoFrameContext)
}
