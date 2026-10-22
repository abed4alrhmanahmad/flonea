import { useSearchParams } from 'react-router-dom'
import { SET_MODE_PARAM, SET_MODE_VALUE } from '../data/setBuilder.js'

/** True when the current page was opened from the Build a Set flow (?mode=set). */
export function useSetMode() {
  const [params] = useSearchParams()
  return params.get(SET_MODE_PARAM) === SET_MODE_VALUE
}
