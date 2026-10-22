/**
 * Content editors, one per storefront area. Each edits a slice of the content draft held by
 * ContentPage; nothing is saved until the page's Save button.
 */
import { BENEFIT_ICON_NAMES } from '../../../data/content.js'
import { KNOWN_PATHS } from '../../../lib/links.js'
import ImagePicker from '../../components/ImagePicker.jsx'
import ListEditor from '../../components/ListEditor.jsx'
import { Card, DemoNote, NumberField, ProductThumb, ReorderButtons, SelectField, TextField, Toggle } from '../../components/ui.jsx'
import { makeId } from '../../../store/schema.js'
import { moveItem, removeAt, replaceAt } from '../../lib/listUtils.js'
import { HEX_PATTERN } from '../../lib/productForm.js'

/** Datalist of storefront routes for link fields. */
export function PathSuggestions({ collections }) {
  return (
    <datalist id="adm-paths">
      {[...KNOWN_PATHS, ...collections.map((c) => `/collections/${c.id}`)].filter((v, i, a) => a.indexOf(v) === i).map((p) => (
        <option key={p} value={p} />
      ))}
    </datalist>
  )
}

const LinkField = (props) => <TextField list="adm-paths" placeholder="/shop" {...props} />

export function AnnouncementSection({ value, onChange, errors }) {
  return (
    <Card title="Announcement bar" description="The slim bar above the header. Customers can step through several messages.">
      <div className="adm-stack">
        <Toggle checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="Show the announcement bar" />
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          itemLabel={(a) => a.text || 'New announcement'}
          addLabel="Add announcement"
          max={6}
          newItem={() => ({ id: makeId('ann'), text: '', linkLabel: '', linkTo: '', enabled: true })}
          renderItem={(a, update) => (
            <>
              <div className="adm-form-grid__full">
                <TextField label="Text" value={a.text} onChange={(text) => update({ text })} error={errors[`announcement.${a.id}.text`]} maxLength={140} required />
              </div>
              <TextField label="Link label" value={a.linkLabel} onChange={(linkLabel) => update({ linkLabel })} error={errors[`announcement.${a.id}.linkLabel`]} hint="Optional" />
              <LinkField label="Link destination" value={a.linkTo} onChange={(linkTo) => update({ linkTo })} error={errors[`announcement.${a.id}.linkTo`]} />
            </>
          )}
        />
      </div>
    </Card>
  )
}

export function HeroSection({ value, onChange, errors }) {
  return (
    <Card title="Hero" description="The full-width slides at the top of the homepage. The first slide’s headline is the page’s main heading.">
      <div className="adm-stack">
        <Toggle checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="Show the hero" />
        {errors['hero.slides'] && <p className="adm-field__error">{errors['hero.slides']}</p>}
        <ListEditor
          items={value.slides}
          onChange={(slides) => onChange({ ...value, slides })}
          itemLabel={(s) => [s.title1, s.title2].filter(Boolean).join(' ') || 'New slide'}
          addLabel="Add slide"
          max={6}
          newItem={() => ({ id: makeId('slide'), enabled: true, image: 'hero', eyebrow: '', title1: '', title2: '', text: '', primaryLabel: 'Shop Bedding', primaryTo: '/shop', secondaryLabel: '', secondaryTo: '' })}
          renderItem={(s, update) => (
            <>
              <div className="adm-form-grid__full">
                <ImagePicker label="Hero image" value={s.image} onChange={(image) => update({ image })} error={errors[`hero.${s.id}.image`]} />
              </div>
              <TextField label="Eyebrow" value={s.eyebrow} onChange={(eyebrow) => update({ eyebrow })} hint="Small line above the headline" />
              <span />
              <TextField label="Headline — line 1" value={s.title1} onChange={(title1) => update({ title1 })} error={errors[`hero.${s.id}.title1`]} required />
              <TextField label="Headline — line 2" value={s.title2} onChange={(title2) => update({ title2 })} />
              <div className="adm-form-grid__full">
                <TextField label="Supporting text" multiline rows={2} value={s.text} onChange={(text) => update({ text })} />
              </div>
              <TextField label="Primary button label" value={s.primaryLabel} onChange={(primaryLabel) => update({ primaryLabel })} />
              <LinkField label="Primary button destination" value={s.primaryTo} onChange={(primaryTo) => update({ primaryTo })} error={errors[`hero.${s.id}.primaryTo`]} />
              <TextField label="Secondary button label" value={s.secondaryLabel} onChange={(secondaryLabel) => update({ secondaryLabel })} hint="Optional" />
              <LinkField label="Secondary button destination" value={s.secondaryTo} onChange={(secondaryTo) => update({ secondaryTo })} error={errors[`hero.${s.id}.secondaryTo`]} />
            </>
          )}
        />
      </div>
    </Card>
  )
}

/** Featured / New Arrivals / Best Sellers. Membership is the product flag; order and labels are content. */
export function MerchandisingSection({ value, onChange, errors, products, flagOf, setFlag }) {
  const setTab = (i, patch) => onChange({ ...value, tabs: replaceAt(value.tabs, i, { ...value.tabs[i], ...patch }) })
  return (
    <>
      <Card title="Popular Collections" description="The tabbed product section on the homepage: Best Sellers, New Arrivals and Featured.">
        <div className="adm-form-grid">
          <Toggle checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="Show this section" />
          <span />
          <TextField label="Section heading" value={value.heading} onChange={(heading) => onChange({ ...value, heading })} error={errors['popular.heading']} required />
          <SelectField
            label="Products shown per tab"
            value={String(value.limit)}
            onChange={(v) => onChange({ ...value, limit: Number(v) })}
            options={[4, 8, 12].map((n) => ({ value: String(n), label: `${n} products` }))}
          />
        </div>
      </Card>
      {value.tabs.map((tab, i) => {
        const flagged = products.filter((p) => flagOf(p, tab.flag))
        const position = (id) => (tab.order.indexOf(id) === -1 ? Infinity : tab.order.indexOf(id))
        const ordered = flagged.map((p, idx) => ({ p, idx })).sort((a, b) => position(a.p.id) - position(b.p.id) || a.idx - b.idx).map(({ p }) => p)
        const addable = products.filter((p) => !flagOf(p, tab.flag))
        const move = (from, to) => setTab(i, { order: moveItem(ordered.map((p) => p.id), from, to) })
        return (
          <Card key={tab.id} title={tab.label || tab.id} description={`Products marked “${{ bestSeller: 'Best Seller', isNew: 'New Arrival', featured: 'Featured' }[tab.flag]}”. Order here = order on the homepage. Only active products are shown to customers.`}>
            <div className="adm-stack">
              <div className="adm-form-grid">
                <TextField label="Tab label (heading)" value={tab.label} onChange={(label) => setTab(i, { label })} error={errors[`popular.${tab.id}.label`]} required />
                <LinkField label="“View all” destination" value={tab.link} onChange={(link) => setTab(i, { link })} error={errors[`popular.${tab.id}.link`]} />
                <Toggle checked={tab.enabled} onChange={(enabled) => setTab(i, { enabled })} label="Show this tab" />
              </div>
              {ordered.length ? (
                <ol className="adm-ordered" role="list">
                  {ordered.map((p, idx) => (
                    <li key={p.id}>
                      <span className="adm-ordered__pos">{idx + 1}</span>
                      <span className="adm-ordered__main">
                        <ProductThumb product={p} meta={p.status === 'active' ? (idx < value.limit ? 'Shown on the homepage' : `Beyond the first ${value.limit} — not shown`) : `${p.status} — hidden from customers`} />
                      </span>
                      <ReorderButtons index={idx} count={ordered.length} label={p.name} removeLabel={`Remove ${p.name} from ${tab.label}`} onMove={move} onRemove={() => setFlag(p.id, tab.flag, false)} />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">No products in this group yet.</p>
              )}
              <label className="adm-field" style={{ maxWidth: 420 }}>
                <span className="adm-field__label">Add a product</span>
                <select
                  className="select"
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return
                    setFlag(e.target.value, tab.flag, true)
                    setTab(i, { order: [...ordered.map((p) => p.id), e.target.value] })
                  }}
                >
                  <option value="">— Choose a product —</option>
                  {addable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.status !== 'active' ? ` (${p.status})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>
        )
      })}
    </>
  )
}

export function HomeSections({ value, onChange, errors, collections, optionIndex }) {
  const set = (key, patch) => onChange({ ...value, [key]: { ...value[key], ...patch } })
  const collectionOptions = collections.map((c) => ({ value: c.id, label: `${c.title}${c.enabled ? '' : ' (disabled)'}` }))
  return (
    <>
      <Card title="Shop by Category" description="Collection cards under the hero.">
        <div className="adm-stack">
          <div className="adm-form-grid">
            <Toggle checked={value.categories.enabled} onChange={(enabled) => set('categories', { enabled })} label="Show this section" />
            <span />
            <TextField label="Heading" value={value.categories.heading} onChange={(heading) => set('categories', { heading })} />
            <TextField label="Subheading" value={value.categories.subheading} onChange={(subheading) => set('categories', { subheading })} />
          </div>
          <ListEditor
            items={value.categories.cards}
            onChange={(cards) => set('categories', { cards })}
            itemLabel={(c) => c.name || collections.find((x) => x.id === c.collectionId)?.title || 'New card'}
            addLabel="Add card"
            max={6}
            newItem={() => ({ id: makeId('card'), collectionId: collections[0]?.id ?? '', name: '', blurb: '', image: '', enabled: true })}
            renderItem={(c, update) => (
              <>
                <SelectField label="Collection" value={c.collectionId} onChange={(collectionId) => update({ collectionId })} options={[{ value: '', label: '— Choose —' }, ...collectionOptions]} error={errors[`categories.${c.id}.collectionId`]} />
                <TextField label="Card title" value={c.name} onChange={(name) => update({ name })} hint="Empty = the collection name" />
                <div className="adm-form-grid__full">
                  <TextField label="Short text" value={c.blurb} onChange={(blurb) => update({ blurb })} />
                </div>
                <div className="adm-form-grid__full">
                  <ImagePicker label="Card image" value={c.image} onChange={(image) => update({ image })} error={errors[`categories.${c.id}.image`]} allowEmpty hint="Empty = the collection banner" />
                </div>
              </>
            )}
          />
        </div>
      </Card>

      <Card title="Materials band" description="The full-width band with four benefits.">
        <div className="adm-stack">
          <div className="adm-form-grid">
            <Toggle checked={value.materials.enabled} onChange={(enabled) => set('materials', { enabled })} label="Show this section" />
            <span />
            <TextField label="Heading — line 1" value={value.materials.heading1} onChange={(heading1) => set('materials', { heading1 })} />
            <TextField label="Heading — line 2" value={value.materials.heading2} onChange={(heading2) => set('materials', { heading2 })} />
            <div className="adm-form-grid__full">
              <ImagePicker label="Background image" value={value.materials.image} onChange={(image) => set('materials', { image })} error={errors['materials.image']} />
            </div>
          </div>
          <ListEditor
            items={value.materials.benefits}
            onChange={(benefits) => set('materials', { benefits })}
            itemLabel={(b) => b.title || 'New benefit'}
            addLabel="Add benefit"
            max={6}
            newItem={() => ({ id: makeId('benefit'), icon: 'Leaf', title: '', text: '' })}
            renderItem={(b, update) => (
              <>
                <SelectField label="Icon" value={b.icon} onChange={(icon) => update({ icon })} options={BENEFIT_ICON_NAMES.map((n) => ({ value: n, label: n }))} />
                <TextField label="Title" value={b.title} onChange={(title) => update({ title })} error={errors[`materials.${b.id}.title`]} required />
                <div className="adm-form-grid__full">
                  <TextField label="Text" multiline rows={2} value={b.text} onChange={(text) => update({ text })} />
                </div>
              </>
            )}
          />
        </div>
      </Card>

      <Card title="Shop by Color" description="Colour chips that open the shop (or a collection) filtered by that colour.">
        <div className="adm-stack">
          <div className="adm-form-grid">
            <Toggle checked={value.colors.enabled} onChange={(enabled) => set('colors', { enabled })} label="Show this section" />
            <span />
            <TextField label="Heading" value={value.colors.heading} onChange={(heading) => set('colors', { heading })} />
            <TextField label="“View all” link label" value={value.colors.linkLabel} onChange={(linkLabel) => set('colors', { linkLabel })} hint="Empty hides the link" />
          </div>
          <datalist id="adm-color-ids">
            {Object.keys(optionIndex.color).map((id) => (
              <option key={id} value={id}>
                {optionIndex.color[id].name}
              </option>
            ))}
          </datalist>
          <ListEditor
            items={value.colors.chips}
            onChange={(chips) => set('colors', { chips })}
            itemLabel={(c) => c.name || 'New colour'}
            addLabel="Add colour"
            max={12}
            newItem={() => ({ id: makeId('chip'), colorId: '', name: '', hex: '#FFFFFF', collectionId: '', enabled: true })}
            renderItem={(c, update) => {
              const offered = Boolean(optionIndex.color[c.colorId]) && optionIndex.colorsInUse.has(c.colorId)
              return (
                <>
                  <TextField
                    label="Colour id (filter value)"
                    value={c.colorId}
                    list="adm-color-ids"
                    onChange={(colorId) => {
                      const known = optionIndex.color[colorId]
                      update({ colorId, ...(known && !c.name ? { name: known.name, hex: known.hex } : {}) })
                    }}
                    error={errors[`colors.${c.id}.colorId`]}
                    hint={c.colorId && !offered ? 'No active product offers this colour yet — the link would show no results.' : 'Matches products with this colour id'}
                  />
                  <TextField label="Label" value={c.name} onChange={(name) => update({ name })} error={errors[`colors.${c.id}.name`]} />
                  <div className="adm-field">
                    <span className="adm-field__label">Swatch</span>
                    <span className="adm-swatch-input">
                      <input type="color" aria-label={`Pick ${c.name || 'colour'}`} value={HEX_PATTERN.test(c.hex) && c.hex.length === 7 ? c.hex : '#ffffff'} onChange={(e) => update({ hex: e.target.value.toUpperCase() })} />
                      <input className="input" value={c.hex} maxLength={7} onChange={(e) => update({ hex: e.target.value })} aria-label={`${c.name || 'Colour'} hex value`} />
                      <span className="adm-swatch" style={{ background: HEX_PATTERN.test(c.hex) ? c.hex : 'transparent' }} aria-hidden="true" />
                    </span>
                    {errors[`colors.${c.id}.hex`] && <span className="adm-field__error">{errors[`colors.${c.id}.hex`]}</span>}
                  </div>
                  <SelectField label="Links to" value={c.collectionId} onChange={(collectionId) => update({ collectionId })} options={[{ value: '', label: 'All products (/shop)' }, ...collectionOptions]} />
                </>
              )
            }}
          />
        </div>
      </Card>

      <Card title="Build a Set promotion" description="The homepage block that introduces the set builder.">
        <div className="adm-form-grid">
          <Toggle checked={value.builder.enabled} onChange={(enabled) => set('builder', { enabled })} label="Show this section" />
          <span />
          <TextField label="Eyebrow" value={value.builder.eyebrow} onChange={(eyebrow) => set('builder', { eyebrow })} />
          <TextField label="Heading" value={value.builder.heading} onChange={(heading) => set('builder', { heading })} error={errors['builder.heading']} />
          <div className="adm-form-grid__full">
            <TextField label="Text" multiline rows={3} value={value.builder.text} onChange={(text) => set('builder', { text })} />
          </div>
          {value.builder.bullets.map((b, i) => (
            <div key={i} className="adm-inline adm-form-grid__full">
              <input className="input" value={b} aria-label={`Bullet ${i + 1}`} onChange={(e) => set('builder', { bullets: replaceAt(value.builder.bullets, i, e.target.value) })} />
              <ReorderButtons index={i} count={value.builder.bullets.length} label={`bullet ${i + 1}`} onMove={(from, to) => set('builder', { bullets: moveItem(value.builder.bullets, from, to) })} onRemove={(index) => set('builder', { bullets: removeAt(value.builder.bullets, index) })} />
            </div>
          ))}
          <div className="adm-form-grid__full">
            <button type="button" className="btn btn--light btn--sm" onClick={() => set('builder', { bullets: [...value.builder.bullets, ''] })} disabled={value.builder.bullets.length >= 5}>
              Add bullet
            </button>
          </div>
          <TextField label="Button label" value={value.builder.buttonLabel} onChange={(buttonLabel) => set('builder', { buttonLabel })} hint="Links to the set builder" />
          <span />
          <div className="adm-form-grid__full">
            <ImagePicker label="Image" value={value.builder.image} onChange={(image) => set('builder', { image })} error={errors['builder.image']} />
          </div>
        </div>
      </Card>

      <Card title="Brand story" description="The image-and-text block that links to the About page.">
        <div className="adm-form-grid">
          <Toggle checked={value.story.enabled} onChange={(enabled) => set('story', { enabled })} label="Show this section" />
          <span />
          <TextField label="Heading — line 1" value={value.story.heading1} onChange={(heading1) => set('story', { heading1 })} />
          <TextField label="Heading — line 2" value={value.story.heading2} onChange={(heading2) => set('story', { heading2 })} />
          <div className="adm-form-grid__full">
            <TextField label="Text" multiline rows={3} value={value.story.text} onChange={(text) => set('story', { text })} />
          </div>
          <div className="adm-form-grid__full">
            <ImagePicker label="Image" value={value.story.image} onChange={(image) => set('story', { image })} error={errors['story.image']} />
          </div>
          <TextField label="Image alt text" value={value.story.imageAlt} onChange={(imageAlt) => set('story', { imageAlt })} />
          <span />
          <TextField label="Button label" value={value.story.buttonLabel} onChange={(buttonLabel) => set('story', { buttonLabel })} hint="Empty hides the button" />
          <LinkField label="Button destination" value={value.story.buttonTo} onChange={(buttonTo) => set('story', { buttonTo })} error={errors['story.buttonTo']} />
        </div>
      </Card>

      <Card title="Testimonials (demo)" description="Customer quotes on the homepage. These are demo testimonials: each one is always labelled “Sample review” on the storefront.">
        <div className="adm-stack">
          <DemoNote>Don’t present invented quotes as real customer reviews. The storefront labels every testimonial as a sample.</DemoNote>
          <div className="adm-form-grid">
            <Toggle checked={value.testimonials.enabled} onChange={(enabled) => set('testimonials', { enabled })} label="Show this section" />
            <span />
            <TextField label="Heading" value={value.testimonials.heading} onChange={(heading) => set('testimonials', { heading })} />
            <TextField label="Note under the heading" value={value.testimonials.note} onChange={(note) => set('testimonials', { note })} hint="Keep a note that these are samples" />
          </div>
          <ListEditor
            items={value.testimonials.items}
            onChange={(items) => set('testimonials', { items })}
            itemLabel={(r) => (r.name ? `${r.name} (demo)` : 'New demo testimonial')}
            addLabel="Add demo testimonial"
            max={9}
            newItem={() => ({ id: makeId('review'), enabled: true, name: '', location: '', rating: 5, product: '', text: '' })}
            renderItem={(r, update) => (
              <>
                <TextField label="Name" value={r.name} onChange={(name) => update({ name })} error={errors[`testimonials.${r.id}.name`]} required />
                <TextField label="Location" value={r.location} onChange={(location) => update({ location })} />
                <NumberField label="Rating (1–5)" min="1" max="5" step="1" value={r.rating} onChange={(v) => update({ rating: v === '' ? 0 : Number(v) })} error={errors[`testimonials.${r.id}.rating`]} />
                <TextField label="Product" value={r.product} onChange={(product) => update({ product })} />
                <div className="adm-form-grid__full">
                  <TextField label="Quote" multiline rows={3} value={r.text} onChange={(text) => update({ text })} error={errors[`testimonials.${r.id}.text`]} required />
                </div>
              </>
            )}
          />
        </div>
      </Card>

      <Card title="Newsletter" description="The sign-up band near the bottom of the homepage. Demo only: addresses are checked in the browser and never sent anywhere.">
        <div className="adm-form-grid">
          <Toggle checked={value.newsletter.enabled} onChange={(enabled) => set('newsletter', { enabled })} label="Show this section" />
          <span />
          <TextField label="Heading" value={value.newsletter.heading} onChange={(heading) => set('newsletter', { heading })} error={errors['newsletter.heading']} />
          <TextField label="Button label" value={value.newsletter.buttonLabel} onChange={(buttonLabel) => set('newsletter', { buttonLabel })} />
          <div className="adm-form-grid__full">
            <TextField label="Text" multiline rows={2} value={value.newsletter.text} onChange={(text) => set('newsletter', { text })} />
          </div>
        </div>
      </Card>
    </>
  )
}

export function NavigationSection({ value, onChange, errors }) {
  return (
    <Card title="Header navigation" description="Links in the header and mobile menu. Use existing site paths so every link keeps working.">
      <div className="adm-stack">
        <ListEditor
          items={value.links}
          onChange={(links) => onChange({ ...value, links })}
          itemLabel={(l) => l.label || 'New link'}
          addLabel="Add link"
          max={9}
          newItem={() => ({ id: makeId('nav'), label: '', to: '/', enabled: true })}
          renderItem={(l, update) => (
            <>
              <TextField label="Label" value={l.label} onChange={(label) => update({ label })} error={errors[`navigation.${l.id}.label`]} required />
              <LinkField label="Destination" value={l.to} onChange={(to) => update({ to })} error={errors[`navigation.${l.id}.to`]} required />
            </>
          )}
        />
        <div className="adm-form-grid">
          <Toggle checked={value.showBuildSet} onChange={(showBuildSet) => onChange({ ...value, showBuildSet })} label="Show the Build a Set link" description="Highlighted link to /bedding-sets/builder" />
          <TextField label="Build a Set link label" value={value.buildSetLabel} onChange={(buildSetLabel) => onChange({ ...value, buildSetLabel })} error={errors['navigation.buildSetLabel']} />
        </div>
      </div>
    </Card>
  )
}

export function FooterSection({ value, onChange, errors }) {
  return (
    <>
      <Card title="Footer" description="Brand text, link columns, newsletter text and the bottom line. Contact details and social links are edited in Settings.">
        <div className="adm-form-grid">
          <div className="adm-form-grid__full">
            <TextField label="Tagline" value={value.tagline} onChange={(tagline) => onChange({ ...value, tagline })} />
          </div>
          <Toggle checked={value.showContact} onChange={(showContact) => onChange({ ...value, showContact })} label="Show contact email & phone" description="From Settings → Contact" />
          <span />
          <TextField label="Newsletter heading" value={value.newsletterHeading} onChange={(newsletterHeading) => onChange({ ...value, newsletterHeading })} />
          <TextField label="Newsletter text" value={value.newsletterText} onChange={(newsletterText) => onChange({ ...value, newsletterText })} />
          <div className="adm-form-grid__full">
            <TextField label="Bottom line" value={value.bottomNote} onChange={(bottomNote) => onChange({ ...value, bottomNote })} hint="After “© year Store name.”" />
          </div>
        </div>
      </Card>
      <Card title="Footer link columns">
        <ListEditor
          items={value.columns}
          onChange={(columns) => onChange({ ...value, columns })}
          itemLabel={(c) => c.title || 'New column'}
          addLabel="Add column"
          max={4}
          newItem={() => ({ id: makeId('col'), title: '', links: [] })}
          renderItem={(col, update) => (
            <>
              <div className="adm-form-grid__full">
                <TextField label="Column title" value={col.title} onChange={(title) => update({ title })} error={errors[`footer.${col.id}.title`]} required />
              </div>
              <div className="adm-form-grid__full">
                <ListEditor
                  items={col.links}
                  onChange={(links) => update({ links })}
                  itemLabel={(l) => l.label || 'New link'}
                  addLabel="Add link"
                  max={10}
                  newItem={() => ({ id: makeId('flink'), label: '', to: '/' })}
                  renderItem={(l, updateLink) => (
                    <>
                      <TextField label="Label" value={l.label} onChange={(label) => updateLink({ label })} error={errors[`footer.${l.id}.label`]} />
                      <LinkField label="Destination" value={l.to} onChange={(to) => updateLink({ to })} error={errors[`footer.${l.id}.to`]} />
                    </>
                  )}
                />
              </div>
            </>
          )}
        />
      </Card>
    </>
  )
}

export function AboutSection({ value, onChange, errors }) {
  const set = (patch) => onChange({ ...value, ...patch })
  return (
    <>
      <Card title="About page — hero & introduction">
        <div className="adm-form-grid">
          <TextField label="Eyebrow" value={value.heroEyebrow} onChange={(heroEyebrow) => set({ heroEyebrow })} />
          <TextField label="Title" value={value.heroTitle} onChange={(heroTitle) => set({ heroTitle })} error={errors['about.heroTitle']} required />
          <div className="adm-form-grid__full">
            <ImagePicker label="Hero image" value={value.heroImage} onChange={(heroImage) => set({ heroImage })} error={errors['about.heroImage']} />
          </div>
          <div className="adm-form-grid__full">
            <TextField label="Introduction heading" value={value.introHeading} onChange={(introHeading) => set({ introHeading })} />
          </div>
          {value.introParagraphs.map((p, i) => (
            <div key={i} className="adm-form-grid__full adm-inline" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <TextField label={`Paragraph ${i + 1}`} multiline rows={3} value={p} onChange={(v) => set({ introParagraphs: replaceAt(value.introParagraphs, i, v) })} />
              </div>
              <ReorderButtons index={i} count={value.introParagraphs.length} label={`paragraph ${i + 1}`} onMove={(from, to) => set({ introParagraphs: moveItem(value.introParagraphs, from, to) })} onRemove={(index) => set({ introParagraphs: removeAt(value.introParagraphs, index) })} />
            </div>
          ))}
          <div className="adm-form-grid__full">
            <button type="button" className="btn btn--light btn--sm" onClick={() => set({ introParagraphs: [...value.introParagraphs, ''] })} disabled={value.introParagraphs.length >= 5}>
              Add paragraph
            </button>
          </div>
        </div>
      </Card>
      <Card title="About page — design philosophy">
        <div className="adm-stack">
          <div className="adm-form-grid">
            <TextField label="Eyebrow" value={value.philosophyEyebrow} onChange={(philosophyEyebrow) => set({ philosophyEyebrow })} />
            <TextField label="Heading" value={value.philosophyHeading} onChange={(philosophyHeading) => set({ philosophyHeading })} />
            <div className="adm-form-grid__full">
              <ImagePicker label="Image" value={value.philosophyImage} onChange={(philosophyImage) => set({ philosophyImage })} error={errors['about.philosophyImage']} />
            </div>
          </div>
          <ListEditor
            items={value.principles}
            onChange={(principles) => set({ principles })}
            itemLabel={(p) => p.title || 'New principle'}
            addLabel="Add principle"
            max={6}
            newItem={() => ({ id: makeId('pr'), title: '', text: '' })}
            renderItem={(p, update) => (
              <>
                <TextField label="Title" value={p.title} onChange={(title) => update({ title })} error={errors[`about.${p.id}.title`]} required />
                <div className="adm-form-grid__full">
                  <TextField label="Text" multiline rows={2} value={p.text} onChange={(text) => update({ text })} />
                </div>
              </>
            )}
          />
        </div>
      </Card>
      <Card title="About page — our approach">
        <div className="adm-form-grid">
          <TextField label="Eyebrow" value={value.approachEyebrow} onChange={(approachEyebrow) => set({ approachEyebrow })} />
          <TextField label="Heading" value={value.approachHeading} onChange={(approachHeading) => set({ approachHeading })} />
          <div className="adm-form-grid__full">
            <TextField label="Text" multiline rows={3} value={value.approachText} onChange={(approachText) => set({ approachText })} />
          </div>
          <div className="adm-form-grid__full">
            <ImagePicker label="Image" value={value.approachImage} onChange={(approachImage) => set({ approachImage })} error={errors['about.approachImage']} />
          </div>
        </div>
        <p className="adm-field__hint" style={{ marginTop: 'var(--space-3)' }}>
          The “Our fabrics” tiles on the About page describe the material library and aren’t edited here.
        </p>
      </Card>
    </>
  )
}
