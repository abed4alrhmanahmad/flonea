import { useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Check, CircleAlert, Copy, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole } from 'lucide-react'
import { LogoImage } from '../../components/layout/Logo.jsx'
import { useAdminAuth } from '../auth/AdminAuthContext.jsx'
import { DEMO_CREDENTIALS } from '../auth/demoAuthProvider.js'
import { isValidEmail } from '../../lib/validation.js'
import '../admin.css'

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Please enter your email address.'
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address, e.g. name@example.com.'
  if (!password) errors.password = 'Please enter your password.'
  return errors
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }
  return (
    <button type="button" className="adm-copy" onClick={copy} aria-label={copied ? `${label} copied` : `Copy ${label}`}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

export default function LoginPage() {
  const { session, signIn, provider } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const id = useId()
  const [values, setValues] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  useEffect(() => {
    document.title = 'Admin sign in | FLONEA'
  }, [])

  // Return to the admin page the user originally asked for (only admin paths).
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/admin') && !location.state.from.startsWith('/admin/login') ? location.state.from : '/admin'
  if (session) return <Navigate to={from} replace />

  const update = (field) => (e) => {
    const value = field === 'remember' ? e.target.checked : e.target.value
    const next = { ...values, [field]: value }
    setValues(next)
    setFormError('')
    if (submitted) setErrors(validate(next))
  }

  const fillDemo = () => {
    const next = { ...values, email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password }
    setValues(next)
    setErrors(submitted ? validate(next) : {})
    setFormError('')
    passwordRef.current?.focus()
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setSubmitted(true)
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) {
      ;(found.email ? emailRef : passwordRef).current?.focus()
      return
    }
    setLoading(true)
    setFormError('')
    const result = await signIn({ email: values.email, password: values.password, remember: values.remember })
    setLoading(false)
    if (!result.ok) {
      setFormError(result.error)
      passwordRef.current?.select()
      return
    }
    navigate(from, { replace: true })
  }

  const field = (name) => ({
    id: `${id}-${name}`,
    'aria-invalid': Boolean(errors[name]) || undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
  })

  return (
    <div className="adm-login">
      <main className="adm-login__panel" aria-labelledby={`${id}-title`}>
        <Link to="/" className="logo adm-login__logo" aria-label="FLONEA — storefront home">
          <LogoImage alt="" priority />
        </Link>
        <p className="eyebrow">Admin Portal</p>
        <h1 id={`${id}-title`} className="adm-login__title">
          Sign in to manage your store
        </h1>

        {!provider.isAvailable && (
          <p className="adm-login__error" role="alert">
            <CircleAlert size={16} aria-hidden="true" /> The demo admin login is switched off for this build (VITE_ENABLE_DEMO_ADMIN=false).
          </p>
        )}

        <form className="adm-login__form" onSubmit={onSubmit} noValidate aria-busy={loading}>
          {formError && (
            <p className="adm-login__error" role="alert">
              <CircleAlert size={16} aria-hidden="true" /> {formError}
            </p>
          )}

          <div className={`adm-field ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor={`${id}-email`} className="adm-field__label">
              Email
            </label>
            <input ref={emailRef} className="input" type="email" autoComplete="username" inputMode="email" value={values.email} onChange={update('email')} required {...field('email')} />
            {errors.email && (
              <span className="adm-field__error" id={`${id}-email-error`}>
                <CircleAlert size={13} aria-hidden="true" /> {errors.email}
              </span>
            )}
          </div>

          <div className={`adm-field ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor={`${id}-password`} className="adm-field__label">
              Password
            </label>
            <span className="adm-password">
              <input
                ref={passwordRef}
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={values.password}
                onChange={update('password')}
                required
                {...field('password')}
              />
              <button type="button" className="adm-password__toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} aria-controls={`${id}-password`}>
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </span>
            {errors.password && (
              <span className="adm-field__error" id={`${id}-password-error`}>
                <CircleAlert size={13} aria-hidden="true" /> {errors.password}
              </span>
            )}
          </div>

          <label className="checkbox adm-login__remember">
            <input type="checkbox" checked={values.remember} onChange={update('remember')} />
            <span>
              Remember me on this device <span className="muted">(keeps the demo session for 7 days; the password is never stored)</span>
            </span>
          </label>

          <button type="submit" className="btn btn--block adm-login__submit" disabled={loading || !provider.isAvailable}>
            {loading ? (
              <>
                <LoaderCircle size={16} className="adm-spin" aria-hidden="true" /> Signing in…
              </>
            ) : (
              <>
                <LockKeyhole size={15} aria-hidden="true" /> Sign in
              </>
            )}
          </button>
        </form>

        {provider.isAvailable && (
          <section className="adm-demo-access" aria-labelledby={`${id}-demo`}>
            <h2 id={`${id}-demo`} className="adm-demo-access__title">
              <KeyRound size={15} aria-hidden="true" /> Demo Access
            </h2>
            <p className="adm-demo-access__text">Development-only demo credentials. They are not production credentials and this login is not secure authentication.</p>
            <dl className="adm-demo-access__list">
              <div>
                <dt>Email</dt>
                <dd>
                  <code>{DEMO_CREDENTIALS.email}</code>
                  <CopyButton value={DEMO_CREDENTIALS.email} label="demo email" />
                </dd>
              </div>
              <div>
                <dt>Password</dt>
                <dd>
                  <code>{DEMO_CREDENTIALS.password}</code>
                  <CopyButton value={DEMO_CREDENTIALS.password} label="demo password" />
                </dd>
              </div>
            </dl>
            <button type="button" className="text-btn" onClick={fillDemo}>
              Fill in the demo credentials
            </button>
          </section>
        )}

        <p className="adm-login__foot muted">
          Frontend-only demo: the admin session and every change are kept in this browser’s storage. <Link to="/">Back to the store</Link>
        </p>
      </main>
    </div>
  )
}
