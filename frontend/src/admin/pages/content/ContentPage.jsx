import { useMemo, useState } from 'react'
import { CircleAlert, CircleCheck, ExternalLink, RotateCcw, Save } from 'lucide-react'
import { DEFAULT_CONTENT } from '../../../data/content.js'
import { useStore } from '../../../store/hooks.js'
import { patchProduct, updateContent } from '../../../store/store.js'
import { useToast } from '../../../context/ToastContext.jsx'
import { useConfirm } from '../../components/ConfirmContext.jsx'
import { useUnsavedChanges } from '../../components/UnsavedChangesContext.jsx'
import { ErrorSummary, PageHeader } from '../../components/ui.jsx'
import { deepClone, isEqualJson } from '../../lib/listUtils.js'
import { validateContent } from './contentValidation.js'
import { AboutSection, AnnouncementSection, FooterSection, HeroSection, HomeSections, MerchandisingSection, NavigationSection, PathSuggestions } from './sections.jsx'

const TABS = [
  { id: 'announcement', label: 'Announcement bar', section: 'announcement', errorPrefixes: ['announcement'], preview: '/' },
  { id: 'hero', label: 'Hero', section: 'home', errorPrefixes: ['hero'], preview: '/' },
  { id: 'merch', label: 'Featured & New Arrivals', section: 'home', errorPrefixes: ['popular'], preview: '/' },
  { id: 'home', label: 'Homepage sections', section: 'home', errorPrefixes: ['categories', 'materials', 'colors', 'builder', 'story', 'testimonials', 'newsletter'], preview: '/' },
  { id: 'navigation', label: 'Navigation', section: 'navigation', errorPrefixes: ['navigation'], preview: '/' },
  { id: 'footer', label: 'Footer', section: 'footer', errorPrefixes: ['footer'], preview: '/' },
  { id: 'about', label: 'About page', section: 'about', errorPrefixes: ['about'], preview: '/about' },
]
const SECTION_NAMES = { announcement: 'announcement bar', home: 'homepage', navigation: 'navigation', footer: 'footer', about: 'About page' }

export default function ContentPage() {
  const { data, catalog } = useStore()
  const { notify } = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState('announcement')
  const [saved, setSaved] = useState(() => deepClone(data.content))
  const [draft, setDraft] = useState(() => deepClone(data.content))
  // Featured / New / Best Seller membership is a product flag; changes wait here until Save.
  const [flagEdits, setFlagEdits] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const errors = validateContent(draft)
  const shown = submitted ? errors : {}
  const dirtySections = Object.keys(SECTION_NAMES).filter((k) => !isEqualJson(draft[k], saved[k]))
  const dirty = dirtySections.length > 0 || Object.keys(flagEdits).length > 0
  useUnsavedChanges(dirty)

  const flagOf = (product, flag) => flagEdits[product.id]?.[flag] ?? product[flag]
  const setFlag = (productId, flag, value) =>
    setFlagEdits((edits) => {
      const product = data.products.find((p) => p.id === productId)
      const next = { ...edits, [productId]: { ...edits[productId], [flag]: value } }
      if (product && product[flag] === value) delete next[productId][flag]
      if (!Object.keys(next[productId]).length) delete next[productId]
      return next
    })

  const optionIndex = useMemo(() => ({ ...catalog.optionIndex, colorsInUse: new Set(catalog.products.flatMap((p) => p.availableColors)) }), [catalog])
  const current = TABS.find((t) => t.id === tab)
  const tabHasError = (t) => submitted && Object.keys(errors).some((k) => t.errorPrefixes.some((p) => k.startsWith(`${p}.`)))
  const setSection = (section) => (value) => setDraft((d) => ({ ...d, [section]: value }))
  const setHome = (key) => (value) => setDraft((d) => ({ ...d, home: { ...d.home, [key]: value } }))

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length) {
      notify({ tone: 'error', title: 'Please fix the highlighted fields', message: Object.values(errors)[0] })
      const firstBad = TABS.find((t) => Object.keys(errors).some((k) => t.errorPrefixes.some((p) => k.startsWith(`${p}.`))))
      if (firstBad) setTab(firstBad.id)
      return
    }
    for (const [productId, flags] of Object.entries(flagEdits)) {
      const product = data.products.find((p) => p.id === productId)
      if (product) patchProduct(productId, flags, `Updated homepage groups for “${product.name}” (${Object.entries(flags).map(([k, v]) => `${k} ${v ? 'on' : 'off'}`).join(', ')}).`)
    }
    for (const section of dirtySections) updateContent(section, draft[section], `Updated ${SECTION_NAMES[section]} content.`)
    setSaved(deepClone(draft))
    setFlagEdits({})
    setSubmitted(false)
    notify({ title: 'Content saved', message: 'The storefront shows the new content now.' })
  }

  const discard = async () => {
    if (!(await confirm({ title: 'Discard all unsaved content changes?', message: 'Every tab goes back to the last saved version.', confirmLabel: 'Discard changes', tone: 'danger' }))) return
    setDraft(deepClone(saved))
    setFlagEdits({})
    setSubmitted(false)
  }

  const resetTab = async () => {
    const section = current.section
    const ok = await confirm({
      title: `Restore the default ${SECTION_NAMES[section]} content?`,
      message: `This replaces the ${SECTION_NAMES[section]} content in the form with the original copy. Nothing changes on the storefront until you save.`,
      confirmLabel: 'Restore defaults',
    })
    if (!ok) return
    if (current.id === 'hero') setHome('hero')(deepClone(DEFAULT_CONTENT.home.hero))
    else if (current.id === 'merch') setHome('popular')(deepClone(DEFAULT_CONTENT.home.popular))
    else if (current.id === 'home') setDraft((d) => ({ ...d, home: { ...deepClone(DEFAULT_CONTENT.home), hero: d.home.hero, popular: d.home.popular } }))
    else setSection(section)(deepClone(DEFAULT_CONTENT[section]))
  }

  return (
    <>
      <PageHeader
        title="Content"
        description="Homepage, navigation, footer and About page content. Saved changes appear on the storefront immediately."
        actions={
          <a href={current.preview} target="_blank" rel="noopener noreferrer" className="btn btn--light btn--sm">
            <ExternalLink size={15} aria-hidden="true" /> View page
          </a>
        }
      />
      <PathSuggestions collections={data.collections} />

      <div className="adm-tabs" role="tablist" aria-label="Content areas">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="adm-tab" onClick={() => setTab(t.id)}>
            {t.label}
            {tabHasError(t) && (
              <span className="adm-tab__count" style={{ color: 'var(--danger)' }}>
                ● <span className="visually-hidden">has errors</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {submitted && <ErrorSummary errors={errors} />}

      <div role="tabpanel" aria-label={current.label} className="adm-stack" style={{ gap: 'var(--space-5)' }}>
        {tab === 'announcement' && <AnnouncementSection value={draft.announcement} onChange={setSection('announcement')} errors={shown} />}
        {tab === 'hero' && <HeroSection value={draft.home.hero} onChange={setHome('hero')} errors={shown} />}
        {tab === 'merch' && <MerchandisingSection value={draft.home.popular} onChange={setHome('popular')} errors={shown} products={data.products} flagOf={flagOf} setFlag={setFlag} />}
        {tab === 'home' && <HomeSections value={draft.home} onChange={setSection('home')} errors={shown} collections={data.collections} optionIndex={optionIndex} />}
        {tab === 'navigation' && <NavigationSection value={draft.navigation} onChange={setSection('navigation')} errors={shown} />}
        {tab === 'footer' && <FooterSection value={draft.footer} onChange={setSection('footer')} errors={shown} />}
        {tab === 'about' && <AboutSection value={draft.about} onChange={setSection('about')} errors={shown} />}
      </div>

      <div className="adm-savebar">
        <span className={`adm-savebar__status ${dirty ? 'is-dirty' : ''}`} role="status">
          {dirty ? <CircleAlert size={15} aria-hidden="true" /> : <CircleCheck size={15} aria-hidden="true" />}
          {dirty ? `Unsaved changes: ${[...dirtySections.map((s) => SECTION_NAMES[s]), ...(Object.keys(flagEdits).length ? ['homepage product groups'] : [])].join(', ')}` : 'All content saved'}
        </span>
        <div className="adm-savebar__actions">
          <button type="button" className="btn btn--light btn--sm" onClick={resetTab}>
            <RotateCcw size={14} aria-hidden="true" /> Restore defaults for this tab
          </button>
          {dirty && (
            <button type="button" className="btn btn--light btn--sm" onClick={discard}>
              Discard
            </button>
          )}
          <button type="button" className="btn btn--sm" onClick={save} disabled={!dirty}>
            <Save size={15} aria-hidden="true" /> Save content
          </button>
        </div>
      </div>
    </>
  )
}
