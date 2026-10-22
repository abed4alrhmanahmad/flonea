import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetBuilder } from '../context/SetBuilderContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { BUILDER_PATH, SET_ROLES, collectionPathFor } from '../data/setBuilder.js'
import { resolveSet, roleForProduct } from '../lib/customSet.js'

/** "Add to Set" — validates the chosen variant, stores it in the pending set and moves to the next step. */
export function useSetActions() {
  const { draft, setComponent } = useSetBuilder()
  const { notify } = useToast()
  const navigate = useNavigate()

  const addToSet = useCallback(
    (product, selection, quantity = 1) => {
      const role = roleForProduct(product)
      if (!role) {
        notify({ tone: 'error', title: `${product.name} can’t be added to a custom set.` })
        return { error: true }
      }
      const item = { productId: product.id, selection: { ...selection }, quantity }
      const next = { ...draft, [role.id]: item }
      const result = resolveSet(next)
      const error = result.errors.find((e) => e.role === role.id)
      if (error) {
        notify({ tone: 'error', title: error.message })
        return { error: true }
      }

      const replaced = draft[role.id]
      setComponent(role.id, item)
      const component = result.components.find((c) => c?.role === role.id)
      const missing = SET_ROLES.find((r) => !next[r.id])
      notify({
        title: replaced ? `Your set’s ${role.label} was updated` : `${product.name} added to your set`,
        message: missing ? `${component.details}. Next: choose your ${missing.label}.` : `${component.details}. Your set is ready to review.`,
        action: { label: 'Review set', to: BUILDER_PATH },
      })
      navigate(missing ? collectionPathFor(missing) : `${BUILDER_PATH}#your-set`)
      return { error: false }
    },
    [draft, setComponent, notify, navigate],
  )

  return { addToSet }
}
