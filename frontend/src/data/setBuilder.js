/**
 * Build a Set configuration.
 *
 * A custom bedding set is one Pillows & Pillowcases product plus one duvet cover. Each component
 * keeps its own product, size, material, colour and quantity — nothing is forced to match — and
 * the set is priced at the sum of its components' regular catalog prices (no set discount).
 *
 * Every product in a role's categories counts as one self-contained component: a product from the
 * Pillows & Pillowcases collection is never split into a separate pillow and pillowcase, and no
 * extra pillowcase product is added to represent it.
 *
 * Fixed here: role ids, labels and which categories fill each role. Editable in Admin → Build a Set:
 * each role's hint and the pillow quantity limit (read live from the store), plus which products
 * are eligible (`setEligible` on each product).
 */
import { getStoreData } from '../store/store.js'

const roleSettings = (id) => getStoreData().setBuilder.roles[id]

export const SET_ROLES = [
  {
    id: 'pillow',
    label: 'Pillows & Pillowcases',
    unit: ['Pillow Product', 'Pillow Products'],
    collectionId: 'pillows',
    categories: ['pillows', 'pillowcases'],
    get maxQuantity() {
      return roleSettings('pillow').maxQuantity
    },
    missingMessage: 'Add a Pillows & Pillowcases product to your set.',
    get hint() {
      return roleSettings('pillow').hint
    },
    shopLabel: 'Shop Pillows',
  },
  {
    id: 'duvet',
    label: 'Duvet Cover',
    unit: ['Duvet Cover', 'Duvet Covers'],
    collectionId: 'duvet-covers',
    categories: ['duvet-covers'],
    get maxQuantity() {
      return roleSettings('duvet').maxQuantity // one duvet cover per bed
    },
    missingMessage: 'Add a duvet cover to your set.',
    get hint() {
      return roleSettings('duvet').hint
    },
    shopLabel: 'Shop Duvet Covers',
  },
]

export const SET_ROLES_BY_ID = Object.fromEntries(SET_ROLES.map((r) => [r.id, r]))

/** Query parameter that puts collection and product pages into Build a Set mode. */
export const SET_MODE_PARAM = 'mode'
export const SET_MODE_VALUE = 'set'

export const BUILDER_PATH = '/bedding-sets/builder'
export const collectionPathFor = (role, setMode = true) =>
  `/collections/${role.collectionId}${setMode ? `?${SET_MODE_PARAM}=${SET_MODE_VALUE}` : ''}`
