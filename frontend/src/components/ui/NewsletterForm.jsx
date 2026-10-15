import { useId, useState } from 'react'
import { ArrowRight, CircleAlert, CircleCheck } from 'lucide-react'
import { isValidEmail } from '../../lib/validation.js'

/** Demo newsletter sign-up — validates locally, nothing is sent anywhere. */
export default function NewsletterForm({ variant = 'inline', buttonLabel }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | error | success
  const [message, setMessage] = useState('')
  const id = useId()

  const onSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setStatus('error')
      setMessage('Please enter your email address.')
    } else if (!isValidEmail(email)) {
      setStatus('error')
      setMessage('Please enter a valid email address, e.g. name@example.com.')
    } else {
      setStatus('success')
      setMessage(`Thank you — ${email.trim()} is on the list. (Demo: no email is actually sent.)`)
      setEmail('')
    }
  }

  return (
    <form className={`newsletter newsletter--${variant}`} onSubmit={onSubmit} noValidate>
      <label htmlFor={`${id}-email`} className="visually-hidden">
        Email address
      </label>
      <div className="newsletter__row">
        <input
          id={`${id}-email`}
          className="input newsletter__input"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          aria-invalid={status === 'error'}
          aria-describedby={`${id}-msg`}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status !== 'idle') setStatus('idle')
          }}
        />
        <button type="submit" className={buttonLabel ? 'btn' : 'newsletter__submit'} aria-label={buttonLabel ? undefined : 'Subscribe'}>
          {buttonLabel ?? <ArrowRight size={16} />}
        </button>
      </div>
      <p id={`${id}-msg`} className={`newsletter__msg is-${status}`} aria-live="polite">
        {status === 'error' && <CircleAlert size={14} aria-hidden="true" />}
        {status === 'success' && <CircleCheck size={14} aria-hidden="true" />}
        {status !== 'idle' && message}
      </p>
    </form>
  )
}
